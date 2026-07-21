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

/**
 * Store a band, or clear it when nothing has been answered.
 *
 * Merely opening a paper used to record band 0, so a test you had only looked at
 * showed "0.0" on its card as if you had sat it and failed. A paper with no answers
 * has no band at all.
 */
export function saveSkillResult(
  book: number,
  test: number,
  skill: IeltsSkill,
  result: SkillResult
): void {
  try {
    if (result.answered <= 0) localStorage.removeItem(key(book, test, skill));
    else localStorage.setItem(key(book, test, skill), JSON.stringify(result));
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
 * Nothing is shown at all until at least one skill has been answered.
 */
export function overallFor(book: number, test: number): number | null {
  const results = IELTS_SKILLS.map((s) => loadSkillResult(book, test, s));
  if (!results.some((r) => r && r.answered > 0)) return null;
  const total = results.reduce((sum, r) => sum + (r?.band ?? 0), 0);
  return roundBand(total / IELTS_SKILLS.length);
}
