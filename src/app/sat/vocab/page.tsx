"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Layers,
  Shuffle,
  GraduationCap,
  Search,
  ChevronRight,
  X,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { VOCAB, type VocabDifficulty, type VocabWord } from "@/lib/vocab";
import { getProgressMap, getStats, type VocabStatus, type VocabStats } from "@/lib/vocabProgress";

const MODES = [
  {
    href: "/sat/vocab/learn",
    title: "Learn Mode",
    desc: "Work through 10 questions with words you haven't mastered yet.",
    icon: GraduationCap,
    accent: "from-sky-500 to-blue-600",
  },
  {
    href: "/sat/vocab/match",
    title: "Match",
    desc: "Race the clock to match each word with its definition.",
    icon: Shuffle,
    accent: "from-violet-500 to-fuchsia-600",
  },
  {
    href: "/sat/vocab/flashcards",
    title: "Flashcards",
    desc: "Flip cards to learn definitions, examples, and word roots.",
    icon: Layers,
    accent: "from-amber-500 to-orange-600",
  },
];

const DIFFS: VocabDifficulty[] = ["Easy", "Medium", "Hard"];

const STATUS_RING: Record<VocabStatus, string> = {
  mastered: "border-emerald-400 dark:border-emerald-500/70",
  learning: "border-amber-400 dark:border-amber-500/70",
  new: "border-slate-200 dark:border-slate-700",
};

export default function VocabPage() {
  const [tab, setTab] = useState<"explore" | "library">("explore");
  const [stats, setStats] = useState<VocabStats | null>(null);
  const [progress, setProgress] = useState<Record<string, VocabStatus>>({});
  const [query, setQuery] = useState("");
  const [diff, setDiff] = useState<VocabDifficulty | "All">("All");
  const [selected, setSelected] = useState<VocabWord | null>(null);

  useEffect(() => {
    setStats(getStats());
    setProgress(getProgressMap());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VOCAB.filter((w) => {
      if (diff !== "All" && w.difficulty !== diff) return false;
      if (q && !w.word.toLowerCase().includes(q) && !w.definition.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, diff]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Layers className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> Vocabulary Practice
        </h1>
        <p className="text-slate-500 mt-1">Master the high-frequency SAT words — flashcards, matching, and quizzes.</p>
      </div>

      {/* Tabs */}
      <div className="flex w-full sm:w-auto sm:inline-flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1.5 gap-1">
        {(["explore", "library"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
              tab === t
                ? "bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {t === "explore" ? <Sparkles className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
            {t}
          </button>
        ))}
      </div>

      {tab === "explore" ? (
        <div className="space-y-5">
          {/* Progress summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Mastered", value: stats?.mastered ?? 0, color: "text-emerald-500" },
              { label: "Learning", value: stats?.learning ?? 0, color: "text-amber-500" },
              { label: "Words", value: stats?.total ?? VOCAB.length, color: "text-slate-900 dark:text-white" },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
                <p className={`text-3xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Mode cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            {MODES.map((m, i) => (
              <motion.div
                key={m.href}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={m.href}
                  className="group h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <div className={`h-20 bg-gradient-to-br ${m.accent} flex items-center justify-center`}>
                    <m.icon className="h-9 w-9 text-white/90 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg">{m.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 flex-1">{m.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#0d3b4f] dark:text-amber-400">
                      Start <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search words…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-[#0d3b4f] dark:focus:border-amber-400"
              />
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 gap-1">
              {(["All", ...DIFFS] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDiff(d)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    diff === d
                      ? "bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Word grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((w) => {
              const status = progress[w.id] ?? "new";
              return (
                <button
                  key={w.id}
                  onClick={() => setSelected(w)}
                  className={`aspect-[4/3] rounded-2xl border-2 bg-white dark:bg-slate-900 flex items-center justify-center text-center p-3 font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg ${STATUS_RING[status]}`}
                >
                  {w.word}
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 py-10">No words match your search.</p>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-emerald-400" /> Mastered</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-amber-400" /> Learning</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-slate-300 dark:border-slate-600" /> New</span>
          </div>
        </div>
      )}

      {/* Word detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelected(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-2xl font-black">{selected.word}</h3>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{selected.difficulty}</span>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Definition</p>
                <p className="text-slate-700 dark:text-slate-200">{selected.definition}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Example</p>
                <p className="italic text-slate-600 dark:text-slate-300">{selected.example}</p>
              </div>
              {selected.wordParts && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Word parts</p>
                  <p className="text-slate-600 dark:text-slate-300">{selected.wordParts}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
