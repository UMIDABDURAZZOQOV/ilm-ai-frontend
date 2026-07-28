"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Play, Pause, RotateCcw, ChevronDown } from "lucide-react";

/**
 * A compact floating focus timer that can be dropped onto any page (SAT/IELTS
 * exam, Fanlar lesson, ...). Its state lives in localStorage keyed by a wall-clock
 * end time, so it keeps running across page navigations and survives a refresh —
 * every mount just reads the shared state. A full Pomodoro cycle lives on /focus.
 */
const OPTIONS = [25, 50]; // minutes
const KEY = "ilm_focus_timer_v1";

type Persisted = {
  mins: number;
  running: boolean;
  endsAt: number | null; // ms epoch when it will hit zero (while running)
  pausedLeft: number;    // seconds left while paused
  open: boolean;
};

function load(): Persisted {
  if (typeof window === "undefined") return { mins: 25, running: false, endsAt: null, pausedLeft: 25 * 60, open: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { open: false, ...(JSON.parse(raw) as Persisted) };
  } catch { /* ignore */ }
  return { mins: 25, running: false, endsAt: null, pausedLeft: 25 * 60, open: false };
}

function save(p: Persisted) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function remaining(p: Persisted): number {
  if (p.running && p.endsAt) return Math.max(0, Math.round((p.endsAt - Date.now()) / 1000));
  return p.pausedLeft;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function FocusTimerWidget({ lang = "uz" }: { lang?: string }) {
  const [state, setState] = useState<Persisted>(() => (typeof window === "undefined" ? load() : load()));
  const [left, setLeft] = useState(() => remaining(state));
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate from storage on mount (so a running timer resumes seamlessly).
  useEffect(() => {
    const p = load();
    setState(p);
    setLeft(remaining(p));
  }, []);

  // Tick from the wall-clock end time, so it stays accurate across pages/tabs.
  useEffect(() => {
    if (!state.running) return;
    ref.current = setInterval(() => {
      const r = remaining(state);
      setLeft(r);
      if (r <= 0) {
        setDone(true);
        const np = { ...state, running: false, endsAt: null, pausedLeft: 0 };
        setState(np); save(np);
        try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=").play().catch(() => {}); } catch {}
      }
    }, 500);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [state]);

  function update(p: Persisted) { setState(p); save(p); setLeft(remaining(p)); }

  function start() {
    setDone(false);
    update({ ...state, running: true, endsAt: Date.now() + left * 1000, pausedLeft: left });
  }
  function pause() { update({ ...state, running: false, endsAt: null, pausedLeft: left }); }
  function reset() { setDone(false); update({ ...state, running: false, endsAt: null, pausedLeft: state.mins * 60 }); }
  function setMins(m: number) { setDone(false); update({ ...state, mins: m, running: false, endsAt: null, pausedLeft: m * 60 }); }

  const tr = (uz: string, ru: string, en: string) => (lang === "ru" ? ru : lang === "en" ? en : uz);
  const total = state.mins * 60;
  const pct = total ? ((total - left) / total) * 100 : 0;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 text-white shadow-lg px-3.5 py-2.5 text-sm font-bold hover:bg-indigo-700"
      >
        <Timer className="h-4 w-4" />
        {state.running ? fmt(left) : tr("Fokus", "Фокус", "Focus")}
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

      {!state.running && (
        <div className="flex items-center justify-center gap-1.5 mb-2">
          {OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setMins(m)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${state.mins === m ? "border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-950" : "border-neutral-200 dark:border-neutral-800 text-neutral-500"}`}
            >
              {m}m
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => { if (done) reset(); else state.running ? pause() : start(); }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white py-2 text-sm font-bold hover:bg-indigo-700"
        >
          {done ? <RotateCcw className="h-4 w-4" /> : state.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          {done ? tr("Qayta", "Заново", "Again") : state.running ? tr("Pauza", "Пауза", "Pause") : tr("Boshlash", "Старт", "Start")}
        </button>
        <button onClick={reset} className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-white">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
