"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, ChevronRight, Headphones, BookText, PenLine, Mic } from "lucide-react";

const SECTIONS = [
  { key: "listening", label: "Listening", icon: Headphones },
  { key: "reading", label: "Reading", icon: BookText },
  { key: "writing", label: "Writing", icon: PenLine },
  { key: "speaking", label: "Speaking", icon: Mic },
] as const;

// Official IELTS overall band = average of the four section bands, rounded to
// the nearest whole or half band (an average ending in .25 rounds up to .5, and
// .75 rounds up to the next whole band). Math.round(avg*2)/2 reproduces this.
function overallBand(avg: number) {
  return Math.round(avg * 2) / 2;
}

function bandLabel(b: number) {
  if (b >= 8) return "Expert / Very good user";
  if (b >= 7) return "Good user";
  if (b >= 6) return "Competent user";
  if (b >= 5) return "Modest user";
  if (b >= 4) return "Limited user";
  return "Basic user";
}

export default function IeltsCalculatorPage() {
  const [vals, setVals] = useState<Record<string, number>>({ listening: 6.5, reading: 6.5, writing: 6, speaking: 6.5 });

  const set = (k: string, v: number) => setVals((p) => ({ ...p, [k]: Math.max(0, Math.min(9, v)) }));

  const { avg, overall } = useMemo(() => {
    const nums = SECTIONS.map((s) => vals[s.key] || 0);
    const a = nums.reduce((x, y) => x + y, 0) / nums.length;
    return { avg: a, overall: overallBand(a) };
  }, [vals]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Calculator className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> IELTS Band Score Calculator
        </h1>
        <p className="text-slate-500 mt-1">Enter your four section bands to get your overall IELTS band (0–9).</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Inputs */}
        <div className="space-y-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          {SECTIONS.map((s) => (
            <div key={s.key}>
              <label className="flex items-center gap-2 text-sm font-bold mb-2">
                <s.icon className="h-4 w-4 text-[#0d3b4f] dark:text-amber-400" /> {s.label}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={9}
                  step={0.5}
                  value={vals[s.key]}
                  onChange={(e) => set(s.key, Number(e.target.value))}
                  className="flex-1 accent-[#0d3b4f] dark:accent-amber-400"
                />
                <div className="w-16 shrink-0 text-center">
                  <span className="text-2xl font-black tabular-nums">{vals[s.key].toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:sticky lg:top-6">
          <h3 className="text-center text-lg font-black mb-4">Overall band</h3>
          <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <p className="text-6xl font-black tabular-nums my-1">{overall.toFixed(1)}</p>
            <p className="text-sm font-semibold text-[#0d3b4f] dark:text-amber-400">{bandLabel(overall)}</p>
            <p className="text-xs text-slate-400 mt-1">Average of sections: {avg.toFixed(2)}</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {SECTIONS.map((s) => (
              <div key={s.key} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-slate-500 flex items-center gap-2"><s.icon className="h-4 w-4" /> {s.label}</span>
                <span className="font-black tabular-nums">{vals[s.key].toFixed(1)}</span>
              </div>
            ))}
          </div>
          <Link href="/sat/ielts" className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-bold text-[#0d3b4f] dark:text-amber-400 hover:underline">
            Practice IELTS <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
        <h3 className="text-lg font-black">How the IELTS band is calculated</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Each of the four sections — Listening, Reading, Writing and Speaking — is scored from 0 to 9 in half-band
          steps. Your overall band is the average of the four, rounded to the nearest whole or half band.
        </p>
        <ul className="text-sm text-slate-500 space-y-1.5">
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0d3b4f] dark:bg-amber-400" /> An average ending in <b className="text-slate-700 dark:text-slate-300">.25</b> rounds up to the next half band (e.g. 6.25 → 6.5).</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0d3b4f] dark:bg-amber-400" /> An average ending in <b className="text-slate-700 dark:text-slate-300">.75</b> rounds up to the next whole band (e.g. 6.75 → 7.0).</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#0d3b4f] dark:bg-amber-400" /> Listening and Reading bands come from raw correct answers (out of 40); Writing and Speaking are examiner-assessed.</li>
        </ul>
      </div>

      {/* What is a good band */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6">
        <h3 className="text-lg font-black mb-2">What is a good IELTS band?</h3>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800"><p className="text-2xl font-black">6.0–6.5</p><p className="text-slate-500">Accepted by many universities and visa routes.</p></div>
          <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800"><p className="text-2xl font-black">7.0+</p><p className="text-slate-500">Strong — required by many top programmes.</p></div>
          <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800"><p className="text-2xl font-black">8.0+</p><p className="text-slate-500">Excellent — near-native proficiency.</p></div>
        </div>
      </div>
    </div>
  );
}
