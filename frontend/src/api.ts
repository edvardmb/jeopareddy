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

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  createdAtUtc: string;
};

export type AuthResponse = {
  accessToken: string;
  user: UserProfile;
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

type ErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status})`;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return fallback;
  }

  const payload = (await response.json()) as ErrorPayload;
  if (payload.message) {
    return payload.message;
  }
  if (payload.errors) {
    const firstField = Object.keys(payload.errors)[0];
    if (firstField && payload.errors[firstField]?.length) {
      return payload.errors[firstField][0];
    }
  }

  return fallback;
}

async function apiFetch<TResponse>(
  path: string,
  options: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as TResponse;
}

export function registerUser(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCurrentUser(accessToken: string): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
