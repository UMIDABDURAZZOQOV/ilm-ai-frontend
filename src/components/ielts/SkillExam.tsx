"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { bandColor, formatBand, rawToBand } from "@/lib/ieltsBand";
import { isCorrect, type ExamQuestion } from "./ReadingExam";

export interface SkillSection {
  /** 1-4 for Listening parts, 1-3 for Reading passages. */
  index: number;
  label: string;
  questions: ExamQuestion[];
}

/**
 * One skill = one paper.
 *
 * Each part used to be its own exam with its own score, so a learner sat four
 * ten-question Listening tests and got four separate marks. The real paper is 40
 * questions with a single band, and that is the only number that means anything —
 * `rawToBand` is defined over 40. This owns the answers for the whole skill, keeps
 * one autosave for it, and renders the active part through the existing
 * Reading/Listening components in controlled mode.
 */
export default function SkillExam({
  storageKey,
  sections,
  skill,
  render,
  bottomExtra,
}: {
  storageKey: string;
  sections: SkillSection[];
  skill: "listening" | "reading";
  /** Draws one part; the answers and scoring come back through these props. */
  render: (
    section: SkillSection,
    props: {
      answers: Record<number, string>;
      onAnswerChange: (n: number, v: string) => void;
      scoreQuestions: ExamQuestion[];
    }
  ) => ReactNode;
  bottomExtra?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showScores, setShowScores] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setAnswers(JSON.parse(raw));
    } catch {
      /* ignore corrupt cache */
    }
    loaded.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch {
      /* quota — not fatal */
    }
  }, [answers, storageKey]);

  const all = sections.flatMap((s) => s.questions);
  const correct = all.filter((q) => isCorrect(answers[q.number] || "", q.correct_answer)).length;
  const answered = all.filter((q) => (answers[q.number] || "").trim()).length;
  const band = rawToBand(correct, skill);

  const onAnswerChange = (n: number, v: string) => setAnswers((a) => ({ ...a, [n]: v }));
  const section = sections[active];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-hidden">
        {showScores ? (
          <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-black mb-6 capitalize">{skill}</h2>
            <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 mb-6">
              <div className="text-5xl font-black" style={{ color: bandColor(band) }}>
                {formatBand(band)}
              </div>
              <div className="mt-3 text-sm text-slate-500 space-x-4">
                <span className="text-emerald-600 font-bold">✓ {correct}</span>
                <span className="text-red-500 font-bold">✕ {answered - correct}</span>
                <span>− {all.length - answered}</span>
              </div>
            </div>

            <div className="space-y-2">
              {sections.map((s, i) => {
                const c = s.questions.filter((q) =>
                  isCorrect(answers[q.number] || "", q.correct_answer)
                ).length;
                return (
                  <button
                    key={s.index}
                    onClick={() => {
                      setActive(i);
                      setShowScores(false);
                    }}
                    className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-neutral-800 px-4 py-3 text-left hover:border-slate-400"
                  >
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-sm text-slate-500">
                      {c}/{s.questions.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          render(section, { answers, onAnswerChange, scoreQuestions: all })
        )}
      </div>

      {/* The real test navigator: Scores · 1 · 2 · 3 · 4 */}
      <div className="shrink-0 flex items-center justify-center gap-2 py-3 border-t border-slate-200 dark:border-neutral-800">
        <button
          onClick={() => setShowScores(true)}
          className={`px-4 py-2 rounded-lg font-bold text-sm border ${
            showScores
              ? "bg-slate-900 text-white border-slate-900"
              : "border-slate-300 dark:border-neutral-700"
          }`}
        >
          Scores
        </button>
        {sections.map((s, i) => (
          <button
            key={s.index}
            onClick={() => {
              setActive(i);
              setShowScores(false);
            }}
            className={`w-10 py-2 rounded-lg font-bold text-sm border ${
              !showScores && i === active
                ? "bg-slate-900 text-white border-slate-900"
                : "border-slate-300 dark:border-neutral-700"
            }`}
          >
            {s.index}
          </button>
        ))}
        {bottomExtra}
      </div>
    </div>
  );
}
