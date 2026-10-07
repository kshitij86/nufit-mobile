// The Azure backend sleeps when idle, so the first request after a while can take several seconds.
export const REQUEST_TIMEOUT_MS = 45_000;

const GENERIC_ERROR = "Something went wrong. Please try again.";

// Errors whose message is safe to show the user as-is.
export class UserFacingError extends Error {}

export function userMessage(e: unknown): string {
  return e instanceof UserFacingError ? e.message : GENERIC_ERROR;
}

export class ApiError extends UserFacingError {
  /** Validation messages from a 422 `detail` array, keyed by request field (`body` for whole-request errors). */
  constructor(message: string, readonly status: number, readonly fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends UserFacingError {
  constructor(readonly timedOut: boolean) {
    super(
      timedOut
        ? "This is taking longer than usual. Please check your connection and try again."
        : "Couldn't reach Nufit. Please check your connection and try again."
    );
    this.name = "NetworkError";
  }
}

// Only `error` and string `detail` are user-safe; anything else falls back to a generic message.
export function errorMessage(body: unknown, fallback = GENERIC_ERROR): string {
  if (body && typeof body === "object") {
    const { error, detail } = body as { error?: unknown; detail?: unknown };
    if (typeof error === "string" && error) return error;
    if (typeof detail === "string" && detail) return detail;
  }
  return fallback;
}

function fieldErrorsOf(body: unknown): Record<string, string> {
  const detail = (body as { detail?: unknown } | null)?.detail;
  const errors: Record<string, string> = {};
  if (!Array.isArray(detail)) return errors;
  for (const item of detail) {
    const { loc, msg } = (item ?? {}) as { loc?: unknown; msg?: unknown };
    if (!Array.isArray(loc) || loc[0] !== "body" || typeof msg !== "string") continue;
    const field = String(loc[loc.length - 1]);
    errors[field] ??= msg.replace(/^Value error, /, "");
  }
  return errors;
}

export interface PostOptions {
  token?: string;
  fallbackError?: string;
  timeoutMs?: number;
}

export async function postJson<T>(
  url: string,
  body: unknown,
  { token, fallbackError, timeoutMs = REQUEST_TIMEOUT_MS }: PostOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  let text: string;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    text = await res.text();
  } catch {
    throw new NetworkError(controller.signal.aborted);
  } finally {
    clearTimeout(timer);
  }

  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON bodies (e.g. a gateway error page) are never shown to the user.
  }
  if (!res.ok) throw new ApiError(errorMessage(json, fallbackError), res.status, fieldErrorsOf(json));
  return json as T;
}
