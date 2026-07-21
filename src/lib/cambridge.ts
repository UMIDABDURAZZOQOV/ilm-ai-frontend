/**
 * Helpers for the Cambridge practice books stored in the IELTS tables.
 *
 * The backend has no book/test columns — a row belongs to a book and test purely by its
 * title, which `scripts/seed_ielts21.py` writes as:
 *
 *   "Cambridge 21 Test 3 — Reading Passage 2: Mapungubwe"
 *
 * so parsing it here keeps the seeder as the single source of truth for that shape.
 */

export interface CambridgeRef {
  book: number;    // 21
  test: number;    // 1–4
  index: number;   // passage / part number within the test
  title: string;   // the real passage or part title
}

const TITLE_RE =
  /^Cambridge (\d+) Test (\d+)\s*[—-]\s*(?:Reading Passage|Listening Part|Part)\s*(\d+)\s*:\s*(.+)$/;

export function parseCambridgeTitle(raw: string): CambridgeRef | null {
  const m = TITLE_RE.exec(raw);
  if (!m) return null;
  return {
    book: Number(m[1]),
    test: Number(m[2]),
    index: Number(m[3]),
    title: m[4].trim(),
  };
}

export interface CambridgeGroup<T> {
  book: number;
  test: number;
  items: { ref: CambridgeRef; item: T }[];
}

/**
 * Group rows into "Book 21 → Test n", ordered by test then by passage/part number.
 *
 * `label` picks the tagged column: reading and listening carry it in `title`, speaking
 * in `topic`.
 */
export function groupByTest<T>(
  rows: T[],
  label: (row: T) => string = (row) => (row as { title: string }).title
): CambridgeGroup<T>[] {
  const groups = new Map<string, CambridgeGroup<T>>();
  for (const item of rows) {
    const ref = parseCambridgeTitle(label(item));
    if (!ref) continue;
    const key = `${ref.book}/${ref.test}`;
    let g = groups.get(key);
    if (!g) {
      g = { book: ref.book, test: ref.test, items: [] };
      groups.set(key, g);
    }
    g.items.push({ ref, item });
  }
  const out = Array.from(groups.values());
  for (const g of out) g.items.sort((a, b) => a.ref.index - b.ref.index);
  return out.sort((a, b) => a.book - b.book || a.test - b.test);
}

export function bookTitle(book: number): string {
  return `Cambridge IELTS ${book} Academic`;
}
