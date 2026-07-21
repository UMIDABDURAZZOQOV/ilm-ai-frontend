"use client";

import { useState } from "react";
import { GraduationCap, Loader2, X } from "lucide-react";
import {
  completeLevelTest,
  getLevelTest,
  type LevelInfo,
  type PracticeQuestion,
  type PracticeResultItem,
} from "@/lib/skillTreeApi";
import PracticeSession from "./PracticeSession";

/** Short "what this level means" line per CEFR band. */
const LEVEL_BLURB: Record<string, { uz: string; ru: string; en: string }> = {
  A1: {
    uz: "Boshlang'ich — oddiy so'z va iboralar",
    ru: "Начальный — простые слова и фразы",
    en: "Beginner — simple words and phrases",
  },
  A2: {
    uz: "Elementar — kundalik oddiy suhbat",
    ru: "Элементарный — простое повседневное общение",
    en: "Elementary — simple everyday conversation",
  },
  B1: {
    uz: "O'rta — tanish mavzularda erkin gaplashasiz",
    ru: "Средний — свободно на знакомые темы",
    en: "Intermediate — comfortable on familiar topics",
  },
  B2: {
    uz: "O'rtadan yuqori — murakkab matnlarni tushunasiz",
    ru: "Выше среднего — понимаете сложные тексты",
    en: "Upper-intermediate — you handle complex texts",
  },
  C1: {
    uz: "Yuqori — deyarli erkin darajada",
    ru: "Продвинутый — почти свободное владение",
    en: "Advanced — near-fluent",
  },
};

const t = (lang: string, uz: string, ru: string, en: string) =>
  lang === "ru" ? ru : lang === "en" ? en : uz;

/**
 * Placement test shown when a LANGUAGE subject is opened. Pulls a mixed-difficulty
 * quiz from that subject's bank, then stores/shows the resulting CEFR level.
 * The question runner itself is the shared PracticeSession.
 */
export default function LevelTest({
  userId,
  subjectSlug,
  subjectName,
  accent = "#58CC02",
  lang,
  initialLevel = null,
  onClose,
}: {
  userId: number;
  subjectSlug: string;
  subjectName: string;
  accent?: string;
  lang: string;
  initialLevel?: LevelInfo | null;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"intro" | "loading" | "testing" | "result">("intro");
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [level, setLevel] = useState<LevelInfo | null>(initialLevel);
  const [error, setError] = useState("");

  async function start() {
    setPhase("loading");
    setError("");
    try {
      const data = await getLevelTest(userId, subjectSlug);
      if (!data.questions?.length) {
        setError(t(lang, "Bu fan uchun savollar topilmadi.", "Вопросы для этого предмета не найдены.", "No questions available for this subject."));
        setPhase("intro");
        return;
      }
      setQuestions(data.questions as PracticeQuestion[]);
      if (data.current_level) setLevel(data.current_level);
      setPhase("testing");
    } catch {
      setError(t(lang, "Testni yuklab bo'lmadi.", "Не удалось загрузить тест.", "Could not load the test."));
      setPhase("intro");
    }
  }

  async function handleFinish(results: PracticeResultItem[]) {
    const res = await completeLevelTest({ user_id: userId, subject_slug: subjectSlug, results });
    setLevel({ level: res.level, score: res.score, total: res.total, score_pct: res.score_pct });
    return {
      xp_awarded: 0,
      extraLine: t(lang, `Darajangiz: ${res.level}`, `Ваш уровень: ${res.level}`, `Your level: ${res.level}`),
    };
  }

  if (phase === "testing") {
    return (
      <PracticeSession
        lang={lang}
        title={t(lang, "Daraja testi", "Тест на уровень", "Placement test")}
        accent={accent}
        questions={questions}
        onFinish={handleFinish}
        onExit={() => setPhase("result")}
      />
    );
  }

  const blurb = level ? LEVEL_BLURB[level.level] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
          style={{ backgroundColor: `${accent}22` }}
        >
          <GraduationCap className="w-7 h-7" style={{ color: accent }} />
        </div>

        <h3 className="text-lg font-extrabold mb-1">
          {t(lang, "Til darajangizni aniqlang", "Определите свой уровень", "Find your level")}
        </h3>
        <p className="text-sm text-neutral-500 mb-4">{subjectName}</p>

        {level && (
          <div className="mb-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="text-4xl font-extrabold" style={{ color: accent }}>
              {level.level}
            </div>
            {blurb && <div className="text-xs text-neutral-500 mt-1">{t(lang, blurb.uz, blurb.ru, blurb.en)}</div>}
            {level.total > 0 && (
              <div className="text-xs text-neutral-500 mt-2">
                {level.score}/{level.total} · {Math.round(level.score_pct)}%
              </div>
            )}
          </div>
        )}

        {!level && (
          <p className="text-sm text-neutral-500 mb-4">
            {t(
              lang,
              "Qisqa test (15 savol) darajangizni A1–C1 shkalasida aniqlaydi.",
              "Короткий тест (15 вопросов) определит ваш уровень по шкале A1–C1.",
              "A short 15-question test places you on the A1–C1 scale."
            )}
          </p>
        )}

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <button
          onClick={start}
          disabled={phase === "loading"}
          className="w-full py-3 rounded-2xl font-bold text-white shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: accent }}
        >
          {phase === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
          {level
            ? t(lang, "Qayta topshirish", "Пройти заново", "Retake test")
            : t(lang, "Testni boshlash", "Начать тест", "Start test")}
        </button>
      </div>
    </div>
  );
}
