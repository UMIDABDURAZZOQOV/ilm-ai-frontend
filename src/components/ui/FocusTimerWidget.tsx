"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Play, Pause, RotateCcw, ChevronDown } from "lucide-react";

/**
 * A compact, draggable-free floating focus timer that can be dropped onto any page
 * (e.g. inside the SAT exam) so learners can time a focused study/exam block without
 * leaving the screen. Collapses to a small pill; a full Pomodoro cycle lives on the
 * dedicated /focus page — this is the lightweight in-context version.
 */
const OPTIONS = [25, 50]; // minutes

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function FocusTimerWidget({ lang = "uz" }: { lang?: string }) {
  const [open, setOpen] = useState(false);
  const [mins, setMins] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  useEffect(() => {
    if (running && left === 0) {
      setRunning(false);
      setDone(true);
      try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=").play().catch(() => {}); } catch {}
    }
  }, [left, running]);

  useEffect(() => {
    if (!running) { setLeft(mins * 60); setDone(false); }
  }, [mins]); // eslint-disable-line react-hooks/exhaustive-deps

  function reset() { setRunning(false); setLeft(mins * 60); setDone(false); }
  const tr = (uz: string, ru: string, en: string) => (lang === "ru" ? ru : lang === "en" ? en : uz);
  const total = mins * 60;
  const pct = ((total - left) / total) * 100;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 text-white shadow-lg px-3.5 py-2.5 text-sm font-bold hover:bg-indigo-700"
      >
        <Timer className="h-4 w-4" />
        {running ? fmt(left) : tr("Fokus", "Фокус", "Focus")}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-4 right-4 z-40 w-56 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300">
          <Timer className="h-3.5 w-3.5" /> {tr("Fokus taymer", "Фокус-таймер", "Focus timer")}
        </span>
        <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="text-center py-1">
        <AnimatePresence mode="wait">
          <motion.div key={done ? "done" : "time"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-black tabular-nums">
            {done ? "🎉" : fmt(left)}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden my-2">
        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {!running && (
        <div className="flex items-center justify-center gap-1.5 mb-2">
          {OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setMins(m)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${mins === m ? "border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-950" : "border-neutral-200 dark:border-neutral-800 text-neutral-500"}`}
            >
              {m}m
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => { if (done) reset(); else setRunning((r) => !r); }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white py-2 text-sm font-bold hover:bg-indigo-700"
        >
          {done ? <RotateCcw className="h-4 w-4" /> : running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          {done ? tr("Qayta", "Заново", "Again") : running ? tr("Pauza", "Пауза", "Pause") : tr("Boshlash", "Старт", "Start")}
        </button>
        <button onClick={reset} className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-white">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
