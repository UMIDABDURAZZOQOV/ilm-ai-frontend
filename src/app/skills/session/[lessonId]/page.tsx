"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import {
  startLesson,
  completeLesson,
  type LessonQuestion,
  type LessonResultItem,
  type LessonCompleteResponse,
  type TheoryCard,
} from "@/lib/skillTreeApi";
import Mascot from "@/components/skills/Mascot";
import AiTutor from "@/components/skills/AiTutor";
import Confetti from "@/components/skills/Confetti";

// "learning" is the Duolingo-style teach-first phase: the lesson's theory
// cards are shown one at a time BEFORE any question appears.
type Phase = "loading" | "learning" | "playing" | "finished" | "error";

export default function LessonSessionPage() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const router = useRouter();
  const params = useParams<{ lessonId: string }>();
  const lessonId = Number(params.lessonId);

  const [phase, setPhase] = useState<Phase>("loading");
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [theory, setTheory] = useState<TheoryCard[]>([]);
  const [theoryIndex, setTheoryIndex] = useState(0);
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<LessonResultItem[]>([]);
  const [completion, setCompletion] = useState<LessonCompleteResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    startLesson(lessonId, user.id)
      .then((res) => {
        setAttemptId(res.attempt_id);
        setTheory(res.theory ?? []);
        setQuestions(res.questions);
        setPhase(res.theory && res.theory.length > 0 ? "learning" : "playing");
      })
      .catch(() => {
        setErrorMsg(lang === "ru" ? "Не удалось загрузить урок" : lang === "en" ? "Failed to load lesson" : "Darsni yuklab bo'lmadi");
        setPhase("error");
      });
  }, [user, lessonId, lang]);

  function nextTheoryCard() {
    if (theoryIndex + 1 < theory.length) {
      setTheoryIndex((i) => i + 1);
    } else {
      setPhase("playing");
    }
  }

  function pick(option: string) {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    const q = questions[index];
    const isCorrect = option === q.correct_answer;
    setResults((r) => [...r, { question_id: q.id, user_answer: option, is_correct: isCorrect }]);
  }

  async function next() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
      return;
    }
    // finished all questions
    if (!user || attemptId === null) return;
    try {
      const finalResults = results;
      const res = await completeLesson(lessonId, { user_id: user.id, attempt_id: attemptId, results: finalResults });
      setCompletion(res);
      setPhase("finished");
    } catch {
      setErrorMsg(lang === "ru" ? "Не удалось сохранить результат" : lang === "en" ? "Failed to save result" : "Natijani saqlab bo'lmadi");
      setPhase("error");
    }
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-neutral-950 p-6 text-center">
        <Mascot mood="sad" size={100} />
        <p className="text-neutral-600 dark:text-neutral-300">{errorMsg}</p>
        <button onClick={() => router.back()} className="px-6 py-3 rounded-2xl font-bold text-white bg-neutral-800">
          {lang === "ru" ? "Назад" : lang === "en" ? "Back" : "Orqaga"}
        </button>
      </div>
    );
  }

  if (phase === "learning") {
    const card = theory[theoryIndex];
    const learnPct = ((theoryIndex + 1) / theory.length) * 100;
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-neutral-100 dark:border-neutral-900">
          <button onClick={() => router.back()} className="text-neutral-400 hover:text-neutral-700">
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1 h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "#1CB0F6" }}
              animate={{ width: `${learnPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs font-bold text-neutral-400">
            {lang === "ru" ? "Учим" : lang === "en" ? "Learn" : "O'rganamiz"}
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={theoryIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <div className="flex justify-center mb-6">
                <Mascot mood="happy" size={80} />
              </div>
              <div className="rounded-3xl border-2 border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950 p-6">
                <h2 className="text-xl font-extrabold mb-3 text-sky-800 dark:text-sky-200">{card.title}</h2>
                <p className="text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300">{card.body}</p>
                {card.example && (
                  <div className="mt-4 rounded-2xl bg-white dark:bg-neutral-900 border border-sky-100 dark:border-sky-900 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-sky-500 mb-1">
                      {lang === "ru" ? "Пример" : lang === "en" ? "Example" : "Misol"}
                    </p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{card.example}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-6 py-5 border-t border-neutral-100 dark:border-neutral-900">
          <div className="max-w-xl mx-auto">
            <button
              onClick={nextTheoryCard}
              className="w-full px-6 py-4 rounded-2xl font-extrabold text-white shadow-md"
              style={{ backgroundColor: "#58CC02" }}
            >
              {theoryIndex + 1 < theory.length
                ? lang === "ru" ? "Далее" : lang === "en" ? "Continue" : "Davom etish"
                : lang === "ru" ? "Начать тест!" : lang === "en" ? "Start quiz!" : "Testni boshlash!"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "finished" && completion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-neutral-950 p-6 text-center">
        <Confetti active={completion.stars >= 1} count={completion.stars >= 3 ? 60 : 40} />
        <Mascot mood="cheer" size={140} />
        <h2 className="text-2xl font-extrabold">{lang === "ru" ? "Урок завершён!" : lang === "en" ? "Lesson complete!" : "Dars yakunlandi!"}</h2>
        <div className="flex gap-1 text-3xl">
          {[1, 2, 3].map((i) => (
            <span key={i} className={i <= completion.stars ? "" : "opacity-20"}>
              ⭐
            </span>
          ))}
        </div>
        <div className="flex gap-6 mt-2">
          <div className="text-center">
            <div className="text-2xl font-extrabold text-amber-500">+{completion.xp_awarded}</div>
            <div className="text-xs text-neutral-500">XP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-emerald-500">
              {completion.score}/{completion.total}
            </div>
            <div className="text-xs text-neutral-500">{lang === "ru" ? "Правильно" : lang === "en" ? "Correct" : "To'g'ri"}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-orange-500">{completion.streak_days}</div>
            <div className="text-xs text-neutral-500">{lang === "ru" ? "Дней подряд" : lang === "en" ? "Day streak" : "Kunlik seriya"}</div>
          </div>
        </div>
        <button
          onClick={() => {
            // Duolingo-style: finishing a lesson lands you back on the SAME
            // subject's path, where the newly unlocked lesson is waiting —
            // never bounced out to the main dashboard.
            const subject = new URLSearchParams(window.location.search).get("subject");
            router.push(subject ? `/skills?subject=${subject}` : "/skills");
          }}
          className="mt-4 px-8 py-3 rounded-2xl font-bold text-white shadow-md"
          style={{ backgroundColor: "#58CC02" }}
        >
          {lang === "ru" ? "Продолжить" : lang === "en" ? "Continue" : "Davom etish"}
        </button>
      </div>
    );
  }

  const q = questions[index];
  if (!q) return null;
  const isCorrect = selected === q.correct_answer;
  const progressPct = ((index + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-neutral-100 dark:border-neutral-900">
        <button onClick={() => router.back()} className="text-neutral-400 hover:text-neutral-700">
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "#58CC02" }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-xl mx-auto w-full">
        <h2 className="text-lg font-bold text-center mb-8">{q.question_text}</h2>
        <div className="w-full flex flex-col gap-3">
          {q.options.map((opt) => {
            const isSelected = selected === opt;
            const showCorrect = answered && opt === q.correct_answer;
            const showWrong = answered && isSelected && !isCorrect;
            return (
              <button
                key={opt}
                onClick={() => pick(opt)}
                disabled={answered}
                className={`text-left px-5 py-4 rounded-2xl border-2 font-medium transition-colors ${
                  showCorrect
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : showWrong
                    ? "border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                    : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`px-6 py-5 border-t-2 ${
              isCorrect ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200" : "bg-red-50 dark:bg-red-950 border-red-200"
            }`}
          >
            <div className="max-w-xl mx-auto flex items-start gap-4">
              <Mascot mood={isCorrect ? "happy" : "sad"} size={56} />
              <div className="flex-1">
                <p className={`font-extrabold mb-1 ${isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                  {isCorrect ? (lang === "ru" ? "Отлично!" : lang === "en" ? "Nice!" : "Ajoyib!") : lang === "ru" ? "Неправильно" : lang === "en" ? "Incorrect" : "Noto'g'ri"}
                </p>
                {q.explanation && <p className="text-sm text-neutral-600 dark:text-neutral-400">{q.explanation}</p>}
                {!isCorrect && (
                  <AiTutor
                    lang={lang}
                    questionText={q.question_text}
                    options={q.options}
                    correctAnswer={q.correct_answer}
                    userAnswer={selected}
                  />
                )}
              </div>
              <button
                onClick={next}
                className={`px-6 py-3 rounded-2xl font-bold text-white shrink-0 ${isCorrect ? "bg-emerald-500" : "bg-red-500"}`}
              >
                {lang === "ru" ? "Далее" : lang === "en" ? "Continue" : "Davom etish"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
