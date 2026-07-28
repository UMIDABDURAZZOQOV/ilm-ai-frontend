import { apiFetch } from "./api";

export type ShareKind = "diagram" | "flashcards" | "cheatsheet" | "course";

export async function createShare(data: {
  userId: number;
  kind: ShareKind;
  title?: string;
  payload: unknown;
}): Promise<{ token: string }> {
  return apiFetch("/share", {
    method: "POST",
    body: JSON.stringify({ user_id: data.userId, kind: data.kind, title: data.title ?? "", payload: data.payload }),
  });
}

export async function getShare(token: string): Promise<{ kind: ShareKind; title: string; payload: any }> {
  return apiFetch(`/share/${token}`);
}

/** Full absolute URL for a share token. */
export function shareUrl(token: string): string {
  if (typeof window === "undefined") return `/s/${token}`;
  return `${window.location.origin}/s/${token}`;
}
