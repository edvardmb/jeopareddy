type FetcherOptions<TBody> = {
  url: string;
  method: string;
  params?: Record<string, unknown>;
  data?: TBody;
  signal?: AbortSignal;
  headers?: HeadersInit;
};

type ErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

const nodeEnv =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env ?? {};
const API_BASE_URL =
  typeof window === "undefined"
    ? nodeEnv.VITE_API_BASE_URL ?? "http://localhost:5000"
    : import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

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

function withQueryParams(
  url: string,
  params?: Record<string, unknown>,
): string {
  if (!params) {
    return url;
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    query.set(key, String(value));
  }

  const suffix = query.toString();
  return suffix.length > 0 ? `${url}?${suffix}` : url;
}

export async function orvalFetcher<TResponse, TBody = unknown>(
  options: FetcherOptions<TBody>,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${withQueryParams(options.url, options.params)}`, {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.data === undefined ? undefined : JSON.stringify(options.data),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
