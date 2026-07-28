import { apiFetch } from "./api";
import type { PracticeQuestion } from "./skillTreeApi";

export interface Flashcard {
  front: string;
  back: string;
}

interface RawQuiz {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

function toPracticeQuestions(raw: RawQuiz[]): PracticeQuestion[] {
  return (raw || []).map((q, i) => ({
    id: i + 1,
    question_text: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation ?? null,
  }));
}

export async function getStudioFiles(userId: number): Promise<{ files: string[] }> {
  return apiFetch(`/studio/files/${userId}`);
}

export interface StudyDocument {
  filename: string;
  chunks: number;
  topic: string;
}

export async function listDocuments(userId: number): Promise<{ documents: StudyDocument[] }> {
  return apiFetch(`/files/documents/${userId}`);
}

export async function deleteDocument(userId: number, filename: string): Promise<{ removed_chunks: number }> {
  return apiFetch(`/files/documents/${userId}?filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
}

/** OCR handwritten/printed notes from a photo and add them to the materials library. */
export async function notesToLibrary(
  userId: number,
  image: Blob,
  topic = "Notes"
): Promise<{ message: string; filename: string; chunks: number; text: string }> {
  const form = new FormData();
  form.append("file", image, "notes.jpg");
  return apiFetch(`/files/upload-image?user_id=${userId}&topic=${encodeURIComponent(topic)}`, {
    method: "POST",
    body: form,
  });
}

/** Turn any passage (e.g. a companion answer) into flashcards. */
export async function textFlashcards(userId: number, text: string, language: string): Promise<{ flashcards: Flashcard[] }> {
  return apiFetch("/studio/text-flashcards", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, text, language }),
  });
}

export interface PhotoKit {
  title: string;
  summary: string;
  flashcards: Flashcard[];
  quiz: PracticeQuestion[];
}

export async function photoKit(userId: number, language: string, image: Blob): Promise<PhotoKit> {
  const form = new FormData();
  form.append("user_id", String(userId));
  form.append("language", language);
  form.append("image", image, "page.jpg");
  const raw = await apiFetch("/studio/photo-kit", { method: "POST", body: form });
  return {
    title: raw.title || "",
    summary: raw.summary || "",
    flashcards: raw.flashcards || [],
    quiz: toPracticeQuestions(raw.quiz || []),
  };
}

export async function audioRecap(
  userId: number,
  language: string,
  filename?: string
): Promise<{ script: string; audio_base64: string | null; sources: string[] }> {
  return apiFetch("/studio/audio-recap", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, language, filename: filename ?? null }),
  });
}

export interface MapNode {
  id: string;
  label: string;
  group?: string;
}
export interface MapEdge {
  from: string;
  to: string;
  label?: string;
}

export async function knowledgeMap(
  userId: number,
  language: string
): Promise<{ nodes: MapNode[]; edges: MapEdge[]; sources: string[] }> {
  return apiFetch("/studio/knowledge-map", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, language }),
  });
}

export async function cheatSheet(
  userId: number,
  language: string,
  filename?: string
): Promise<{ markdown: string; sources: string[] }> {
  return apiFetch("/studio/cheat-sheet", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, language, filename: filename ?? null }),
  });
}

export async function translateExplain(
  userId: number,
  language: string,
  filename?: string
): Promise<{ markdown: string; sources: string[] }> {
  return apiFetch("/studio/translate", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, language, filename: filename ?? null }),
  });
}

export async function mockFromMaterials(
  userId: number,
  language: string,
  n = 15
): Promise<{ questions: PracticeQuestion[]; sources: string[] }> {
  const raw = await apiFetch("/studio/mock", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, language, n }),
  });
  return { questions: toPracticeQuestions(raw.questions || []), sources: raw.sources || [] };
}
