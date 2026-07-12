// Loads the full college directory at runtime: the imported US (College
// Scorecard, public domain) and European (Hipolabs) sets from /public, merged
// with the curated list that carries famous-professor detail. Curated entries
// win, so top universities keep their richer data. Cached after first load.

import { COLLEGES, type College } from "./colleges";

let cache: College[] | null = null;
let inflight: Promise<College[]> | null = null;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

async function fetchJson(path: string): Promise<College[]> {
  try {
    const r = await fetch(path);
    if (!r.ok) return [];
    return (await r.json()) as College[];
  } catch {
    return [];
  }
}

export async function loadColleges(): Promise<College[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const [us, eu] = await Promise.all([fetchJson("/colleges-us.json"), fetchJson("/colleges-eu.json")]);
    // Dedupe everything by normalized name; curated entries (richer detail) win.
    const seen = new Set(COLLEGES.map((c) => norm(c.name)));
    const extra: College[] = [];
    for (const c of [...us, ...eu]) {
      if (!c || !c.name) continue;
      const n = norm(c.name);
      if (seen.has(n)) continue;
      seen.add(n);
      extra.push(c);
    }
    cache = [...COLLEGES, ...extra].sort((a, b) => a.name.localeCompare(b.name));
    inflight = null;
    return cache;
  })();
  return inflight;
}

export async function loadCollege(id: string): Promise<College | undefined> {
  const all = await loadColleges();
  return all.find((c) => c.id === id);
}
