"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Loader2, Check, X } from "lucide-react";
import { getAdaptivePool, type PracticeQuestion } from "@/lib/skillTreeApi";
import { MathText } from "@/components/MathText";

type AdaptiveQuestion = PracticeQuestion & { difficulty?: string };

/**
 * Adaptive practice: one question at a time, and the difficulty follows the learner.
 * A correct answer climbs to a harder level, a wrong one drops to easier — so a strong
 * student is stretched and a struggling one is not buried. The whole pool is fetched
 * once and the next level is chosen on the client, so there is no per-question wait.
 */
type Level = 0 | 1 | 2; // easy, medium, hard
const LEVELS = ["easy", "medium", "hard"] as const;
const LEVEL_LABEL = ["Oson", "O'rta", "Qiyin"];
const LEVEL_COLOR = ["#22c55e", "#f59e0b", "#ef4444"];
const TOTAL = 15;

export default function AdaptivePractice({
  userId,
  subjectSlug,
  subjectName,
  onBack,
}: {
  userId: number;
  subjectSlug: string;
  subjectName: string;
  onBack: () => void;
}) {
  const [pool, setPool] = useState<{ easy: AdaptiveQuestion[]; medium: AdaptiveQuestion[]; hard: AdaptiveQuestion[] } | null>(null);
  const [error, setError] = useState("");
  const [level, setLevel] = useState<Level>(1);
  const [count, setCount] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [q, setQ] = useState<AdaptiveQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const used = useRef<Set<number>>(new Set());

  useEffect(() => {
    getAdaptivePool(userId, subjectSlug)
      .then((d) => setPool({ easy: d.easy, medium: d.medium, hard: d.hard }))
      .catch(() => setError("Savollarni yuklab bo'lmadi."));
  }, [userId, subjectSlug]);

  // Pick an unused question at `lvl`, falling back to the nearest level that still has one.
  const pick = (lvl: Level): AdaptiveQuestion | null => {
    if (!pool) return null;
    const order: Level[] = [lvl, (lvl + 1) as Level, (lvl - 1) as Level, 1, 0, 2].filter((l) => l >= 0 && l <= 2) as Level[];
    for (const l of order) {
      const bucket = pool[LEVELS[l]];
      const found = bucket.find((x) => !used.current.has(x.id));
      if (found) { used.current.add(found.id); return found; }
    }
    return null;
  };

  useEffect(() => {
    if (pool && !q && count < TOTAL) setQ(pick(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  const choose = (opt: string) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const ok = opt === q?.correct_answer;
    if (ok) setCorrect((c) => c + 1);
    // Move the level for the NEXT question.
    setLevel((l) => (ok ? Math.min(2, l + 1) : Math.max(0, l - 1)) as Level);
  };

  const next = () => {
    const n = count + 1;
    setCount(n);
    setAnswered(false);
    setSelected(null);
    setQ(n < TOTAL ? pick(level) : null);
  };

  const done = count >= TOTAL || (pool && !q && count > 0);
  const currentLevel = useMemo<Level>(() => (q ? (LEVELS.indexOf((q.difficulty as any) ?? "medium") as Level) : level), [q, level]);

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ChevronLeft className="w-4 h-4" /> Orqaga
      </button>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold">Adaptiv mashq · {subjectName}</h2>
        {q && !done && (
          <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: LEVEL_COLOR[currentLevel], backgroundColor: `${LEVEL_COLOR[currentLevel]}22` }}>
            {LEVEL_LABEL[currentLevel]}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!pool && !error && <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}

      {q && !done && (
        <>
          <div className="text-xs text-neutral-400 mb-2">{count + 1} / {TOTAL}</div>
          <div className="rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-4 mb-4">
            <MathText className="font-bold whitespace-pre-line">{q.question_text}</MathText>
          </div>
          <div className="space-y-2">
            {(q.options ?? []).map((opt, i) => {
              const isSel = selected === opt;
              const isRight = answered && opt === q.correct_answer;
              const isWrong = answered && isSel && opt !== q.correct_answer;
              return (
                <button key={i} onClick={() => choose(opt)} disabled={answered}
                  className={`w-full text-left rounded-xl border-2 px-4 py-3 flex items-center justify-between transition-colors ${
                    isRight ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                    : isWrong ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                    : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
                  }`}>
                  <MathText className="text-[15px]">{opt}</MathText>
                  {isRight && <Check className="w-4 h-4 text-emerald-500" />}
                  {isWrong && <X className="w-4 h-4 text-red-500" />}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className="mt-4">
              {q.explanation && <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">{q.explanation}</p>}
              <button onClick={next} className="w-full py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold">
                {count + 1 < TOTAL ? "Keyingisi →" : "Yakunlash"}
              </button>
            </div>
          )}
        </>
      )}

      {done && (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">{correct >= TOTAL * 0.7 ? "🏆" : "💪"}</div>
          <p className="font-black text-lg">{correct} / {count} to'g'ri</p>
          <button onClick={onBack} className="mt-4 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm">Tugatish</button>
        </div>
      )}
    </div>
  );
}
