import { apiFetch } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────

export type IeltsDifficulty = "easy" | "medium" | "hard";
export type IeltsTaskType = "Task1" | "Task2";
export type IeltsQuestionType = "mcq" | "tfng" | "ynng" | "completion" | "matching" | "heading";
export type IeltsTestType = "academic" | "general_training";

export interface IeltsListening {
  id: number;
  section: number;
  title: string;
  audio_url: string | null;
  /** Ordered URLs when the recording was ripped as several files; play in sequence. */
  audio_parts: string[] | null;
  transcript: string | null;
  /** Tables printed in the paper; a cell marks its gap as "[[7]]". */
  tables: string[][][] | null;
  difficulty: IeltsDifficulty;
  duration_seconds: number | null;
}

export interface IeltsReading {
  id: number;
  section: number;
  title: string;
  passage_text: string;
  tables: string[][][] | null;
  difficulty: IeltsDifficulty;
  word_count: number | null;
}

export interface IeltsWriting {
  id: number;
  task_type: IeltsTaskType;
  category: string;
  prompt: string;
  image_url: string | null;
  min_words: number;
  duration_minutes: number;
  difficulty: IeltsDifficulty;
}

export interface IeltsSpeaking {
  id: number;
  part: number;
  topic: string;
  questions: string[];
  cue_card: string | null;
  prep_seconds: number | null;
  speak_seconds: number | null;
  difficulty: IeltsDifficulty;
}

export interface IeltsQuestion {
  id: number;
  skill: "Listening" | "Reading";
  parent_id: number | null;
  question_type: IeltsQuestionType;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  hint: string | null;
  order_index: number;
}

export interface IeltsWritingSubmission {
  id: number;
  user_id: number;
  task_id: number;
  essay_text: string;
  word_count: number | null;
  band_score: number | null;
  feedback: string | null;
  task_response: string | null;
  coherence: string | null;
  lexical: string | null;
  grammar: string | null;
  submitted_at: string;
}

export interface IeltsSpeakingSubmission {
  id: number;
  user_id: number;
  topic_id: number;
  audio_url: string;
  duration_seconds: number | null;
  band_score: number | null;
  feedback: string | null;
  fluency: string | null;
  lexical: string | null;
  grammar: string | null;
  pronunciation: string | null;
  submitted_at: string;
}

export interface IeltsMockTest {
  id: number;
  user_id: number;
  test_type: IeltsTestType;
  status: "in_progress" | "completed";
  listening_score: number | null;
  reading_score: number | null;
  writing_score: number | null;
  speaking_score: number | null;
  overall_band: number | null;
  started_at: string;
  completed_at: string | null;
}

// ─── API Functions ──────────────────────────────────────────────────────────

// Listening
export async function getListening(
  section?: number,
  difficulty?: IeltsDifficulty
): Promise<IeltsListening[]> {
  const params = new URLSearchParams();
  if (section) params.append("section", section.toString());
  if (difficulty) params.append("difficulty", difficulty);
  return apiFetch(`/ielts/listening?${params.toString()}`);
}

export async function getListeningById(id: number): Promise<IeltsListening> {
  return apiFetch(`/ielts/listening/${id}`);
}

export async function getListeningQuestions(id: number): Promise<IeltsQuestion[]> {
  return apiFetch(`/ielts/listening/${id}/questions`);
}

// Reading
export async function getReading(
  section?: number,
  difficulty?: IeltsDifficulty
): Promise<IeltsReading[]> {
  const params = new URLSearchParams();
  if (section) params.append("section", section.toString());
  if (difficulty) params.append("difficulty", difficulty);
  return apiFetch(`/ielts/reading?${params.toString()}`);
}

export async function getReadingById(id: number): Promise<IeltsReading> {
  return apiFetch(`/ielts/reading/${id}`);
}

export async function getReadingQuestions(id: number): Promise<IeltsQuestion[]> {
  return apiFetch(`/ielts/reading/${id}/questions`);
}

// Writing
export async function getWriting(
  taskType?: IeltsTaskType,
  difficulty?: IeltsDifficulty
): Promise<IeltsWriting[]> {
  const params = new URLSearchParams();
  if (taskType) params.append("task_type", taskType);
  if (difficulty) params.append("difficulty", difficulty);
  return apiFetch(`/ielts/writing?${params.toString()}`);
}

export async function getWritingById(id: number): Promise<IeltsWriting> {
  return apiFetch(`/ielts/writing/${id}`);
}

export async function submitWriting(data: {
  user_id: number;
  task_id: number;
  essay_text: string;
}): Promise<IeltsWritingSubmission> {
  return apiFetch("/ielts/writing/submit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getWritingSubmissions(userId: number): Promise<IeltsWritingSubmission[]> {
  return apiFetch(`/ielts/writing/submissions/${userId}`);
}

// Speaking
export async function getSpeaking(
  part?: number,
  difficulty?: IeltsDifficulty
): Promise<IeltsSpeaking[]> {
  const params = new URLSearchParams();
  if (part) params.append("part", part.toString());
  if (difficulty) params.append("difficulty", difficulty);
  return apiFetch(`/ielts/speaking?${params.toString()}`);
}

export async function getSpeakingById(id: number): Promise<IeltsSpeaking> {
  return apiFetch(`/ielts/speaking/${id}`);
}

export async function submitSpeaking(data: {
  user_id: number;
  topic_id: number;
  audio_url: string;
  duration_seconds?: number;
}): Promise<IeltsSpeakingSubmission> {
  return apiFetch("/ielts/speaking/submit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSpeakingSubmissions(userId: number): Promise<IeltsSpeakingSubmission[]> {
  return apiFetch(`/ielts/speaking/submissions/${userId}`);
}

// Mock Test
export async function startMockTest(data: {
  user_id: number;
  test_type: IeltsTestType;
}): Promise<IeltsMockTest> {
  return apiFetch("/ielts/mock-test/start", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMockTest(id: number): Promise<IeltsMockTest> {
  return apiFetch(`/ielts/mock-test/${id}`);
}

export async function completeMockTest(id: number): Promise<IeltsMockTest> {
  return apiFetch(`/ielts/mock-test/${id}/complete`, {
    method: "POST",
  });
}

export async function getUserMockTests(userId: number): Promise<IeltsMockTest[]> {
  return apiFetch(`/ielts/mock-test/user/${userId}`);
}
