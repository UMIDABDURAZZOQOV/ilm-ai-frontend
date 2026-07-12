"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, ChevronRight } from "lucide-react";

// Digital SAT structure: RW = 2 modules × 27, Math = 2 modules × 22.
const MODULES = [
  { key: "rw1", label: "Reading and Writing — Module 1", max: 27, section: "rw" },
  { key: "rw2", label: "Reading and Writing — Module 2", max: 27, section: "rw" },
  { key: "m1", label: "Math — Module 1", max: 22, section: "math" },
  { key: "m2", label: "Math — Module 2", max: 22, section: "math" },
] as const;

// Section scaled score 200–800, rounded to the nearest 10. The real College
// Board curve is adaptive and test-specific, so this is a close estimate.
function scaled(raw: number, total: number) {
  const s = 200 + (raw / total) * 600;
  return Math.max(200, Math.min(800, Math.round(s / 10) * 10));
}

export default function DsatCalculatorPage() {
  const [vals, setVals] = useState<Record<string, number>>({ rw1: 14, rw2: 14, m1: 11, m2: 11 });

  const set = (k: string, v: number, max: number) =>
    setVals((prev) => ({ ...prev, [k]: Math.max(0, Math.min(max, Math.round(v || 0))) }));

  const { rwScore, mathScore, total } = useMemo(() => {
    const rwRaw = (vals.rw1 || 0) + (vals.rw2 || 0);
    const mathRaw = (vals.m1 || 0) + (vals.m2 || 0);
    const rw = scaled(rwRaw, 54);
    const math = scaled(mathRaw, 44);
    return { rwScore: rw, mathScore: math, total: rw + math };
  }, [vals]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Calculator className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> Digital SAT Score Calculator
        </h1>
        <p className="text-slate-500 mt-1">Estimate your total 400–1600 score from raw correct answers per module.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Inputs */}
        <div className="space-y-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          {MODULES.map((m) => (
            <div key={m.key}>
              <label className="block text-sm font-bold mb-2">{m.label}</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={m.max}
                  value={vals[m.key]}
                  onChange={(e) => set(m.key, Number(e.target.value), m.max)}
                  className="flex-1 accent-[#0d3b4f] dark:accent-amber-400"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={m.max}
                    value={vals[m.key]}
                    onChange={(e) => set(m.key, Number(e.target.value), m.max)}
                    className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold outline-none focus:border-[#0d3b4f] dark:focus:border-amber-400"
                  />
                  <span className="text-slate-400 text-sm font-semibold">/{m.max}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:sticky lg:top-6">
          <h3 className="text-center text-lg font-black mb-4">Results</h3>
          <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total score</p>
            <p className="text-5xl font-black tabular-nums my-1">{total}</p>
            <p className="text-xs text-slate-400">400–1600</p>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold">Reading & Writing</p>
              <p className="text-xs text-slate-400">200 to 800</p>
            </div>
            <p className="text-3xl font-black tabular-nums">{rwScore}</p>
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-bold">Math</p>
              <p className="text-xs text-slate-400">200 to 800</p>
            </div>
            <p className="text-3xl font-black tabular-nums">{mathScore}</p>
          </div>
          <Link href="/sat/mock" className="mt-2 flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-bold text-[#0d3b4f] dark:text-amber-400 hover:underline">
            Try our practice tests <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h3 className="text-lg font-black">How the Digital SAT Score Calculator works</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          The Digital SAT has two sections, each split into two adaptive modules. Your total score is the sum of
          Reading &amp; Writing (200–800) and Math (200–800), for a maximum of 1600.
        </p>
        <ul className="text-sm text-slate-500 space-y-1.5">
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0d3b4f] dark:bg-amber-400" /> Reading and Writing — Module 1 (27 questions)</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0d3b4f] dark:bg-amber-400" /> Reading and Writing — Module 2 (27 questions)</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0d3b4f] dark:bg-amber-400" /> Math — Module 1 (22 questions)</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0d3b4f] dark:bg-amber-400" /> Math — Module 2 (22 questions)</li>
        </ul>
        <p className="text-xs text-slate-400 leading-relaxed">
          Note: this is an estimate. The real College Board curve is adaptive and varies by test form — stronger
          Module 1 performance unlocks a harder Module 2 and a higher scoring ceiling — so your official score may differ.
        </p>
      </div>

      {/* What is a good score */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6">
        <h3 className="text-lg font-black mb-2">What is a good Digital SAT score?</h3>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800"><p className="text-2xl font-black">1200+</p><p className="text-slate-500">Above average — competitive for many universities.</p></div>
          <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800"><p className="text-2xl font-black">1350+</p><p className="text-slate-500">Strong — top ~10% of test-takers.</p></div>
          <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800"><p className="text-2xl font-black">1500+</p><p className="text-slate-500">Elite — competitive for the most selective schools.</p></div>
        </div>
      </div>
    </div>
  );
}
