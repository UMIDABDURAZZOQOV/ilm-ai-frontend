"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCw, Check, Repeat, Trophy } from "lucide-react";
import { VOCAB_BY_ID } from "@/lib/vocab";
import { getUnmasteredIds, setStatus, shuffle } from "@/lib/vocabProgress";

const SET_SIZE = 10;

export default function FlashcardsPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setIds(shuffle(getUnmasteredIds()).slice(0, SET_SIZE));
  }, []);

  const word = useMemo(() => (ids[index] ? VOCAB_BY_ID[ids[index]] : null), [ids, index]);

  function next(status: "mastered" | "learning" | null) {
    if (word && status) {
      setStatus(word.id, status);
      if (status === "mastered") setMastered((m) => m + 1);
    }
    setFlipped(false);
    if (index + 1 >= ids.length) setDone(true);
    else setIndex((i) => i + 1);
  }

  function restart() {
    setIds(shuffle(getUnmasteredIds()).slice(0, SET_SIZE));
    setIndex(0);
    setFlipped(false);
    setMastered(0);
    setDone(false);
  }

  if (ids.length === 0) {
    return <div className="py-24 text-center text-slate-500">Loading cards…</div>;
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto py-10 text-center space-y-6">
        <div className="h-20 w-20 mx-auto rounded-full bg-amber-400/15 flex items-center justify-center">
          <Trophy className="h-10 w-10 text-amber-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Set complete!</h2>
          <p className="text-slate-500 mt-1">
            You marked <span className="font-bold text-emerald-500">{mastered}</span> of {ids.length} words as mastered.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={restart} className="flex items-center gap-2 px-5 py-3 bg-[#0d3b4f] text-white rounded-xl font-bold hover:opacity-90 transition-all">
            <Repeat className="h-4 w-4" /> Practice again
          </button>
          <Link href="/sat/vocab" className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:border-[#0d3b4f] dark:hover:border-amber-400 transition-all">
            Done
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center gap-4">
        <Link href="/sat/vocab" className="p-2 -ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-[#0d3b4f] dark:bg-amber-400 rounded-full transition-all" style={{ width: `${(index / ids.length) * 100}%` }} />
          </div>
        </div>
        <span className="text-sm font-bold tabular-nums text-slate-400">
          {index + 1}/{ids.length}
        </span>
      </div>

      <p className="text-center text-sm text-slate-400">
        <span className="font-bold text-emerald-500">{mastered}</span> mastered this set
      </p>

      {/* Card */}
      <div className="[perspective:1200px]">
        <AnimatePresence mode="wait">
          <motion.button
            key={word?.id}
            onClick={() => setFlipped((f) => !f)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full min-h-[22rem] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-left p-7 flex flex-col"
          >
            {!flipped ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <p className="text-3xl sm:text-4xl font-black">{word?.word}</p>
                <p className="mt-3 text-xs text-slate-400">Tap to flip</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center space-y-4 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Definition</p>
                  <p className="text-base text-slate-800 dark:text-slate-100">{word?.definition}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Example</p>
                  <p className="italic text-slate-600 dark:text-slate-300">{word?.example}</p>
                </div>
                {word?.wordParts && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Word parts</p>
                    <p className="text-slate-600 dark:text-slate-300">{word.wordParts}</p>
                  </div>
                )}
              </div>
            )}
          </motion.button>
        </AnimatePresence>
      </div>

      {/* Actions */}
      {!flipped ? (
        <div className="flex gap-3">
          <button onClick={() => next(null)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 hover:border-slate-400 transition-all">
            Skip
          </button>
          <button onClick={() => setFlipped(true)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0d3b4f] text-white rounded-xl font-bold hover:opacity-90 transition-all">
            <RotateCw className="h-4 w-4" /> Flip
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => next("learning")} className="flex-1 flex items-center justify-center gap-2 py-3 border border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 rounded-xl font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all">
            <Repeat className="h-4 w-4" /> Still learning
          </button>
          <button onClick={() => next("mastered")} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all">
            <Check className="h-4 w-4" /> Got it
          </button>
        </div>
      )}
    </div>
  );
}
