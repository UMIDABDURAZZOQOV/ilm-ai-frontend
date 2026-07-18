"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, GraduationCap, TrendingUp, Clock, Award, X, Check } from "lucide-react";
import {
  getMockOverview,
  startMockExam,
  completeMockExam,
  type SkillSubject,
  type MockOverview,
  type MockStartResponse,
  type MockResult,
} from "@/lib/skillTreeApi";
import AiTutor from "./AiTutor";
import Confetti from "./Confetti";

function subjName(lang: string, s: SkillSubject) {
  return lang === "ru" ? s.name_ru : lang === "en" ? s.name_en : s.name_uz;
}

const GRADE_COLOR: Record<string, string> = {
  "A+": "#58CC02",
  A: "#58CC02",
  "B+": "#1CB0F6",
  B: "#1CB0F6",
  "C+": "#FFC800",
  C: "#FF9600",
  Sertifikatsiz: "#FF4B4B",
};

function gradeColor(grade: string | null | undefined) {
  return (grade && GRADE_COLOR[grade]) || "#94a3b8";
}

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

type Phase = "overview" | "running" | "result";

export default function MockExam({
  lang,
  userId,
  subject,
  onBack,
}: {
  lang: string;
  userId: number;
  subject: SkillSubject;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("overview");
  const [overview, setOverview] = useState<MockOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<MockStartResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [idx, setIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<MockResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const loadOverview = useCallback(() => {
    setLoading(true);
    getMockOverview(userId, subject.slug)
      .then(setOverview)
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, [userId, subject.slug]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const submit = useCallback(async () => {
    if (!exam || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const payload = exam.questions.map((q) => ({ question_id: q.id, user_answer: answers[q.id] ?? null }));
      const r = await completeMockExam(userId, exam.exam_id, payload);
      setResult(r);
      setPhase("result");
    } catch {
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [exam, answers, userId]);

  // Countdown timer during the exam; auto-submit at zero.
  useEffect(() => {
    if (phase !== "running") return;
    if (secondsLeft <= 0) {
      submit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft, submit]);

  async function begin() {
    setLoading(true);
    try {
      const e = await startMockExam(userId, subject.slug);
      setExam(e);
      setAnswers({});
      setIdx(0);
      setSecondsLeft(e.duration_seconds);
      submittedRef.current = false;
      setPhase("running");
    } catch {
      /* stay on overview */
    } finally {
      setLoading(false);
    }
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  // ── Result ──────────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    return (
      <div>
        <Confetti active={result.certificate} count={result.grade === "A+" || result.grade === "A" ? 60 : 44} />
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> {tr(lang, "Orqaga", "Назад", "Back")}
        </button>
        <div className="max-w-lg space-y-5">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-3xl p-6 text-center text-white"
            style={{ background: `linear-gradient(135deg, ${gradeColor(result.grade)}, ${gradeColor(result.grade)}cc)` }}
          >
            <p className="text-sm opacity-90 mb-1">{subjName(lang, subject)} · {tr(lang, "Sinov imtihoni", "Пробный экзамен", "Mock exam")}</p>
            <div className="text-6xl font-black leading-none my-2">{result.grade}</div>
            <p className="text-lg font-bold">{result.percentage}% · {result.score}/{result.total}</p>
            <p className="text-xs opacity-90 mt-2">
              {result.certificate
                ? tr(lang, "🎓 Sertifikat darajasida!", "🎓 Уровень сертификата!", "🎓 Certificate level!")
                : tr(lang, "Sertifikat uchun kamida 60% kerak", "Для сертификата нужно минимум 60%", "You need at least 60% for a certificate")}
            </p>
          </motion.div>

          {result.prediction && (
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <p className="text-sm font-bold">{tr(lang, "Haqiqiy imtihon bashorati", "Прогноз реального экзамена", "Real exam prediction")}</p>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black" style={{ color: gradeColor(result.prediction.predicted_grade) }}>
                  {result.prediction.predicted_grade}
                </span>
                <span className="text-lg font-bold text-neutral-500 mb-0.5">~{result.prediction.predicted_pct}%</span>
                <span className="ml-auto text-[11px] px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-500">
                  {tr(lang, "Ishonch", "Уверенность", "Confidence")}:{" "}
                  {tr(
                    lang,
                    result.prediction.confidence === "high" ? "yuqori" : result.prediction.confidence === "medium" ? "o'rta" : "past",
                    result.prediction.confidence === "high" ? "высокая" : result.prediction.confidence === "medium" ? "средняя" : "низкая",
                    result.prediction.confidence
                  )}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-2">
                {tr(
                  lang,
                  "Bashorat sinov natijalari va darslardagi o'zlashtirishingizga asoslangan.",
                  "Прогноз основан на результатах пробных экзаменов и вашем прогрессе в уроках.",
                  "Prediction is based on your mock results and lesson mastery."
                )}
              </p>
            </div>
          )}

          {result.xp_awarded > 0 && (
            <p className="text-center text-sm font-bold text-amber-500">+{result.xp_awarded} XP</p>
          )}

          {/* Review */}
          <div>
            <p className="text-sm font-bold mb-2">{tr(lang, "Javoblarni ko'rib chiqish", "Разбор ответов", "Review answers")}</p>
            <div className="space-y-3">
              {result.review.map((r, i) => (
                <div key={i} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3">
                  <div className="flex items-start gap-2">
                    {r.is_correct ? (
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <p className="text-sm font-semibold">{i + 1}. {r.question_text}</p>
                  </div>
                  {!r.is_correct && (
                    <div className="mt-2 pl-6 text-xs space-y-1">
                      {r.user_answer && (
                        <p className="text-red-500">
                          {tr(lang, "Siz:", "Вы:", "You:")} <span className="line-through">{r.user_answer}</span>
                        </p>
                      )}
                      <p className="text-emerald-600">{tr(lang, "To'g'ri:", "Верно:", "Correct:")} {r.correct_answer}</p>
                      {r.explanation && <p className="text-neutral-500">{r.explanation}</p>}
                      <AiTutor
                        lang={lang}
                        questionText={r.question_text}
                        options={r.options}
                        correctAnswer={r.correct_answer}
                        userAnswer={r.user_answer}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setResult(null);
              setExam(null);
              setPhase("overview");
              loadOverview();
            }}
            className="w-full px-5 py-3.5 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600"
          >
            {tr(lang, "Yakunlash", "Завершить", "Done")}
          </button>
        </div>
      </div>
    );
  }

  // ── Running the exam ──────────────────────────────────────────────────────────
  if (phase === "running" && exam) {
    const q = exam.questions[idx];
    const total = exam.questions.length;
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => {
              if (confirm(tr(lang, "Imtihonni tark etasizmi? Javoblaringiz baholanadi.", "Выйти из экзамена? Ваши ответы будут оценены.", "Leave the exam? Your answers will be graded."))) submit();
            }}
            className="text-sm font-semibold text-neutral-400 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 font-bold text-sm" style={{ color: secondsLeft < 60 ? "#FF4B4B" : undefined }}>
            <Clock className="w-4 h-4" /> {mm}:{ss}
          </div>
          <span className="text-sm font-bold text-neutral-500">{idx + 1}/{total}</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden mb-5">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>

        <p className="text-base font-bold mb-4 min-h-[3rem]">{q.question_text}</p>
        <div className="space-y-2.5">
          {q.options.map((opt) => {
            const chosen = answers[q.id] === opt;
            return (
              <button
                key={opt}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                className={`w-full text-left px-4 py-3 rounded-2xl border-2 font-semibold text-sm transition-colors ${
                  chosen
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="px-4 py-3 rounded-2xl font-bold text-sm border-2 border-neutral-200 dark:border-neutral-800 disabled:opacity-40"
          >
            {tr(lang, "Oldingi", "Назад", "Prev")}
          </button>
          {idx < total - 1 ? (
            <button
              onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
              className="flex-1 px-4 py-3 rounded-2xl font-bold text-sm text-white bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-900"
            >
              {tr(lang, "Keyingi", "Далее", "Next")}
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-2xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60"
            >
              {submitting ? "..." : tr(lang, `Yakunlash (${answeredCount}/${total})`, `Завершить (${answeredCount}/${total})`, `Finish (${answeredCount}/${total})`)}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Overview ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" /> {tr(lang, "Orqaga", "Назад", "Back")}
      </button>
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-6 h-6" style={{ color: subject.color || "#58CC02" }} />
        <h2 className="text-lg font-extrabold">{subjName(lang, subject)} · {tr(lang, "Sinov imtihoni", "Пробный экзамен", "Mock exam")}</h2>
      </div>

      {loading || !overview ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-neutral-400" /></div>
      ) : (
        <div className="max-w-lg space-y-5">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black">{overview.size}</div>
              <div className="text-[10px] text-neutral-500">{tr(lang, "savol", "вопросов", "questions")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">{Math.round(overview.duration_seconds / 60)}</div>
              <div className="text-[10px] text-neutral-500">{tr(lang, "daqiqa", "минут", "minutes")}</div>
            </div>
            {overview.best && (
              <div className="ml-auto text-center">
                <div className="text-2xl font-black" style={{ color: gradeColor(overview.best.grade) }}>{overview.best.grade}</div>
                <div className="text-[10px] text-neutral-500">{tr(lang, "eng yaxshi", "лучший", "best")} · {overview.best.percentage}%</div>
              </div>
            )}
          </div>

          {overview.prediction && (
            <div className="rounded-2xl border-2 p-4" style={{ borderColor: `${gradeColor(overview.prediction.predicted_grade)}55` }}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <p className="text-sm font-bold">{tr(lang, "Bashorat qilingan daraja", "Прогнозируемая оценка", "Predicted grade")}</p>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black" style={{ color: gradeColor(overview.prediction.predicted_grade) }}>
                  {overview.prediction.predicted_grade}
                </span>
                <span className="text-base font-bold text-neutral-500 mb-1">~{overview.prediction.predicted_pct}%</span>
              </div>
            </div>
          )}

          <button
            onClick={begin}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-extrabold text-white bg-emerald-500 hover:bg-emerald-600"
          >
            <Award className="w-5 h-5" />
            {tr(lang, "Imtihonni boshlash", "Начать экзамен", "Start exam")}
          </button>

          {overview.attempts.length > 0 && (
            <div>
              <p className="text-sm font-bold mb-2">{tr(lang, "Oldingi urinishlar", "Прошлые попытки", "Past attempts")}</p>
              <div className="space-y-2">
                {overview.attempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 px-3 py-2">
                    <span className="text-xs text-neutral-500">{a.completed_at ? a.completed_at.slice(0, 10) : ""}</span>
                    <span className="text-sm font-bold">{a.score}/{a.total} · {a.percentage}%</span>
                    <span className="text-sm font-black" style={{ color: gradeColor(a.grade) }}>{a.grade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
