import { apiFetch } from "./api";

export interface EssayLineEdit {
  before: string;
  after: string;
}

export interface EssayReview {
  overall: string;
  rating: number | null;
  strengths: string[];
  improvements: string[];
  line_edits: EssayLineEdit[];
}

export async function reviewEssay(data: {
  userId: number;
  essay: string;
  prompt?: string;
  essayType?: "personal_statement" | "supplemental";
  language?: string;
}): Promise<EssayReview> {
  return apiFetch("/college/essay-review", {
    method: "POST",
    body: JSON.stringify({
      user_id: data.userId,
      essay: data.essay,
      prompt: data.prompt ?? "",
      essay_type: data.essayType ?? "personal_statement",
      language: data.language ?? "en",
    }),
  });
}
