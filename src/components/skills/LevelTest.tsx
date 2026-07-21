"use client";

import { useState } from "react";
import { Check, GraduationCap, Loader2, X } from "lucide-react";
import {
  completeLevelTest,
  getLevelTest,
  type LevelInfo,
  type PracticeQuestion,
  type PracticeResultItem,
} from "@/lib/skillTreeApi";
import PracticeSession from "./PracticeSession";

/** Short "what this level means" line, for both scales. */
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
  C2: {
    uz: "Eng yuqori — ona tilida so'zlashuvchiga yaqin",
    ru: "Владение в совершенстве — близко к носителю",
    en: "Mastery — near-native",
  },
  daraja_1: { uz: "Bazaviy maktab darajasi", ru: "Базовый школьный уровень", en: "Basic school level" },
  daraja_2: { uz: "O'rta maktab darajasi", ru: "Средний школьный уровень", en: "Mid school level" },
  daraja_3: { uz: "Milliy Sertifikat — B daraja", ru: "Нац. сертификат — уровень B", en: "National Certificate — B" },
  daraja_4: { uz: "Milliy Sertifikat — A daraja", ru: "Нац. сертификат — уровень A", en: "National Certificate — A" },
  daraja_5: { uz: "Olimpiada darajasi", ru: "Олимпиадный уровень", en: "Olympiad level" },
};

const t = (lang: string, uz: string, ru: string, en: string) =>
  lang === "ru" ? ru : lang === "en" ? en : uz;

/**
 * Placement test shown when a subject is opened.
 *
 * The result is decided by which levels the learner actually masters, so the screen
 * shows the per-level breakdown rather than a bare band — someone who lands on B1 can
 * see they cleared A1/A2/B1 and stalled at B2, which is the part that makes the
 * number believable.
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
  const [scaleLabel, setScaleLabel] = useState<string>("");
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
      setQuestions(data.questions as unknown as PracticeQuestion[]);
      setScaleLabel(data.levels.map((l) => l.label).join("–"));
      if (data.current_level) setLevel(data.current_level);
      setPhase("testing");
    } catch (err) {
      // A subject whose calibrated bank has not been generated yet answers 404;
      // that is "not ready", not "broken", and saying so avoids a bug report.
      const missing = err instanceof Error && /404|not found|no placement/i.test(err.message);
      setError(
        missing
          ? t(lang, "Bu fan uchun daraja testi hali tayyorlanmoqda.", "Тест по этому предмету ещё готовится.", "The placement test for this subject is still being prepared.")
          : t(lang, "Testni yuklab bo'lmadi.", "Не удалось загрузить тест.", "Could not load the test.")
      );
      setPhase("intro");
    }
  }

  async function handleFinish(results: PracticeResultItem[]) {
    const res = await completeLevelTest({ user_id: userId, subject_slug: subjectSlug, results });
    setLevel(res);
    const shown = res.label ?? res.level;
    return {
      xp_awarded: 0,
      extraLine: t(lang, `Darajangiz: ${shown}`, `Ваш уровень: ${shown}`, `Your level: ${shown}`),
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
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 text-center relative">
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
          {t(lang, "Darajangizni aniqlang", "Определите свой уровень", "Find your level")}
        </h3>
        <p className="text-sm text-neutral-500 mb-4">{subjectName}</p>

        {level && (
          <div className="mb-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="text-4xl font-extrabold" style={{ color: accent }}>
              {level.label ?? level.level}
            </div>
            {blurb && <div className="text-xs text-neutral-500 mt-1">{t(lang, blurb.uz, blurb.ru, blurb.en)}</div>}
            {level.total > 0 && (
              <div className="text-xs text-neutral-500 mt-2">
                {level.score}/{level.total} · {Math.round(level.score_pct)}%
              </div>
            )}

            {/* Why it landed here: the level is the highest one actually mastered. */}
            {level.breakdown && level.breakdown.length > 0 && (
              <div className="mt-4 space-y-1.5 text-left">
                {level.breakdown
                  .filter((r) => r.asked > 0)
                  .map((r) => (
                    <div key={r.level} className="flex items-center gap-2 text-xs">
                      <span className="w-16 shrink-0 font-bold">{r.label}</span>
                      <span className="flex-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${r.pct}%`,
                            backgroundColor: r.mastered ? accent : "#94a3b8",
                          }}
                        />
                      </span>
                      <span className="w-14 shrink-0 text-right text-neutral-500 tabular-nums">
                        {r.correct}/{r.asked}
                      </span>
                      {r.mastered && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {!level && (
          <p className="text-sm text-neutral-500 mb-4">
            {t(
              lang,
              `Har bir darajadan savollar beriladi${scaleLabel ? ` (${scaleLabel})` : ""}. Darajangiz — siz haqiqatan o'zlashtirgan eng yuqori bosqich.`,
              `Вопросы даются с каждого уровня${scaleLabel ? ` (${scaleLabel})` : ""}. Ваш уровень — высшая ступень, которой вы действительно владеете.`,
              `You get questions from every level${scaleLabel ? ` (${scaleLabel})` : ""}. Your level is the highest one you actually master.`
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
