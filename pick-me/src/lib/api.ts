import type { QuizRoom, User, Vote } from "../types";
import { supabase } from "./supabase";

function ensureSupabase() {
  if (!supabase) {
    throw new Error("Supabase bağlantısı eksik. .env dosyasına VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ekle.");
  }
  return supabase;
}

export const normalizeVoterKey = (name: string) => name.trim().toLocaleLowerCase("tr-TR");

export const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36).slice(-5)}`;

export const authApi = {
  async currentUser(): Promise<User | null> {
    const client = ensureSupabase();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return {
      id: data.user.id,
      name: String(data.user.user_metadata?.name || data.user.email || "Kullanıcı"),
      email: data.user.email || "",
      createdAt: data.user.created_at,
    };
  },
  async signUp(name: string, email: string, password: string): Promise<User> {
    const client = ensureSupabase();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (!data.user) throw new Error("Kayıt tamamlanamadı.");
    return {
      id: data.user.id,
      name,
      email: data.user.email || email,
      createdAt: data.user.created_at,
    };
  },
  async signIn(email: string, password: string): Promise<User> {
    const client = ensureSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error("Giriş tamamlanamadı.");
    return {
      id: data.user.id,
      name: String(data.user.user_metadata?.name || data.user.email || "Kullanıcı"),
      email: data.user.email || email,
      createdAt: data.user.created_at,
    };
  },
  async signOut() {
    const client = ensureSupabase();
    await client.auth.signOut();
  },
};

function fromRow(row: Record<string, unknown>): QuizRoom {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    title: String(row.title),
    participants: (row.participants as string[]) || [],
    questions: (row.questions as QuizRoom["questions"]) || [],
    isAnonymous: Boolean(row.is_anonymous),
    requireName: Boolean(row.require_name),
    activeQuestionIndex: Number(row.active_question_index || 0),
    showSummary: Boolean(row.show_summary),
    votes: (row.votes as QuizRoom["votes"]) || [],
    createdAt: String(row.created_at),
  };
}

function toRow(room: QuizRoom) {
  return {
    id: room.id,
    owner_id: room.ownerId,
    title: room.title,
    participants: room.participants,
    questions: room.questions,
    is_anonymous: room.isAnonymous,
    require_name: room.requireName,
    active_question_index: room.activeQuestionIndex,
    show_summary: room.showSummary,
    votes: room.votes,
    created_at: room.createdAt,
  };
}

export const roomApi = {
  async mine(ownerId: string): Promise<QuizRoom[]> {
    const client = ensureSupabase();
    const { data, error } = await client.from("rooms").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(fromRow);
  },
  async get(id: string): Promise<QuizRoom | undefined> {
    const client = ensureSupabase();
    const { data, error } = await client.from("rooms").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? fromRow(data) : undefined;
  },
  async create(room: QuizRoom): Promise<QuizRoom> {
    const client = ensureSupabase();
    const { data, error } = await client.from("rooms").insert(toRow(room)).select("*").single();
    if (error) throw error;
    return fromRow(data);
  },
  async addParticipant(roomId: string, name: string): Promise<QuizRoom | undefined> {
    const room = await roomApi.get(roomId);
    if (!room) return undefined;
    const cleanName = name.trim();
    if (cleanName && !room.participants.some((item) => item.toLocaleLowerCase("tr-TR") === cleanName.toLocaleLowerCase("tr-TR"))) {
      room.participants = [...room.participants, cleanName];
    }
    return roomApi.update(room);
  },
  async setActiveQuestion(roomId: string, activeQuestionIndex: number): Promise<QuizRoom | undefined> {
    const room = await roomApi.get(roomId);
    if (!room) return undefined;
    room.activeQuestionIndex = Math.max(0, Math.min(activeQuestionIndex, room.questions.length - 1));
    room.showSummary = false;
    return roomApi.update(room);
  },
  async showSummary(roomId: string): Promise<QuizRoom | undefined> {
    const room = await roomApi.get(roomId);
    if (!room) return undefined;
    room.showSummary = true;
    return roomApi.update(room);
  },
  async vote(roomId: string, vote: Vote): Promise<QuizRoom | undefined> {
    const room = await roomApi.get(roomId);
    if (!room) return undefined;
    const voterKey = vote.voterKey || normalizeVoterKey(vote.voterName);
    const normalizedVote = { ...vote, voterKey };
    room.votes = room.votes.filter((item) => {
      const itemKey = item.voterKey || normalizeVoterKey(item.voterName);
      return !(item.questionId === normalizedVote.questionId && itemKey === voterKey);
    });
    room.votes = [...room.votes, normalizedVote];
    return roomApi.update(room);
  },
  async update(room: QuizRoom): Promise<QuizRoom> {
    const client = ensureSupabase();
    const { data, error } = await client.from("rooms").update(toRow(room)).eq("id", room.id).select("*").single();
    if (error) throw error;
    return fromRow(data);
  },
  subscribe(roomId: string, onChange: (room: QuizRoom) => void) {
    const client = ensureSupabase();
    const channel = client
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new) onChange(fromRow(payload.new as Record<string, unknown>));
        },
      )
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  },
};
