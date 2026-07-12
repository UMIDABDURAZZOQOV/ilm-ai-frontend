"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookText, ArrowLeft, Clock, Check, X, RotateCcw, ChevronRight } from "lucide-react";
import { IELTS_READING, type IeltsPassage } from "@/lib/ielts";

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function IeltsReadingPage() {
  const [passage, setPassage] = useState<IeltsPassage | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    if (!passage) return 0;
    return passage.questions.reduce(
      (n, q) => (norm(answers[q.id] || "") === norm(q.answer) ? n + 1 : n),
      0
    );
  }, [passage, answers, submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  function open(p: IeltsPassage) {
    setPassage(p);
    setAnswers({});
    setSubmitted(false);
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  // ── List view ──────────────────────────────────────────────────────────────
  if (!passage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <BookText className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> IELTS Reading
          </h1>
          <p className="text-slate-500 mt-1">
            Academic Reading practice — original passages in the real IELTS format, with instant scoring.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {IELTS_READING.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => open(p)}
              className="group text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0d3b4f]/10 dark:bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#0d3b4f] dark:text-amber-400">
                {p.level}
              </span>
              <h3 className="font-bold text-lg mt-3">{p.title}</h3>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.minutes} min</span>
                <span>{p.questions.length} questions</span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#0d3b4f] dark:text-amber-400">
                Start <ChevronRight className="h-4 w-4" />
              </span>
            </motion.button>
          ))}
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm text-slate-500">
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">About this bank</p>
          Every passage and question here is written originally in the standard Academic IELTS format
          (True/False/Not Given, multiple choice, and sentence completion). More passages — plus Writing and
          Speaking practice — are on the way.
        </div>
      </div>
    );
  }

  // ── Practice view ──────────────────────────────────────────────────────────
  const answeredCount = passage.questions.filter((q) => answers[q.id]).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setPassage(null)} className="p-2 -ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-black flex-1 truncate">{passage.title}</h1>
        {submitted && (
          <span className="shrink-0 text-sm font-black tabular-nums text-[#0d3b4f] dark:text-amber-400">
            {score}/{passage.questions.length}
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Passage */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:max-h-[70vh] lg:overflow-y-auto space-y-4 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
          {passage.paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Questions */}
        <div className="space-y-4 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
          {passage.questions.map((q, qi) => {
            const chosen = answers[q.id] || "";
            const correct = submitted && norm(chosen) === norm(q.answer);
            const wrong = submitted && chosen && !correct;
            return (
              <div
                key={q.id}
                className={`rounded-2xl border p-4 ${
                  submitted
                    ? correct
                      ? "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-900/10"
                      : "border-red-300 dark:border-red-500/40 bg-red-50/50 dark:bg-red-900/10"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                    {qi + 1}
                  </span>
                  <p className="text-sm font-medium">
                    {q.prompt}
                    {q.hint && <span className="ml-1 text-xs font-normal text-slate-400">({q.hint})</span>}
                  </p>
                </div>

                {q.type === "completion" ? (
                  <input
                    value={chosen}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    disabled={submitted}
                    placeholder="Type your answer…"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-[#0d3b4f] dark:focus:border-amber-400 disabled:opacity-70"
                  />
                ) : (
                  <div className="space-y-2">
                    {q.options!.map((opt) => {
                      const isChosen = chosen === opt;
                      const isAnswer = submitted && norm(opt) === norm(q.answer);
                      return (
                        <button
                          key={opt}
                          onClick={() => !submitted && setAnswers((a) => ({ ...a, [q.id]: opt }))}
                          disabled={submitted}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                            isAnswer
                              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                              : isChosen
                              ? submitted
                                ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                                : "border-[#0d3b4f] dark:border-amber-400 bg-[#0d3b4f]/5 dark:bg-amber-400/10"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
                          }`}
                        >
                          <span className="shrink-0 h-4 w-4 rounded-full border-2 border-current opacity-40" />
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {submitted && !correct && (
                  <p className="mt-2 text-xs text-slate-500">
                    Correct answer: <span className="font-bold text-emerald-600 dark:text-emerald-400">{q.answer}</span>
                  </p>
                )}
              </div>
            );
          })}

          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              disabled={answeredCount === 0}
              className="w-full py-3.5 bg-[#0d3b4f] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all"
            >
              Submit answers ({answeredCount}/{passage.questions.length})
            </button>
          ) : (
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:border-[#0d3b4f] dark:hover:border-amber-400 transition-all"
            >
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
