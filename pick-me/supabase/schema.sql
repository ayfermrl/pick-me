create table if not exists public.rooms (
  id text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null,
  participants jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  is_anonymous boolean not null default true,
  require_name boolean not null default true,
  is_started boolean not null default false,
  results_released boolean not null default false,
  active_question_index integer not null default 0,
  show_summary boolean not null default false,
  votes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.room_questions (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  position integer not null,
  text text not null,
  answer_mode text not null check (answer_mode in ('participants', 'custom')),
  custom_options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.room_participants (
  id bigserial primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  name text not null,
  voter_key text not null,
  created_at timestamptz not null default now(),
  unique (room_id, voter_key)
);

create table if not exists public.room_votes (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  question_id text not null,
  answer text not null,
  voter_name text not null,
  voter_key text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (room_id, question_id, voter_key)
);

create index if not exists room_questions_room_position_idx on public.room_questions(room_id, position);
create index if not exists room_participants_room_idx on public.room_participants(room_id);
create index if not exists room_votes_room_question_idx on public.room_votes(room_id, question_id);

alter table public.rooms enable row level security;
alter table public.room_questions enable row level security;
alter table public.room_participants enable row level security;
alter table public.room_votes enable row level security;

alter table public.rooms
add column if not exists is_started boolean not null default false;

alter table public.rooms
add column if not exists results_released boolean not null default false;

drop policy if exists "rooms are readable by link" on public.rooms;
create policy "rooms are readable by link"
on public.rooms
for select
to anon, authenticated
using (true);

drop policy if exists "authenticated users create own rooms" on public.rooms;
create policy "authenticated users create own rooms"
on public.rooms
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "rooms can be updated by clients" on public.rooms;
drop policy if exists "room owners can update own rooms" on public.rooms;
create policy "room owners can update own rooms"
on public.rooms
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "room questions readable by link" on public.room_questions;
create policy "room questions readable by link"
on public.room_questions
for select
to anon, authenticated
using (true);

drop policy if exists "room owners manage questions" on public.room_questions;
create policy "room owners manage questions"
on public.room_questions
for all
to authenticated
using (exists (select 1 from public.rooms where rooms.id = room_questions.room_id and rooms.owner_id = auth.uid()))
with check (exists (select 1 from public.rooms where rooms.id = room_questions.room_id and rooms.owner_id = auth.uid()));

drop policy if exists "room participants readable by link" on public.room_participants;
create policy "room participants readable by link"
on public.room_participants
for select
to anon, authenticated
using (true);

drop policy if exists "room owners manage participants" on public.room_participants;
create policy "room owners manage participants"
on public.room_participants
for all
to authenticated
using (exists (select 1 from public.rooms where rooms.id = room_participants.room_id and rooms.owner_id = auth.uid()))
with check (exists (select 1 from public.rooms where rooms.id = room_participants.room_id and rooms.owner_id = auth.uid()));

drop policy if exists "room votes readable by link" on public.room_votes;
create policy "room votes readable by link"
on public.room_votes
for select
to anon, authenticated
using (true);

create or replace function public.normalize_voter_key(value text)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(value, '')));
$$;

create or replace function public.join_room(p_room_id text, p_name text)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.rooms;
  clean_name text := trim(coalesce(p_name, ''));
  clean_key text := public.normalize_voter_key(p_name);
begin
  select * into target_room from public.rooms where id = p_room_id;
  if not found then
    return null;
  end if;
  if clean_name = '' then
    return target_room;
  end if;

  if not exists (
    select 1 from jsonb_array_elements_text(target_room.participants) participant
    where public.normalize_voter_key(participant) = clean_key
  ) then
    update public.rooms
    set participants = participants || to_jsonb(clean_name)
    where id = p_room_id
    returning * into target_room;
  end if;

  insert into public.room_participants(room_id, name, voter_key)
  values (p_room_id, clean_name, clean_key)
  on conflict (room_id, voter_key) do nothing;

  return target_room;
end;
$$;

create or replace function public.remove_room_participant(p_room_id text, p_name text)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.rooms;
  clean_key text := public.normalize_voter_key(p_name);
begin
  select * into target_room from public.rooms where id = p_room_id;
  if not found then
    return null;
  end if;
  if target_room.owner_id <> auth.uid() then
    raise exception 'Katılımcıyı sadece oda sahibi çıkarabilir.';
  end if;

  update public.rooms
  set
    participants = coalesce((
      select jsonb_agg(participant)
      from jsonb_array_elements_text(participants) participant
      where public.normalize_voter_key(participant) <> clean_key
    ), '[]'::jsonb),
    votes = coalesce((
      select jsonb_agg(vote)
      from jsonb_array_elements(votes) vote
      where coalesce(vote->>'voterKey', public.normalize_voter_key(vote->>'voterName')) <> clean_key
    ), '[]'::jsonb)
  where id = p_room_id
  returning * into target_room;

  delete from public.room_participants where room_id = p_room_id and voter_key = clean_key;
  delete from public.room_votes where room_id = p_room_id and voter_key = clean_key;

  return target_room;
end;
$$;

create or replace function public.start_room(p_room_id text)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.rooms;
begin
  update public.rooms
  set is_started = true, active_question_index = 0, show_summary = false
  where id = p_room_id and owner_id = auth.uid()
  returning * into target_room;
  if not found then
    raise exception 'Oyunu sadece oda sahibi başlatabilir.';
  end if;
  return target_room;
end;
$$;

create or replace function public.set_room_active_question(p_room_id text, p_active_question_index integer)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.rooms;
begin
  update public.rooms
  set active_question_index = greatest(0, least(p_active_question_index, jsonb_array_length(questions) - 1)), show_summary = false
  where id = p_room_id and owner_id = auth.uid()
  returning * into target_room;
  if not found then
    raise exception 'Soru geçişini sadece oda sahibi yönetebilir.';
  end if;
  return target_room;
end;
$$;

create or replace function public.show_room_summary(p_room_id text)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.rooms;
begin
  update public.rooms
  set show_summary = true
  where id = p_room_id and owner_id = auth.uid()
  returning * into target_room;
  if not found then
    raise exception 'Özeti sadece oda sahibi açabilir.';
  end if;
  return target_room;
end;
$$;

create or replace function public.release_room_results(p_room_id text)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.rooms;
  participant text;
  answered_count integer;
begin
  select * into target_room from public.rooms where id = p_room_id;
  if not found then
    return null;
  end if;
  if target_room.owner_id <> auth.uid() then
    raise exception 'Sonuçları sadece oda sahibi açabilir.';
  end if;
  for participant in select jsonb_array_elements_text(target_room.participants) loop
    select count(distinct vote->>'questionId') into answered_count
    from jsonb_array_elements(target_room.votes) vote
    where coalesce(vote->>'voterKey', public.normalize_voter_key(vote->>'voterName')) = public.normalize_voter_key(participant);
    if answered_count < jsonb_array_length(target_room.questions) then
      raise exception 'Herkes bitirmeden sonuçlar açılamaz.';
    end if;
  end loop;

  update public.rooms
  set results_released = true, show_summary = false
  where id = p_room_id
  returning * into target_room;

  return target_room;
end;
$$;

create or replace function public.submit_room_vote(
  p_room_id text,
  p_vote_id text,
  p_question_id text,
  p_answer text,
  p_voter_name text,
  p_voter_key text
)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.rooms;
  clean_key text := public.normalize_voter_key(coalesce(p_voter_key, p_voter_name));
  clean_name text := trim(coalesce(p_voter_name, 'Anonim'));
  vote_payload jsonb;
begin
  select * into target_room from public.rooms where id = p_room_id;
  if not found then
    return null;
  end if;
  if not target_room.is_started then
    raise exception 'Oyun başlamadan oy verilemez.';
  end if;

  vote_payload := jsonb_build_object(
    'id', p_vote_id,
    'questionId', p_question_id,
    'answer', p_answer,
    'voterName', clean_name,
    'voterKey', clean_key,
    'createdAt', now()
  );

  update public.rooms
  set votes = coalesce((
    select jsonb_agg(vote)
    from jsonb_array_elements(votes) vote
    where not (
      vote->>'questionId' = p_question_id
      and coalesce(vote->>'voterKey', public.normalize_voter_key(vote->>'voterName')) = clean_key
    )
  ), '[]'::jsonb) || vote_payload
  where id = p_room_id
  returning * into target_room;

  insert into public.room_votes(id, room_id, question_id, answer, voter_name, voter_key, user_id)
  values (p_vote_id, p_room_id, p_question_id, p_answer, clean_name, clean_key, auth.uid())
  on conflict (room_id, question_id, voter_key)
  do update set answer = excluded.answer, voter_name = excluded.voter_name, id = excluded.id, created_at = now();

  return target_room;
end;
$$;

grant execute on function public.join_room(text, text) to anon, authenticated;
grant execute on function public.remove_room_participant(text, text) to authenticated;
grant execute on function public.start_room(text) to authenticated;
grant execute on function public.set_room_active_question(text, integer) to authenticated;
grant execute on function public.show_room_summary(text) to authenticated;
grant execute on function public.release_room_results(text) to authenticated;
grant execute on function public.submit_room_vote(text, text, text, text, text, text) to anon, authenticated;

insert into public.room_questions(id, room_id, position, text, answer_mode, custom_options)
select
  question->>'id',
  rooms.id,
  ordinality::integer - 1,
  question->>'text',
  coalesce(question->>'answerMode', 'participants'),
  coalesce(question->'customOptions', '[]'::jsonb)
from public.rooms
cross join lateral jsonb_array_elements(rooms.questions) with ordinality as questions(question, ordinality)
where question ? 'id'
on conflict (id) do nothing;

insert into public.room_participants(room_id, name, voter_key)
select rooms.id, participant, public.normalize_voter_key(participant)
from public.rooms
cross join lateral jsonb_array_elements_text(rooms.participants) participant
on conflict (room_id, voter_key) do nothing;

insert into public.room_votes(id, room_id, question_id, answer, voter_name, voter_key, created_at)
select
  vote->>'id',
  rooms.id,
  vote->>'questionId',
  vote->>'answer',
  vote->>'voterName',
  coalesce(vote->>'voterKey', public.normalize_voter_key(vote->>'voterName')),
  coalesce((vote->>'createdAt')::timestamptz, now())
from public.rooms
cross join lateral jsonb_array_elements(rooms.votes) vote
where vote ? 'id'
on conflict (room_id, question_id, voter_key) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end $$;
