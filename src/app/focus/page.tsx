"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Play, Pause, RotateCcw, Coffee, Brain, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import PracticeSession from "@/components/skills/PracticeSession";
import { mockFromMaterials } from "@/lib/studioApi";
import type { PracticeQuestion, PracticeResultItem } from "@/lib/skillTreeApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function FocusPage() {
  const { user, isLoading } = useAuth();
  const { lang } = useI18n();
  const router = useRouter();

  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [left, setLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [quiz, setQuiz] = useState<PracticeQuestion[] | null>(null);
  const [quizBusy, setQuizBusy] = useState(false);
  const [quizErr, setQuizErr] = useState("");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          // Phase finished.
          if (phase === "focus") {
            setRounds((r) => r + 1);
            setPhase("break");
            setRunning(false);
            try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=").play().catch(() => {}); } catch {}
            return BREAK_SECONDS;
          }
          setPhase("focus");
          setRunning(false);
          return FOCUS_SECONDS;
        }
        return l - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [running, phase]);

  function reset() {
    setRunning(false);
    setPhase("focus");
    setLeft(FOCUS_SECONDS);
  }

  async function startBreakQuiz() {
    if (!user) return;
    setQuizBusy(true);
    setQuizErr("");
    try {
      const r = await mockFromMaterials(user.id, lang, 5);
      setQuiz(r.questions);
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      setQuizErr(err?.detail === "no_materials" || err?.status === 400 ? "no_materials" : "failed");
    } finally {
      setQuizBusy(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="sat-scope min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (quiz) {
    return (
      <div className="sat-scope min-h-screen bg-white dark:bg-neutral-950">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <PracticeSession
            lang={lang}
            title={tr(lang, "Tanaffus viktorinasi", "Тест на перерыве", "Break quiz")}
            accent="#F59E0B"
            questions={quiz}
            onFinish={async (results: PracticeResultItem[]) => {
              const correct = results.filter((r) => r.is_correct).length;
              return { xp_awarded: correct * 5 };
            }}
            onExit={() => setQuiz(null)}
          />
        </div>
      </div>
    );
  }

  const total = phase === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;
  const pct = ((total - left) / total) * 100;
  const isFocus = phase === "focus";

  return (
    <div className="sat-scope min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        <div className="text-center">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-6 ${isFocus ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300" : "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300"}`}>
            {isFocus ? <Brain className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
            {isFocus ? tr(lang, "Fokus", "Фокус", "Focus") : tr(lang, "Tanaffus", "Перерыв", "Break")}
          </div>

          {/* Radial timer */}
          <div className="relative w-64 h-64 mx-auto mb-8">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-neutral-100 dark:text-neutral-800" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke={isFocus ? "#6366F1" : "#F59E0B"}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={(2 * Math.PI * 45) * (1 - pct / 100)}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                className="text-5xl font-black tabular-nums"
                animate={running ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={running ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
              >
                {fmt(left)}
              </motion.div>
              {rounds > 0 && <div className="text-xs text-neutral-400 mt-1">🍅 {rounds}</div>}
            </div>
            {/* Soft glow pulse while the timer runs. */}
            {running && (
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none -z-10"
                style={{ boxShadow: `0 0 60px 0 ${isFocus ? "#6366F1" : "#F59E0B"}` }}
                animate={{ opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={() => setRunning((r) => !r)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              {running ? tr(lang, "Pauza", "Пауза", "Pause") : tr(lang, "Boshlash", "Старт", "Start")}
            </button>
            <button onClick={reset} className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-white">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* During a break, a quick check from your materials. */}
          {!isFocus && (
            <div>
              <button
                onClick={startBreakQuiz}
                disabled={quizBusy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50"
              >
                {quizBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
                {tr(lang, "Materialdan tez viktorina", "Быстрый тест по материалу", "Quick quiz from materials")}
              </button>
              {quizErr === "no_materials" && <p className="text-xs text-amber-600 mt-2">{tr(lang, "Avval material yuklang.", "Сначала загрузите материал.", "Upload material first.")}</p>}
              {quizErr === "failed" && <p className="text-xs text-red-500 mt-2">{tr(lang, "Bo'lmadi — qayta urinib ko'ring.", "Не удалось — попробуйте снова.", "Couldn't build it — try again.")}</p>}
            </div>
          )}

          <p className="text-xs text-neutral-400 mt-8">
            {tr(lang, "25 daqiqa fokus, 5 daqiqa tanaffus. Telefonni chetga qo'ying va shu davrni faqat o'qishga bag'ishlang.", "25 минут фокуса, 5 минут перерыва.", "25 minutes focus, 5 minutes break. Put your phone away and study.")}
          </p>
        </div>
      </div>
    </div>
  );
}
