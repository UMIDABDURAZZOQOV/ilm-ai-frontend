import { apiFetch } from "./api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ReviewItem {
  id: number;
  user_id: number;
  topic: string;
  source_material: string | null;
  next_review_date: string;
  interval_stage: number;
  last_result: "correct" | "incorrect" | null;
}

export interface DueReviewsResponse {
  due: ReviewItem[];
}

export interface CompleteReviewParams {
  user_id: number;
  score: number;
  total: number;
}

export interface ReviewQuizQuestion {
  question: string;
  type?: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  topic?: string;
}

export interface GenerateTopicQuizParams {
  user_id: number;
  topic: string;
  num_questions: number;
  difficulty: string;
  language: string;
}

export interface GenerateTopicQuizResponse {
  questions: ReviewQuizQuestion[];
  error?: string;
}

// ─── API functions ─────────────────────────────────────────────────────────────

/**
 * List review items due today (or overdue) for a user.
 * GET /review/due/{userId}
 */
export async function getDueReviews(userId: number): Promise<DueReviewsResponse> {
  return apiFetch(`/review/due/${userId}`);
}

/**
 * Mark a review item's mini-quiz as complete — advances or resets its
 * spaced-repetition interval depending on the score.
 * POST /review/{itemId}/complete
 */
export async function completeReview(itemId: number, params: CompleteReviewParams): Promise<ReviewItem> {
  return apiFetch(`/review/${itemId}/complete`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Generate a short quiz scoped to one weak topic.
 * POST /quiz/generate  (existing endpoint, now accepts an optional `topic` field)
 */
export async function generateTopicQuiz(params: GenerateTopicQuizParams): Promise<GenerateTopicQuizResponse> {
  return apiFetch("/quiz/generate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
