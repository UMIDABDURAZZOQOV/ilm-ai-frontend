/**
 * IELTS raw-score → band conversion.
 *
 * Listening and Academic Reading are both marked out of 40. The published
 * conversion tables differ between the two papers (Reading is graded slightly
 * harder), so they're kept separate. These are the widely published Cambridge
 * conversion bands — they're a scoring *scale*, not exam content.
 *
 * Overall band = mean of the four skill bands, rounded to the nearest .5
 * (and .25 rounds UP to .5, .75 rounds UP to the next whole band).
 */

export type IeltsSkill = "listening" | "reading" | "writing" | "speaking";

/** [minimum raw score, band] — highest threshold first. */
const LISTENING_TABLE: [number, number][] = [
  [39, 9.0],
  [37, 8.5],
  [35, 8.0],
  [32, 7.5],
  [30, 7.0],
  [26, 6.5],
  [23, 6.0],
  [18, 5.5],
  [16, 5.0],
  [13, 4.5],
  [10, 4.0],
  [8, 3.5],
  [6, 3.0],
  [4, 2.5],
];

const READING_ACADEMIC_TABLE: [number, number][] = [
  [39, 9.0],
  [37, 8.5],
  [35, 8.0],
  [33, 7.5],
  [30, 7.0],
  [27, 6.5],
  [23, 6.0],
  [19, 5.5],
  [15, 5.0],
  [13, 4.5],
  [10, 4.0],
  [8, 3.5],
  [6, 3.0],
  [4, 2.5],
];

function fromTable(raw: number, table: [number, number][]): number {
  for (const [min, band] of table) {
    if (raw >= min) return band;
  }
  return 0;
}

/** Raw score (0–40) → band for Listening or Academic Reading. */
export function rawToBand(raw: number, skill: "listening" | "reading"): number {
  const clamped = Math.max(0, Math.min(40, Math.round(raw)));
  return fromTable(clamped, skill === "listening" ? LISTENING_TABLE : READING_ACADEMIC_TABLE);
}

/**
 * Round a band the way IELTS does: to the nearest half band, with .25 and .75
 * rounding UP (6.25 → 6.5, 6.75 → 7.0).
 */
export function roundBand(value: number): number {
  const whole = Math.floor(value);
  const frac = value - whole;
  if (frac < 0.25) return whole;
  if (frac < 0.75) return whole + 0.5;
  return whole + 1;
}

/** Overall band from the four skill bands (any missing skill is ignored). */
export function overallBand(bands: Partial<Record<IeltsSkill, number>>): number | null {
  const values = (["listening", "reading", "writing", "speaking"] as IeltsSkill[])
    .map((s) => bands[s])
    .filter((v): v is number => typeof v === "number");
  if (values.length === 0) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return roundBand(mean);
}

/** "7.0" / "6.5" — IELTS always shows one decimal place. */
export function formatBand(band: number | null | undefined): string {
  if (band === null || band === undefined) return "–";
  return band.toFixed(1);
}

/** Colour band for score chips (green = strong, amber = mid, red = weak). */
export function bandColor(band: number | null | undefined): string {
  if (band === null || band === undefined) return "#94a3b8";
  if (band >= 7) return "#16a34a";
  if (band >= 5.5) return "#d97706";
  return "#dc2626";
}
