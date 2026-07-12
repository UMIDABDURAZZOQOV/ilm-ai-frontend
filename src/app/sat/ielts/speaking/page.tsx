"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, ArrowLeft, Clock, Play, Square, ChevronRight } from "lucide-react";
import { IELTS_SPEAKING, type IeltsSpeakingSet } from "@/lib/ielts";

export default function IeltsSpeakingPage() {
  const [set, setSet] = useState<IeltsSpeakingSet | null>(null);
  const [filter, setFilter] = useState<"All" | "Part 1" | "Part 2" | "Part 3">("All");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const list = IELTS_SPEAKING.filter((s) => filter === "All" || s.part === filter);

  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  function open(s: IeltsSpeakingSet) {
    setSet(s);
    setSeconds(0);
    setRunning(false);
  }

  const mmss = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  if (!set) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Mic className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> IELTS Speaking
          </h1>
          <p className="text-slate-500 mt-1">Original Part 1, Part 2, and Part 3 questions — practice aloud with a timer.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 gap-1 w-full sm:w-auto sm:inline-flex">
          {(["All", "Part 1", "Part 2", "Part 3"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                filter === f ? "bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => open(s)}
              className="group text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex rounded-full bg-[#0d3b4f]/10 dark:bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#0d3b4f] dark:text-amber-400">
                  {s.part}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{s.questions.length === 1 ? "cue card" : `${s.questions.length} questions`}</span>
              </div>
              <h3 className="font-bold text-lg mt-3">{s.topic}</h3>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#0d3b4f] dark:text-amber-400">
                Practice <ChevronRight className="h-4 w-4" />
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  const isCueCard = set.part === "Part 2";
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => setSet(null)} className="p-2 -ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-black flex-1">{set.part} · {set.topic}</h1>
      </div>

      {isCueCard ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Cue card</p>
          <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">{set.questions[0]}</p>
          <p className="text-xs text-slate-400 mt-4">You have 1 minute to prepare, then speak for 1–2 minutes.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {set.questions.map((q, i) => (
            <div key={i} className="p-4 flex items-start gap-3">
              <span className="shrink-0 h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">{i + 1}</span>
              <p className="text-sm text-slate-700 dark:text-slate-200">{q}</p>
            </div>
          ))}
        </div>
      )}

      {/* Timer */}
      <div className="flex items-center justify-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5">
        <span className="flex items-center gap-2 text-2xl font-black tabular-nums">
          <Clock className="h-5 w-5 text-slate-400" /> {mmss}
        </span>
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0d3b4f] text-white rounded-xl font-bold hover:opacity-90 transition-all"
        >
          {running ? <><Square className="h-4 w-4" /> Stop</> : <><Play className="h-4 w-4" /> Start</>}
        </button>
        <button
          onClick={() => { setSeconds(0); setRunning(false); }}
          className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 hover:border-slate-400 transition-all"
        >
          Reset
        </button>
      </div>
      <p className="text-center text-xs text-slate-400">Tip: record yourself on your phone and compare against the band descriptors.</p>
    </div>
  );
}
