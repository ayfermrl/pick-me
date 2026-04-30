import type { QuizRoom, User, Vote } from "../types";

const USERS_KEY = "pick-me-users-v2";
const SESSION_KEY = "pick-me-session-v2";
const ROOMS_KEY = "pick-me-rooms-v2";

type StoredUser = User & { password: string };

const read = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
};

const write = <T,>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const normalizeVoterKey = (name: string) => name.trim().toLocaleLowerCase("tr-TR");

export const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36).slice(-5)}`;

export const authStore = {
  currentUser(): User | null {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    const user = read<StoredUser[]>(USERS_KEY, []).find((item) => item.id === id);
    if (!user) return null;
    const { password: _password, ...publicUser } = user;
    return publicUser;
  },
  signUp(name: string, email: string, password: string): User {
    const users = read<StoredUser[]>(USERS_KEY, []);
    if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Bu e-posta ile kayıt var.");
    }
    const user: StoredUser = {
      id: uid("user"),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
    };
    write(USERS_KEY, [...users, user]);
    localStorage.setItem(SESSION_KEY, user.id);
    const { password: _password, ...publicUser } = user;
    return publicUser;
  },
  signIn(email: string, password: string): User {
    const user = read<StoredUser[]>(USERS_KEY, []).find(
      (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password,
    );
    if (!user) throw new Error("E-posta veya şifre hatalı.");
    localStorage.setItem(SESSION_KEY, user.id);
    const { password: _password, ...publicUser } = user;
    return publicUser;
  },
  signOut() {
    localStorage.removeItem(SESSION_KEY);
  },
};

export const roomStore = {
  all(): QuizRoom[] {
    return read<QuizRoom[]>(ROOMS_KEY, []);
  },
  mine(ownerId: string): QuizRoom[] {
    return roomStore.all().filter((room) => room.ownerId === ownerId);
  },
  get(id: string): QuizRoom | undefined {
    return roomStore.all().find((room) => room.id === id);
  },
  create(room: QuizRoom) {
    write(ROOMS_KEY, [room, ...roomStore.all()]);
  },
  save(room: QuizRoom) {
    write(
      ROOMS_KEY,
      roomStore.all().map((item) => (item.id === room.id ? room : item)),
    );
  },
  addParticipant(roomId: string, name: string) {
    const room = roomStore.get(roomId);
    if (!room) return;
    const cleanName = name.trim();
    if (!cleanName) return;
    const participants = room.participants || [];
    if (participants.some((item) => item.toLowerCase() === cleanName.toLowerCase())) return;
    roomStore.save({ ...room, participants: [...participants, cleanName] });
  },
  setActiveQuestion(roomId: string, activeQuestionIndex: number) {
    const room = roomStore.get(roomId);
    if (!room) return;
    const safeIndex = Math.max(0, Math.min(activeQuestionIndex, room.questions.length - 1));
    roomStore.save({ ...room, activeQuestionIndex: safeIndex, showSummary: false });
  },
  showSummary(roomId: string) {
    const room = roomStore.get(roomId);
    if (!room) return;
    roomStore.save({ ...room, showSummary: true });
  },
  vote(roomId: string, vote: Vote) {
    const room = roomStore.get(roomId);
    if (!room) return;
    const voterKey = vote.voterKey || normalizeVoterKey(vote.voterName);
    const normalizedVote = { ...vote, voterKey };
    const votes = room.votes.filter((item) => {
      const itemKey = item.voterKey || normalizeVoterKey(item.voterName);
      return !(item.questionId === normalizedVote.questionId && itemKey === voterKey);
    });
    roomStore.save({ ...room, votes: [...votes, normalizedVote] });
  },
};
