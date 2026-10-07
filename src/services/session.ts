import * as SecureStore from "expo-secure-store";
import { AUTH_BASE_URL } from "../config";
import { RegisterRequest } from "../utils/registration";
import { ApiError, NetworkError, PostOptions, UserFacingError, postJson } from "./http";

const ACCESS_KEY = "nufit.accessToken";
const REFRESH_KEY = "nufit.refreshToken";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export class SessionExpiredError extends UserFacingError {
  constructor() {
    super("Your session has expired. Please log in again.");
    this.name = "SessionExpiredError";
  }
}

let tokens: { access: string; refresh: string } | null = null;
let refreshing: Promise<boolean> | null = null;
const expiredListeners = new Set<() => void>();

export function onSessionExpired(listener: () => void) {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

export async function loadSession(): Promise<boolean> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  tokens = access && refresh ? { access, refresh } : null;
  return tokens !== null;
}

async function saveSession(pair: TokenPair) {
  if (!pair?.access_token || !pair?.refresh_token) throw new ApiError("Something went wrong. Please try again.", 200);
  tokens = { access: pair.access_token, refresh: pair.refresh_token };
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, pair.access_token),
    SecureStore.setItemAsync(REFRESH_KEY, pair.refresh_token),
  ]);
}

async function clearSession() {
  tokens = null;
  await Promise.all([SecureStore.deleteItemAsync(ACCESS_KEY), SecureStore.deleteItemAsync(REFRESH_KEY)]).catch(() => {});
}

async function expireSession(): Promise<never> {
  await clearSession();
  expiredListeners.forEach((listener) => listener());
  throw new SessionExpiredError();
}

export async function logIn(email: string, password: string) {
  const pair = await postJson<TokenPair>(
    `${AUTH_BASE_URL}/login`,
    { email, password },
    { fallbackError: "Couldn't log you in. Please try again." }
  );
  await saveSession(pair);
}

export async function register(request: RegisterRequest) {
  await postJson(`${AUTH_BASE_URL}/register`, request, {
    fallbackError: "Couldn't create your account. Please try again.",
  });
}

// Clears local tokens straight away; revoking the refresh token server-side is best effort.
export async function logOut() {
  const refreshToken = tokens?.refresh;
  await clearSession();
  if (refreshToken) {
    postJson(`${AUTH_BASE_URL}/logout`, { refresh_token: refreshToken }, { timeoutMs: 10_000 }).catch(() => {});
  }
}

// Resolves false when the server rejects the refresh token. Network and server errors propagate,
// so a flaky connection doesn't log the user out.
function refreshTokens(): Promise<boolean> {
  if (!refreshing) {
    const refreshToken = tokens?.refresh;
    refreshing = (async () => {
      if (!refreshToken) return false;
      try {
        await saveSession(await postJson<TokenPair>(`${AUTH_BASE_URL}/refresh`, { refresh_token: refreshToken }));
        return true;
      } catch (e) {
        if (e instanceof NetworkError || (e instanceof ApiError && e.status >= 500)) throw e;
        return false;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

const isUnauthorized = (e: unknown) => e instanceof ApiError && e.status === 401;

// POST with the access token. On a 401, refreshes once and retries once; if that fails the
// session is cleared, listeners are told, and SessionExpiredError is thrown.
export async function authPost<T>(url: string, body: unknown, options?: Omit<PostOptions, "token">): Promise<T> {
  const token = tokens?.access;
  if (!token) return expireSession();
  try {
    return await postJson<T>(url, body, { ...options, token });
  } catch (e) {
    if (!isUnauthorized(e)) throw e;
  }

  // Another request may already have refreshed while this one was in flight.
  if (tokens?.access === token && !(await refreshTokens())) return expireSession();
  const retryToken = tokens?.access;
  if (!retryToken) return expireSession();
  try {
    return await postJson<T>(url, body, { ...options, token: retryToken });
  } catch (e) {
    if (isUnauthorized(e)) return expireSession();
    throw e;
  }
}
