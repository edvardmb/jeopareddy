export type Clue = {
  id: string;
  prompt: string;
  answer: string;
  imageMimeType: string | null;
  imageBase64: string | null;
  pointValue: number;
  rowOrder: number;
  isRevealed: boolean;
  isAnswered: boolean;
};

export type Category = {
  id: string;
  name: string;
  displayOrder: number;
  clues: Clue[];
};

export type Team = {
  id: string;
  name: string;
  displayOrder: number;
  score: number;
};

export type Game = {
  id: string;
  title: string;
  status: "Draft" | "InProgress" | "Finished";
  createdAtUtc: string;
  updatedAtUtc: string;
  categories: Category[];
  teams: Team[];
};

export type GameListItem = {
  id: string;
  title: string;
  status: "Draft" | "InProgress" | "Finished";
  createdAtUtc: string;
  updatedAtUtc: string;
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
