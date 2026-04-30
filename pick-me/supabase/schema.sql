create table if not exists public.rooms (
  id text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null,
  participants jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  is_anonymous boolean not null default true,
  require_name boolean not null default true,
  active_question_index integer not null default 0,
  show_summary boolean not null default false,
  votes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

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
create policy "rooms can be updated by clients"
on public.rooms
for update
to anon, authenticated
using (true)
with check (true);

alter publication supabase_realtime add table public.rooms;
