"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { getListening, getReading, getSpeaking, getWriting } from "@/lib/ieltsApi";
import { bookTitle, parseCambridgeTitle } from "@/lib/cambridge";
import { formatBand } from "@/lib/ieltsBand";
import { loadSkillResult, overallFor } from "@/lib/ieltsScores";

const SKILLS = ["listening", "reading", "writing", "speaking"] as const;
type Skill = (typeof SKILLS)[number];

const SKILL_LABEL: Record<Skill, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

/**
 * The IELTS home: one card per test, listing its four skills.
 *
 * It used to be four separate skill pages with no way to see a test as a whole, which
 * is not how anyone practises — you sit "Test 3", not "every reading passage ever
 * published". Each skill link carries `?test=` so the skill page opens straight into
 * that test's material.
 */
export default function IeltsHubPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Map<number, Set<number>> | null>(null);
  const [available, setAvailable] = useState<Record<string, boolean>>({});
  // Bands live in localStorage, so they can only be read after mount.
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all([getListening(), getReading(), getWriting(), getSpeaking()])
      .then(([listening, reading, writing, speaking]) => {
        const map = new Map<number, Set<number>>();
        const have: Record<string, boolean> = {};

        const note = (book: number, test: number, skill: Skill) => {
          if (!map.has(book)) map.set(book, new Set());
          map.get(book)!.add(test);
          have[`${book}/${test}/${skill}`] = true;
        };

        for (const r of listening) {
          const ref = parseCambridgeTitle(r.title);
          if (ref) note(ref.book, ref.test, "listening");
        }
        for (const r of reading) {
          const ref = parseCambridgeTitle(r.title);
          if (ref) note(ref.book, ref.test, "reading");
        }
        for (const r of speaking) {
          const ref = parseCambridgeTitle(r.topic);
          if (ref) note(ref.book, ref.test, "speaking");
        }
        for (const r of writing) {
          // Writing carries the tag in `category`: "Cambridge 21 Test 3".
          const m = /^Cambridge (\d+) Test (\d+)$/.exec(r.category);
          if (m) note(Number(m[1]), Number(m[2]), "writing");
        }

        setAvailable(have);
        setBooks(map);
      })
      .catch(() => setBooks(new Map()));
  }, []);

  useEffect(() => {
    if (!books) return;
    const next: Record<string, number> = {};
    for (const [book, tests] of Array.from(books.entries())) {
      for (const test of Array.from(tests)) {
        // Only the skills this paper ships with — see overallFor.
        const present = SKILLS.filter((s) => available[`${book}/${test}/${s}`]);
        const overall = overallFor(book, test, present);
        if (overall !== null) next[`${book}/${test}`] = overall;
        for (const skill of SKILLS) {
          const r = loadSkillResult(book, test, skill);
          // A paper only looked at has no band — see saveSkillResult.
          if (r && r.answered > 0) next[`${book}/${test}/${skill}`] = r.band;
        }
      }
    }
    setScores(next);
  }, [books, available]);

  const ordered = useMemo(
    () =>
      Array.from(books?.entries() ?? [])
        .sort((a, b) => b[0] - a[0]) // newest book first, like the printed catalogue
        .map(([book, tests]) => ({ book, tests: Array.from(tests).sort((a, b) => a - b) })),
    [books]
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <GraduationCap className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> IELTS Practice
        </h1>
        <p className="text-slate-500 mt-1">
          Full Academic tests in the real exam interface — official recordings, answer keys and a
          band estimate.
        </p>
      </div>

      {!books && (
        <div className="grid place-items-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {books && !ordered.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-neutral-700 p-12 text-center text-slate-500">
          No practice tests have been loaded yet.
        </div>
      )}

      {ordered.map(({ book, tests }) => (
        <section key={book}>
          <h2 className="text-2xl font-black text-center text-red-700 dark:text-red-400 mb-6">
            {bookTitle(book)} <span className="align-middle">✨</span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tests.map((test) => (
              <div
                key={test}
                className="rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900/40"
              >
                <div className="px-4 py-3 border-b border-slate-200 dark:border-neutral-800 font-bold flex items-center justify-between gap-2">
                  <span>Test {test}</span>
                  {scores[`${book}/${test}`] !== undefined && (
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-700 text-white">
                      {formatBand(scores[`${book}/${test}`])}
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2.5">
                  {SKILLS.map((skill) => {
                    const ready = available[`${book}/${test}/${skill}`];
                    return (
                      <button
                        key={skill}
                        disabled={!ready}
                        onClick={() => router.push(`/sat/ielts/${skill}?book=${book}&test=${test}`)}
                        className={`flex w-full items-center justify-between gap-2 text-left text-sm transition-colors ${
                          ready
                            ? "hover:text-emerald-600 dark:hover:text-emerald-400"
                            : "text-slate-400 dark:text-neutral-600 cursor-not-allowed"
                        }`}
                      >
                        <span>{SKILL_LABEL[skill]}</span>
                        {scores[`${book}/${test}/${skill}`] !== undefined && (
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-slate-200">
                            {formatBand(scores[`${book}/${test}/${skill}`])}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
