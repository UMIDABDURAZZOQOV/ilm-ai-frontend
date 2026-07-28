"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Timer } from "lucide-react";
import type { PracticeQuestion, PracticeResultItem } from "@/lib/skillTreeApi";
import Mascot from "./Mascot";
import AiTutor from "./AiTutor";
import VoiceAnswer from "./VoiceAnswer";
import Celebration from "@/components/ui/Celebration";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

interface FinishSummary {
  xp_awarded: number;
  extraLine?: string;
}

/**
 * Generic Duolingo-style question runner shared by the daily challenge,
 * mistakes practice, and lightning round. In timed mode (lightning) there is
 * no feedback pause — answers advance instantly against the countdown.
 */
export default function PracticeSession({
  lang,
  title,
  accent,
  questions,
  timerSeconds,
  onFinish,
  onExit,
}: {
  lang: string;
  title: string;
  accent: string;
  questions: PracticeQuestion[];
  timerSeconds?: number;
  onFinish: (results: PracticeResultItem[]) => Promise<FinishSummary>;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<PracticeResultItem[]>([]);
  const [finished, setFinished] = useState<FinishSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerSeconds ?? 0);
  const resultsRef = useRef<PracticeResultItem[]>([]);
  const finishedRef = useRef(false);

  const timed = timerSeconds !== undefined;

  async function finish(finalResults: PracticeResultItem[]) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setSubmitting(true);
    try {
      const summary = await onFinish(finalResults);
      setFinished(summary);
    } catch {
      setFinished({ xp_awarded: 0 });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!timed || finished) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          finish(resultsRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, finished]);

  const q = questions[index];

  function pick(option: string) {
    if (answered || !q) return;
    const isCorrect = option === q.correct_answer;
    const next = [...results, { question_id: q.id, is_correct: isCorrect }];
    setResults(next);
    resultsRef.current = next;

    if (timed) {
      // Lightning: no pause, straight to the next question.
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
      } else {
        finish(next);
      }
      return;
    }
    setSelected(option);
    setAnswered(true);
  }

  function nextQuestion() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      finish(resultsRef.current);
    }
  }

  if (finished) {
    const correct = resultsRef.current.filter((r) => r.is_correct).length;
    const total = resultsRef.current.length || questions.length;
    const perfect = total > 0 && correct === total;
    return (
      <div className="relative flex flex-col items-center gap-4 py-10 text-center">
        <Celebration />
        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
        >
          <Mascot mood="cheer" size={110} />
        </motion.div>
        <motion.h3
          className="text-xl font-extrabold"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {perfect
            ? (lang === "ru" ? "Идеально! 🎉" : lang === "en" ? "Perfect! 🎉" : "A'lo! 🎉")
            : (lang === "ru" ? "Готово!" : lang === "en" ? "Done!" : "Tayyor!")}
        </motion.h3>
        <div className="flex gap-8">
          <div>
            <div className="text-2xl font-extrabold text-emerald-500">
              <AnimatedNumber value={correct} duration={700} />/{total}
            </div>
            <div className="text-xs text-neutral-500">{lang === "ru" ? "Правильно" : lang === "en" ? "Correct" : "To'g'ri"}</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-500">
              +<AnimatedNumber value={finished.xp_awarded} duration={700} />
            </div>
            <div className="text-xs text-neutral-500">XP</div>
          </div>
        </div>
        {finished.extraLine && <p className="text-sm text-neutral-500">{finished.extraLine}</p>}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onExit}
          className="mt-2 px-8 py-3 rounded-2xl font-bold text-white shadow-md"
          style={{ backgroundColor: accent }}
        >
          {lang === "ru" ? "Продолжить" : lang === "en" ? "Continue" : "Davom etish"}
        </motion.button>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <Mascot mood="happy" size={90} />
        <p className="text-neutral-500">
          {lang === "ru" ? "Вопросов пока нет" : lang === "en" ? "No questions yet" : "Hozircha savollar yo'q"}
        </p>
        <button onClick={onExit} className="px-6 py-3 rounded-2xl font-bold text-white bg-neutral-800">
          {lang === "ru" ? "Назад" : lang === "en" ? "Back" : "Orqaga"}
        </button>
      </div>
    );
  }

  const isCorrect = selected === q.correct_answer;
  const progressPct = ((index + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onExit} className="text-neutral-400 hover:text-neutral-700">
          <X className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold">{title}</span>
        <div className="flex-1 h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: accent }} animate={{ width: `${progressPct}%` }} />
        </div>
        {timed && (
          <span className={`flex items-center gap-1 text-sm font-extrabold ${timeLeft <= 10 ? "text-red-500" : "text-neutral-500"}`}>
            <Timer className="w-4 h-4" />
            {timeLeft}s
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.18 }}>
          <h3 className="text-base font-bold mb-4">{q.question_text}</h3>
          <div className="flex flex-col gap-2.5">
            {q.options.map((opt) => {
              const showCorrect = answered && opt === q.correct_answer;
              const showWrong = answered && selected === opt && !isCorrect;
              return (
                <button
                  key={opt}
                  onClick={() => pick(opt)}
                  disabled={answered}
                  className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    showCorrect
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                      : showWrong
                      ? "border-red-500 bg-red-50 dark:bg-red-950"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className={`mt-4 p-4 rounded-xl ${isCorrect ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"}`}>
              <p className={`text-sm font-extrabold ${isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                {isCorrect
                  ? lang === "ru" ? "Отлично!" : lang === "en" ? "Nice!" : "Ajoyib!"
                  : lang === "ru" ? "Неправильно" : lang === "en" ? "Incorrect" : "Noto'g'ri"}
              </p>
              {q.explanation && <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{q.explanation}</p>}
              {!isCorrect && (
                <AiTutor
                  lang={lang}
                  questionText={q.question_text}
                  options={q.options}
                  correctAnswer={q.correct_answer}
                  userAnswer={selected}
                />
              )}
              <VoiceAnswer
                lang={lang}
                questionText={q.question_text}
                correctAnswer={q.correct_answer}
              />
              <button
                onClick={nextQuestion}
                disabled={submitting}
                className="mt-3 px-5 py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ backgroundColor: accent }}
              >
                {lang === "ru" ? "Далее" : lang === "en" ? "Continue" : "Davom etish"}
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
