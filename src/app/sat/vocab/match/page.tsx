"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Trophy, Repeat } from "lucide-react";
import { VOCAB_BY_ID } from "@/lib/vocab";
import { getUnmasteredIds, setStatus, shuffle } from "@/lib/vocabProgress";

const PAIRS = 6;

interface Tile {
  key: string;
  wordId: string;
  kind: "word" | "def";
  text: string;
}

function buildTiles(): Tile[] {
  const ids = shuffle(getUnmasteredIds()).slice(0, PAIRS);
  const tiles: Tile[] = [];
  for (const id of ids) {
    const w = VOCAB_BY_ID[id];
    tiles.push({ key: `${id}-w`, wordId: id, kind: "word", text: w.word });
    tiles.push({ key: `${id}-d`, wordId: id, kind: "def", text: w.definition });
  }
  return shuffle(tiles);
}

export default function MatchPage() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    setTiles(buildTiles());
    setSelected(null);
    setMatched(new Set());
    setWrong(null);
    setSeconds(0);
    setDone(false);
  }

  useEffect(() => {
    start();
  }, []);

  // Timer runs until the board is cleared.
  useEffect(() => {
    if (done || tiles.length === 0) return;
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [done, tiles.length]);

  useEffect(() => {
    if (tiles.length > 0 && matched.size === tiles.length) {
      setDone(true);
      if (timer.current) clearInterval(timer.current);
    }
  }, [matched, tiles.length]);

  function tap(tile: Tile) {
    if (matched.has(tile.key) || wrong) return;
    if (selected === null) {
      setSelected(tile.key);
      return;
    }
    if (selected === tile.key) {
      setSelected(null);
      return;
    }
    const first = tiles.find((t) => t.key === selected)!;
    if (first.wordId === tile.wordId && first.kind !== tile.kind) {
      // correct pair
      const nextMatched = new Set(matched);
      nextMatched.add(first.key);
      nextMatched.add(tile.key);
      setMatched(nextMatched);
      setStatus(tile.wordId, "learning");
      setSelected(null);
    } else {
      // wrong — flash briefly
      setWrong(tile.key);
      setTimeout(() => {
        setWrong(null);
        setSelected(null);
      }, 650);
    }
  }

  const mmss = useMemo(() => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [seconds]);

  if (tiles.length === 0) {
    return <div className="py-24 text-center text-slate-500">Loading…</div>;
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto py-10 text-center space-y-6">
        <div className="h-20 w-20 mx-auto rounded-full bg-amber-400/15 flex items-center justify-center">
          <Trophy className="h-10 w-10 text-amber-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Board cleared!</h2>
          <p className="text-slate-500 mt-1">You matched all {PAIRS} pairs in <span className="font-bold text-[#0d3b4f] dark:text-amber-400">{mmss}</span>.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={start} className="flex items-center gap-2 px-5 py-3 bg-[#0d3b4f] text-white rounded-xl font-bold hover:opacity-90 transition-all">
            <Repeat className="h-4 w-4" /> Play again
          </button>
          <Link href="/sat/vocab" className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:border-[#0d3b4f] dark:hover:border-amber-400 transition-all">
            Done
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/sat/vocab" className="p-2 -ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black flex-1">Match</h1>
        <span className="flex items-center gap-1.5 text-sm font-bold tabular-nums text-slate-500">
          <Clock className="h-4 w-4" /> {mmss}
        </span>
      </div>
      <p className="text-sm text-slate-400 text-center">Tap a word, then its matching definition.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tiles.map((tile) => {
          const isMatched = matched.has(tile.key);
          const isSelected = selected === tile.key;
          const isWrong = wrong === tile.key || (wrong && isSelected);
          return (
            <motion.button
              key={tile.key}
              onClick={() => tap(tile)}
              disabled={isMatched}
              animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`min-h-[7rem] rounded-2xl border-2 p-3 text-center text-sm flex items-center justify-center transition-colors ${
                isMatched
                  ? "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600/70 dark:text-emerald-400/70 opacity-60"
                  : isWrong
                  ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                  : isSelected
                  ? "border-[#0d3b4f] dark:border-amber-400 bg-[#0d3b4f]/5 dark:bg-amber-400/10"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400"
              }`}
            >
              <span className={tile.kind === "word" ? "font-black text-base" : "text-slate-600 dark:text-slate-300"}>
                {tile.text}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
