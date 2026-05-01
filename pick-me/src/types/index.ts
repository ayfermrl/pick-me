export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type Question = {
  id: string;
  text: string;
  answerMode: "participants" | "custom";
  customOptions: string[];
};

export type Vote = {
  id: string;
  questionId: string;
  answer: string;
  voterName: string;
  voterKey: string;
  userId?: string;
  createdAt: string;
};

export type QuizRoom = {
  id: string;
  ownerId: string;
  title: string;
  participants: string[];
  questions: Question[];
  isAnonymous: boolean;
  requireName: boolean;
  isStarted: boolean;
  resultsReleased: boolean;
  activeQuestionIndex: number;
  showSummary: boolean;
  votes: Vote[];
  createdAt: string;
};

export type QuizTemplate = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  participants: string[];
  questions: Array<{
    text: string;
    answerMode?: "participants" | "custom";
    customOptions?: string[];
  }>;
};
