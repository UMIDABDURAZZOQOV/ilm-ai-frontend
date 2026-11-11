import { trackApiCall, trackError } from "./sentry";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const SESSION_KEY = "ilm_session";

export interface SessionData {
  id: number;
  name: string;
  email: string;
  access_token: string;
  refresh_token: string;
  profile_picture?: string;
  oauth_provider?: string;
  oauth_provider_id?: string;
}

export function getSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: SessionData) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function sameSession(expected: SessionData | null): boolean {
  const current = getSession();
  if (!expected || !current) return expected === current;
  return current.id === expected.id && current.access_token === expected.access_token
    && current.refresh_token === expected.refresh_token;
}

function assertActiveSession(expected: SessionData | null): void {
  if (!sameSession(expected)) {
    throw new Error("Your account changed during this request. Please try again.");
  }
}

async function refreshAccessToken(session: SessionData): Promise<SessionData | null> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  // Logout/account switching while refresh is in flight must never restore the
  // previous identity or overwrite the newly selected account's credentials.
  if (!sameSession(session)) return null;
  const updated = {
    ...session,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
  saveSession(updated);
  return updated;
}

/**
 * Login fails with a structured 403 { code: "email_not_verified", email }
 * when an email/password account hasn't confirmed its verification code
 * yet. Returns the email to redirect to the verify page with, or null for
 * any other kind of error.
 */
export function getUnverifiedEmail(err: unknown): string | null {
  if (err instanceof Error) {
    const e = err as Error & { status?: number; detail?: unknown };
    if (e.status === 403 && typeof e.detail === "object" && e.detail !== null && (e.detail as any).code === "email_not_verified") {
      return (e.detail as any).email ?? null;
    }
  }
  return null;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  let session = getSession();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const startTime = performance.now();
  const method = options.method || "GET";

  // `no-store`: never serve an API response from the HTTP cache. Without it the
  // browser happily replays a cached GET (e.g. /gaps/report/<id>), so freshly
  // finished quizzes/lessons didn't show up until a manual page refresh.
  // Placed before ...options so a caller can still opt out explicitly.
  let res = await fetch(`${API_BASE}${path}`, { cache: "no-store", ...options, headers });
  assertActiveSession(session);
  const duration = performance.now() - startTime;

  // Track API call with Sentry
  trackApiCall(method, path, res.status, duration);

  if (res.status === 401 && session?.refresh_token) {
    const refreshed = await refreshAccessToken(session);
    assertActiveSession(refreshed ?? session);
    if (refreshed) {
      session = refreshed;
      headers["Authorization"] = `Bearer ${refreshed.access_token}`;
      const retryStartTime = performance.now();
      res = await fetch(`${API_BASE}${path}`, { cache: "no-store", ...options, headers });
      const retryDuration = performance.now() - retryStartTime;
      trackApiCall(`${method} (retry)`, path, res.status, retryDuration);
    }
  }

  const data = await res.json().catch(() => ({}));
  assertActiveSession(session);

  if (!res.ok) {
    const errorMsg = data.detail || data.error || `Request failed (${res.status})`;
    const readableMsg =
      typeof errorMsg === "string"
        ? errorMsg
        : typeof errorMsg === "object" && errorMsg !== null && "message" in errorMsg
        ? String((errorMsg as { message: unknown }).message)
        : JSON.stringify(errorMsg);
    trackError(new Error(readableMsg), {
      endpoint: path,
      method,
      status: res.status,
      duration_ms: duration,
    });
    const error = new Error(readableMsg) as Error & { status?: number; detail?: unknown };
    error.status = res.status;
    error.detail = data.detail;
    throw error;
  }

  return data;
}
