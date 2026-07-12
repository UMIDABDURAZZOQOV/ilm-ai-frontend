// Client-side vocabulary progress, kept in localStorage. Per-device for now —
// can move to the backend later if cross-device sync is needed.

import { VOCAB } from "./vocab";

export type VocabStatus = "new" | "learning" | "mastered";

const KEY = "sat_vocab_progress";

type ProgressMap = Record<string, VocabStatus>;

function read(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function write(map: ProgressMap) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // storage full / unavailable — practice still works for the session
  }
}

export function getProgressMap(): ProgressMap {
  return read();
}

export function getStatus(id: string): VocabStatus {
  return read()[id] ?? "new";
}

export function setStatus(id: string, status: VocabStatus) {
  const map = read();
  map[id] = status;
  write(map);
}

export interface VocabStats {
  total: number;
  mastered: number;
  learning: number;
  new: number;
}

export function getStats(): VocabStats {
  const map = read();
  let mastered = 0;
  let learning = 0;
  for (const w of VOCAB) {
    const s = map[w.id] ?? "new";
    if (s === "mastered") mastered++;
    else if (s === "learning") learning++;
  }
  return {
    total: VOCAB.length,
    mastered,
    learning,
    new: VOCAB.length - mastered - learning,
  };
}

// Words the learner hasn't mastered yet, hardest-first-ish (new before learning),
// used by Learn Mode / Flashcards to focus effort. Falls back to all words.
export function getUnmasteredIds(limit?: number): string[] {
  const map = read();
  const news: string[] = [];
  const learnings: string[] = [];
  for (const w of VOCAB) {
    const s = map[w.id] ?? "new";
    if (s === "new") news.push(w.id);
    else if (s === "learning") learnings.push(w.id);
  }
  let pool = [...news, ...learnings];
  if (pool.length === 0) pool = VOCAB.map((w) => w.id); // all mastered → review everything
  return typeof limit === "number" ? pool.slice(0, limit) : pool;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
