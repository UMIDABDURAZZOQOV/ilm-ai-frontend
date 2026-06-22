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

async function refreshAccessToken(session: SessionData): Promise<SessionData | null> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const updated = {
    ...session,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
  saveSession(updated);
  return updated;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const session = getSession();
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

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const duration = performance.now() - startTime;

  // Track API call with Sentry
  trackApiCall(method, path, res.status, duration);

  if (res.status === 401 && session?.refresh_token) {
    const refreshed = await refreshAccessToken(session);
    if (refreshed) {
      headers["Authorization"] = `Bearer ${refreshed.access_token}`;
      const retryStartTime = performance.now();
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
      const retryDuration = performance.now() - retryStartTime;
      trackApiCall(`${method} (retry)`, path, res.status, retryDuration);
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.detail || data.error || `Request failed (${res.status})`;
    trackError(new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg)), {
      endpoint: path,
      method,
      status: res.status,
      duration_ms: duration,
    });
    throw new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
  }

  return data;
}
