const ACCESS_TOKEN_STORAGE_KEY = "jeopareddy.accessToken";

let accessToken: string | null = globalThis.localStorage?.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function hasAccessToken(): boolean {
  return Boolean(accessToken);
}

export function setAccessToken(token: string): void {
  accessToken = token;
  globalThis.localStorage?.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  accessToken = null;
  globalThis.localStorage?.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}
