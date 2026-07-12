import { apiFetch } from "./api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantHistoryResponse {
  history: AssistantMessage[];
}

export interface AssistantAskResponse {
  answer: string;
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
  language: string
): Promise<AssistantAskResponse> {
  return apiFetch("/assistant/ask", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, question, language }),
  });
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
