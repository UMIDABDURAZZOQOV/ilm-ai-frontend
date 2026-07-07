import { apiFetch } from "./api";

// ─── Shared enums / literals ──────────────────────────────────────────────────

export type ExamType = "SAT" | "IELTS";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "mcq" | "short_answer" | "essay";
export type SessionType = "practice" | "full_test";
export type AnalysisStatus = "pending" | "complete" | "failed";

// ─── Question interfaces ──────────────────────────────────────────────────────

export interface Question {
  id: number;
  exam_type: ExamType;
  domain: string;
  difficulty: Difficulty;
  question_type: QuestionType;
  question_text: string;
  options: string[] | null;      // exactly 4 for MCQ
  correct_answer: string | null;
  rubric: string | null;
  source_filename: string | null;
  tags: string[];
  created_at: string;
}

export interface QuestionsListParams {
  exam_type?: ExamType;
  domain?: string;
  difficulty?: Difficulty;
  question_type?: QuestionType;
  limit?: number;
  offset?: number;
}

export interface QuestionsListResponse {
  questions: Question[];
  total: number;
}

export interface GenerateFromMaterialsParams {
  user_id: number;
  exam_type: ExamType;
  domain: string;
  difficulty: Difficulty;
  num_questions: number;
}

// ─── Session interfaces ───────────────────────────────────────────────────────

export interface SessionStartParams {
  user_id: number;
  exam_type: ExamType;
  domain?: string | null;
  difficulty?: Difficulty;
  num_questions?: number;
  timed?: boolean;
  duration_seconds?: number | null;
}

export interface SessionStartResponse {
  session_id: number;
  questions: Question[];
  exam_type: ExamType;
  domain: string | null;
  timed: boolean;
  duration_seconds: number | null;
}

export interface AnswerSubmissionParams {
  question_id: number;
  answer: string;
  elapsed_ms: number;
}

export interface AnswerSubmissionResponse {
  recorded: boolean;
}

export interface PerQuestionResult {
  question_id: number;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  user_answer: string | null;
  correct_answer: string | null;
  is_correct: boolean;
  explanation: string | null;
}

export interface SessionResult {
  session_id: number;
  exam_type: ExamType;
  domain: string | null;
  score_pct: number;
  questions_correct: number;
  questions_total: number;
  per_question: PerQuestionResult[];
  analysis_status: AnalysisStatus;
  completed_at: string;
}

export interface UserSession {
  id: number;
  exam_type: ExamType;
  domain: string | null;
  difficulty: Difficulty;
  session_type: SessionType;
  status: "in_progress" | "completed" | "expired";
  score_pct: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface UserSessionsResponse {
  sessions: UserSession[];
}

// ─── Full-length test interfaces ──────────────────────────────────────────────

export interface FullTestStartParams {
  user_id: number;
  exam_type: ExamType;
}

export interface FullTestStartResponse {
  test_id: number;
  exam_type: ExamType;
  sections: string[];
  current_section: string;
  questions: Question[];
  section_duration_seconds: number | null;
}

export interface SectionCompleteResponse {
  section: string;
  score_pct: number;
  next_section: string | null;
  questions: Question[] | null;
  section_duration_seconds: number | null;
}

export interface FullTestCompleteResponse extends SessionResult {
  section_scores: Record<string, number>;
}

// ─── Score prediction interfaces ──────────────────────────────────────────────

export interface ScorePredictionPoint {
  predicted_score: number;
  computed_at: string;
}

export interface ScorePrediction {
  user_id: number;
  exam_type: ExamType;
  predicted_score: number | null;
  prediction_available: boolean;
  message: string | null;
  computed_at: string;
  history: ScorePredictionPoint[];
}

export interface TargetScoreParams {
  target_score: number;
}

export interface TargetScoreResponse {
  user_id: number;
  exam_type: ExamType;
  target_score: number;
}

// ─── Dashboard interface ──────────────────────────────────────────────────────

export interface DashboardStats {
  exam_type: ExamType;
  domain_accuracy: Record<string, number>;
  weak_spots: string[];
  score_trend: ScorePredictionPoint[];
  predicted_score: number | null;
  target_score: number | null;
  target_gap: number | null;
  sessions_completed: number;
  empty_state: boolean;
  is_premium: boolean;
}

// ─── Study plan interfaces ────────────────────────────────────────────────────

export interface StudyPlanParams {
  user_id: number;
  exam_type: ExamType;
  target_date: string;       // ISO date string
  target_score: number;
  daily_hours: number;
}

export interface StudyPlanWeek {
  week: number;
  focus: string;
  topics: string[];
  hours: number;
  tasks: string[];
}

export interface StudyPlanResponse {
  user_id: number;
  exam_type: ExamType;
  weeks: StudyPlanWeek[];
  generated_at: string;
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Start a new practice session.
 * POST /sat-ielts/sessions/start
 */
export async function startSession(
  params: SessionStartParams
): Promise<SessionStartResponse> {
  return apiFetch("/sat-ielts/sessions/start", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Submit an answer for one question in a session.
 * POST /sat-ielts/sessions/{sessionId}/answer
 */
export async function submitAnswer(
  sessionId: number,
  data: AnswerSubmissionParams
): Promise<AnswerSubmissionResponse> {
  return apiFetch(`/sat-ielts/sessions/${sessionId}/answer`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Finalise (complete) a practice session.
 * POST /sat-ielts/sessions/{sessionId}/complete
 */
export async function completeSession(
  sessionId: number
): Promise<SessionResult> {
  return apiFetch(`/sat-ielts/sessions/${sessionId}/complete`, {
    method: "POST",
  });
}

/**
 * List all sessions for a user, optionally filtered by exam type.
 * GET /sat-ielts/sessions/{userId}?exam_type=SAT
 */
export async function getUserSessions(
  userId: number,
  examType?: ExamType
): Promise<UserSessionsResponse> {
  const qs = examType ? `?exam_type=${examType}` : "";
  return apiFetch(`/sat-ielts/sessions/${userId}${qs}`);
}

/**
 * Start a full-length test (premium only).
 * POST /sat-ielts/full-tests/start
 */
export async function startFullTest(
  params: FullTestStartParams
): Promise<FullTestStartResponse> {
  return apiFetch("/sat-ielts/full-tests/start", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Complete a section and advance to the next.
 * POST /sat-ielts/full-tests/{testId}/section/{section}/complete
 */
export async function completeSectionTest(
  testId: number,
  section: string
): Promise<SectionCompleteResponse> {
  return apiFetch(
    `/sat-ielts/full-tests/${testId}/section/${encodeURIComponent(section)}/complete`,
    { method: "POST" }
  );
}

/**
 * Finalise a full-length test.
 * POST /sat-ielts/full-tests/{testId}/complete
 */
export async function completeFullTest(
  testId: number
): Promise<FullTestCompleteResponse> {
  return apiFetch(`/sat-ielts/full-tests/${testId}/complete`, {
    method: "POST",
  });
}

/**
 * Get the current score prediction (and history for premium).
 * GET /sat-ielts/score/{userId}?exam_type=SAT
 */
export async function getScorePrediction(
  userId: number,
  examType: ExamType
): Promise<ScorePrediction> {
  return apiFetch(
    `/sat-ielts/score/${userId}?exam_type=${examType}`
  );
}

/**
 * Set the user's target score / band.
 * POST /sat-ielts/score/{userId}/target
 */
export async function setTargetScore(
  userId: number,
  data: TargetScoreParams
): Promise<TargetScoreResponse> {
  return apiFetch(`/sat-ielts/score/${userId}/target`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Fetch the aggregated dashboard stats for a user.
 * GET /sat-ielts/dashboard/{userId}?exam_type=SAT
 */
export async function getDashboard(
  userId: number,
  examType: ExamType
): Promise<DashboardStats> {
  return apiFetch(
    `/sat-ielts/dashboard/${userId}?exam_type=${examType}`
  );
}

/**
 * Generate a SAT/IELTS-specific study plan.
 * POST /sat-ielts/plan/generate
 */
export async function generateStudyPlan(
  data: StudyPlanParams
): Promise<StudyPlanResponse> {
  return apiFetch("/sat-ielts/plan/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * List / filter questions from the question bank.
 * GET /sat-ielts/questions
 */
export async function listQuestions(
  params?: QuestionsListParams
): Promise<QuestionsListResponse> {
  const qs = params
    ? "?" +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  return apiFetch(`/sat-ielts/questions${qs}`);
}

/**
 * AI-generate questions from the user's uploaded materials.
 * POST /sat-ielts/questions/generate-from-materials
 */
export async function generateQuestionsFromMaterials(
  data: GenerateFromMaterialsParams
): Promise<{ questions: Question[] }> {
  return apiFetch("/sat-ielts/questions/generate-from-materials", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
