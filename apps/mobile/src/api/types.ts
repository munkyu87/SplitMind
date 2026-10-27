export type PublicUser = {
  id: string;
  provider: "kakao" | "naver" | "google";
  nickname: string | null;
  createdAt: string;
  isAdmin: boolean;
  isAdult: boolean;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  requiresAdult: boolean;
};

export type QuestionCard = {
  id: string;
  title: string;
  participantCount: number;
  averageRating: number | null;
  ratingCount: number;
  categories: Category[];
  answered: boolean;
};

export type Page<T> = { items: T[]; nextCursor: string | null };

export type Choice = {
  choiceIndex: number;
  content: string;
  imageUrl: string | null;
};

export type QuestionDetail = {
  id: string;
  title: string;
  categories: Category[];
  choices: Choice[];
  answered: boolean;
  myChoiceIndex: number | null;
};

export type ResultChoice = Choice & { count: number; ratio: number };

export type QuestionResult = {
  questionId: string;
  total: number;
  myChoiceIndex: number | null;
  myRating: number | null;
  choices: ResultChoice[];
};

export type Comment = {
  id: string;
  nickname: string;
  content: string;
  choiceIndex: number | null;
  likeCount: number;
  likedByMe: boolean;
  reportedByMe: boolean;
  reportReason: string | null;
  createdAt: string;
};

export type Suggestion = {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected";
  choices: { content: string; imageUrl?: string }[];
  reviewReason: string | null;
  questionId: string | null;
  createdAt: string;
  category: Category;
};

export type MyAnswer = {
  questionId: string;
  title: string;
  choiceIndex: number;
  choice: string;
  createdAt: string;
  categories: { id: string; name: string; slug: string }[];
};

export type ReportRow = {
  id: string;
  commentId: string;
  reason: string;
  content: string;
  deleted: boolean;
  createdAt: string;
};

export type AiSetting = {
  enabled: boolean;
  cadence: "manual" | "daily" | "weekly";
  prompt: string;
  lastRunAt: string | null;
};
