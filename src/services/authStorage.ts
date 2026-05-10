const TOKEN_KEY = 'isms_token';
const USER_KEY = 'isms_user';

function hasBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function readWithMigration(key: string): string | null {
  if (!hasBrowserStorage()) {
    return null;
  }

  const sessionValue = window.sessionStorage.getItem(key);
  if (sessionValue) {
    return sessionValue;
  }

  const legacyValue = window.localStorage.getItem(key);
  if (!legacyValue) {
    return null;
  }

  window.sessionStorage.setItem(key, legacyValue);
  window.localStorage.removeItem(key);
  return legacyValue;
}

function writeToSession(key: string, value: string): void {
  if (!hasBrowserStorage()) {
    return;
  }

  window.sessionStorage.setItem(key, value);
  window.localStorage.removeItem(key);
}

function clearFromAllStorage(key: string): void {
  if (!hasBrowserStorage()) {
    return;
  }

  window.sessionStorage.removeItem(key);
  window.localStorage.removeItem(key);
}

export function getAuthToken(): string | null {
  return readWithMigration(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  writeToSession(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  clearFromAllStorage(TOKEN_KEY);
}

export function hasAuthToken(): boolean {
  return !!getAuthToken();
}

export function getCachedUser<T>(): T | null {
  const raw = readWithMigration(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    clearFromAllStorage(USER_KEY);
    return null;
  }
}

export function setCachedUser(value: unknown): void {
  writeToSession(USER_KEY, JSON.stringify(value));
}

export function clearCachedUser(): void {
  clearFromAllStorage(USER_KEY);
}

function clearSecurityQuestStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const prefix = 'manzen-security-quest-state';
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
}

export function clearAuthSession(): void {
  clearAuthToken();
  clearCachedUser();
  clearSecurityQuestStorage();
}
