import { apiFetch } from "./api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantHistoryResponse {
  history: AssistantMessage[];
}

export interface AssistantAction {
  label: string;
  href: string;
}

export interface AssistantAskResponse {
  answer: string;
  /** Optional in-app next step the companion suggests. */
  action?: AssistantAction | null;
  /** Filenames of the learner's uploaded materials the answer drew from. */
  sources?: string[];
  /** Suggested next questions the learner might tap. */
  followups?: string[];
}

export interface AssistantSpeakResponse {
  audio_base64: string;
}

// ─── API functions ─────────────────────────────────────────────────────────────

/**
 * Ask the unrestricted, general-purpose AI assistant a question.
 * POST /assistant/ask
 */
export async function askAssistant(
  userId: number,
  question: string,
  language: string,
  filename?: string | null
): Promise<AssistantAskResponse> {
  return apiFetch("/assistant/ask", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, question, language, filename: filename ?? null }),
  });
}

/** Multimodal chat: attach an image with an optional question. */
export async function askAssistantImage(
  userId: number,
  question: string,
  language: string,
  image: Blob
): Promise<AssistantAskResponse> {
  const form = new FormData();
  form.append("user_id", String(userId));
  form.append("question", question);
  form.append("language", language);
  form.append("image", image, "photo.jpg");
  return apiFetch("/assistant/ask-image", { method: "POST", body: form });
}

/** Re-explain a previous answer at a different level (simpler or deeper). */
export async function rephraseAnswer(
  userId: number,
  text: string,
  mode: "simpler" | "deeper",
  language: string
): Promise<{ answer: string }> {
  return apiFetch("/assistant/rephrase", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, text, mode, language }),
  });
}

/** A proactive daily briefing from the companion, built from the learner's state. */
export async function getAssistantBriefing(
  userId: number
): Promise<{ briefing: string; action: AssistantAction | null }> {
  return apiFetch(`/assistant/briefing/${userId}`);
}

/** Uploaded document filenames, for scoping the chat to one document. */
export async function getAssistantMaterials(userId: number): Promise<{ files: string[] }> {
  return apiFetch(`/studio/files/${userId}`);
}

/**
 * Synthesize natural speech for assistant text via ElevenLabs.
 * POST /assistant/speak
 */
export async function speakText(text: string, language: string): Promise<AssistantSpeakResponse> {
  return apiFetch("/assistant/speak", {
    method: "POST",
    body: JSON.stringify({ text, language }),
  });
}

/**
 * Load the assistant conversation history for a user.
 * GET /assistant/history/{userId}
 */
export async function getAssistantHistory(userId: number): Promise<AssistantHistoryResponse> {
  return apiFetch(`/assistant/history/${userId}`);
}

/**
 * Clear the assistant conversation history for a user.
 * DELETE /assistant/history/{userId}
 */
export async function clearAssistantHistory(userId: number): Promise<{ message: string }> {
  return apiFetch(`/assistant/history/${userId}`, { method: "DELETE" });
}

/** What the companion has remembered about the learner (durable facts). */
export async function getAssistantMemory(userId: number): Promise<{ memories: string[] }> {
  return apiFetch(`/assistant/memory/${userId}`);
}

export async function clearAssistantMemory(userId: number): Promise<{ message: string }> {
  return apiFetch(`/assistant/memory/${userId}`, { method: "DELETE" });
}
