/**
 * Bands earned per test, kept in localStorage.
 *
 * The test cards need to show what you scored, but a band cannot be recomputed from
 * the saved answers alone — that needs the questions and their keys, which would mean
 * refetching every paper just to draw the home page. So the exam writes its band here
 * as it is earned, and the home page only reads.
 */
import { roundBand } from "./ieltsBand";

export type IeltsSkill = "listening" | "reading" | "writing" | "speaking";
export const IELTS_SKILLS: IeltsSkill[] = ["listening", "reading", "writing", "speaking"];

export interface SkillResult {
  band: number;
  correct: number;
  total: number;
  answered: number;
}

const key = (book: number, test: number, skill: IeltsSkill) =>
  `ielts-score-${book}-${test}-${skill}`;

export function saveSkillResult(
  book: number,
  test: number,
  skill: IeltsSkill,
  result: SkillResult
): void {
  try {
    localStorage.setItem(key(book, test, skill), JSON.stringify(result));
  } catch {
    /* quota — the score is a convenience, not the exam */
  }
}

export function loadSkillResult(
  book: number,
  test: number,
  skill: IeltsSkill
): SkillResult | null {
  try {
    const raw = localStorage.getItem(key(book, test, skill));
    return raw ? (JSON.parse(raw) as SkillResult) : null;
  } catch {
    return null;
  }
}

/**
 * The overall band is the mean of the four skills, rounded the IELTS way (.25 up to
 * the half, .75 up to the whole). A skill not yet taken counts as 0, which is what
 * the real report does — the overall only means anything once all four are sat.
 */
export function overallFor(book: number, test: number): number | null {
  const results = IELTS_SKILLS.map((s) => loadSkillResult(book, test, s));
  if (!results.some(Boolean)) return null;
  const total = results.reduce((sum, r) => sum + (r?.band ?? 0), 0);
  return roundBand(total / IELTS_SKILLS.length);
}
