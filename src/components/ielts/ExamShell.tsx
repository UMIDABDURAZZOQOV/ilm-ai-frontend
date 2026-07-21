"use client";

import type { ReactNode } from "react";
import { formatBand } from "@/lib/ieltsBand";

export type ExamTab =
  | { kind: "listening" }
  | { kind: "reading"; passage: 1 | 2 | 3 }
  | { kind: "writing"; task: 1 | 2 }
  | { kind: "speaking" };

export function tabKey(t: ExamTab): string {
  if (t.kind === "reading") return `reading-${t.passage}`;
  if (t.kind === "writing") return `writing-${t.task}`;
  return t.kind;
}

/**
 * Full-screen mock-test chrome: the current skill fills the page and a compact
 * bar at the bottom moves between Listening · 1 · 2 · 3 · Writing · Speaking,
 * the way the real test navigator does.
 */
export default function ExamShell({
  title = "Mock Test",
  tabs,
  active,
  onChange,
  children,
}: {
  title?: string;
  tabs: ExamTab[];
  active: ExamTab;
  onChange: (t: ExamTab) => void;
  children: ReactNode;
}) {
  const activeKey = tabKey(active);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="text-center py-2 font-bold text-emerald-700 dark:text-emerald-400">{title}</div>

      <div className="flex-1 overflow-hidden">{children}</div>

      <div className="flex items-center justify-center gap-2 py-3 border-t border-slate-200 dark:border-neutral-800">
        {tabs.map((t) => {
          const key = tabKey(t);
          const isActive = key === activeKey;
          const label =
            t.kind === "reading"
              ? String(t.passage)
              : t.kind === "writing"
              ? String(t.task)
              : t.kind === "listening"
              ? "Listening"
              : "Speaking";
          const wide = t.kind === "listening" || t.kind === "speaking";
          return (
            <button
              key={key}
              onClick={() => onChange(t)}
              className={`rounded-lg font-bold text-sm border transition-colors ${
                wide ? "px-4 py-2" : "w-10 py-2"
              } ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900"
                  : "border-slate-300 dark:border-neutral-700"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Test browser ────────────────────────────────────────────────────────────

export interface TestSummary {
  id: number | string;
  name: string;                 // "Test 1"
  bands?: Partial<Record<"listening" | "reading" | "writing" | "speaking", number>>;
}

export interface TestBook {
  id: number | string;
  title: string;                // "IELTS 21 Academic 2026"
  isNew?: boolean;
  tests: TestSummary[];
}

const SKILLS = ["listening", "reading", "writing", "speaking"] as const;
const SKILL_LABEL: Record<(typeof SKILLS)[number], string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

/** Book → test cards, each listing the four skills with any band earned. */
export function TestBrowser({
  books,
  onOpen,
  emptyHint,
}: {
  books: TestBook[];
  onOpen: (book: TestBook, test: TestSummary, skill: (typeof SKILLS)[number]) => void;
  emptyHint?: string;
}) {
  if (!books.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-neutral-700 p-10 text-center text-slate-500">
        {emptyHint ?? "No practice tests available yet."}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {books.map((book) => (
        <section key={book.id}>
          <h2 className="text-xl font-black text-center text-red-700 dark:text-red-400 mb-5">
            {book.title} {book.isNew && <span className="align-middle">✨</span>}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {book.tests.map((test) => (
              <div
                key={test.id}
                className="rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-800">
                  <span className="font-bold">{test.name}</span>
                </div>
                <div className="p-4 space-y-2">
                  {SKILLS.map((s) => {
                    const band = test.bands?.[s];
                    return (
                      <button
                        key={s}
                        onClick={() => onOpen(book, test, s)}
                        className="w-full flex items-center justify-between text-sm hover:underline"
                      >
                        <span>{SKILL_LABEL[s]}</span>
                        {band !== undefined && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                            {formatBand(band)}
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
