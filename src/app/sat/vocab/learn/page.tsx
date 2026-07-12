"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X, Trophy, Repeat } from "lucide-react";
import { VOCAB, VOCAB_BY_ID, type VocabWord } from "@/lib/vocab";
import { getUnmasteredIds, setStatus, shuffle } from "@/lib/vocabProgress";

const SET_SIZE = 10;

interface Question {
  word: VocabWord;
  options: string[]; // definitions
  correct: number;
}

function buildQuestions(): Question[] {
  const ids = shuffle(getUnmasteredIds()).slice(0, SET_SIZE);
  return ids.map((id) => {
    const word = VOCAB_BY_ID[id];
    const distractors = shuffle(VOCAB.filter((w) => w.id !== id))
      .slice(0, 3)
      .map((w) => w.definition);
    const options = shuffle([word.definition, ...distractors]);
    return { word, options, correct: options.indexOf(word.definition) };
  });
}

export default function LearnPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setQuestions(buildQuestions());
  }, []);

  const q = questions[index];

  function pick(i: number) {
    if (picked !== null || !q) return;
    setPicked(i);
    const right = i === q.correct;
    if (right) setScore((s) => s + 1);
    setStatus(q.word.id, right ? "mastered" : "learning");
  }

  function next() {
    setPicked(null);
    if (index + 1 >= questions.length) setDone(true);
    else setIndex((i) => i + 1);
  }

  function restart() {
    setQuestions(buildQuestions());
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  if (questions.length === 0) {
    return <div className="py-24 text-center text-slate-500">Loading questions…</div>;
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-md mx-auto py-10 text-center space-y-6">
        <div className="h-20 w-20 mx-auto rounded-full bg-amber-400/15 flex items-center justify-center">
          <Trophy className="h-10 w-10 text-amber-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black">You scored {score}/{questions.length}</h2>
          <p className="text-slate-500 mt-1">{pct}% correct — keep the streak going.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={restart} className="flex items-center gap-2 px-5 py-3 bg-[#0d3b4f] text-white rounded-xl font-bold hover:opacity-90 transition-all">
            <Repeat className="h-4 w-4" /> New set
          </button>
          <Link href="/sat/vocab" className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:border-[#0d3b4f] dark:hover:border-amber-400 transition-all">
            Done
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center gap-4">
        <Link href="/sat/vocab" className="p-2 -ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-[#0d3b4f] dark:bg-amber-400 rounded-full transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
          </div>
        </div>
        <span className="text-sm font-bold tabular-nums text-slate-400">{index + 1}/{questions.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q?.word.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-5"
        >
          <div className="text-center py-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">What does this word mean?</p>
            <p className="text-4xl font-black">{q?.word.word}</p>
          </div>

          <div className="space-y-3">
            {q?.options.map((opt, i) => {
              const isCorrect = i === q.correct;
              const isPicked = i === picked;
              let cls = "border-slate-200 dark:border-slate-700 hover:border-[#0d3b4f] dark:hover:border-amber-400";
              if (picked !== null) {
                if (isCorrect) cls = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
                else if (isPicked) cls = "border-red-400 bg-red-50 dark:bg-red-900/20";
                else cls = "border-slate-200 dark:border-slate-800 opacity-60";
              }
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  disabled={picked !== null}
                  className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border-2 text-sm transition-all ${cls}`}
                >
                  <span className="mt-0.5 shrink-0">
                    {picked !== null && isCorrect ? (
                      <Check className="h-5 w-5 text-emerald-500" />
                    ) : picked !== null && isPicked ? (
                      <X className="h-5 w-5 text-red-500" />
                    ) : (
                      <span className="inline-block h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                    )}
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">{opt}</span>
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <button
              onClick={next}
              className="w-full py-3.5 bg-[#0d3b4f] text-white rounded-xl font-bold hover:opacity-90 transition-all"
            >
              {index + 1 >= questions.length ? "See results" : "Next"}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
