// localStorage-backed token helpers. All wrapped in try/catch for SSR and
// environments where storage is disabled.

const KEY = "qb_token";

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    // ignore
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
