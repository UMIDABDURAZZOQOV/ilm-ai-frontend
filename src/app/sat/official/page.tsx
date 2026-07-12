"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  ExternalLink,
  Download,
  Monitor,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Target,
  BookOpen,
  FunctionSquare,
  Info,
} from "lucide-react";

// These are College Board's own free resources — Ilm AI links to them
// (it does not host or copy them), then helps you analyse your result.
const BLUEBOOK_URL = "https://bluebook.collegeboard.org/";
const LINEAR_PDF_URL =
  "https://satsuite.collegeboard.org/sat/practice-preparation/practice-tests/linear";
const PRACTICE_HUB_URL =
  "https://satsuite.collegeboard.org/sat/practice-preparation/practice-tests";

interface OfficialTest {
  name: string;
  format: string;
  desc: string;
}

const BLUEBOOK_TESTS: OfficialTest[] = [
  { name: "Practice Test 1", format: "Adaptive · Bluebook", desc: "Full digital, section-adaptive — closest to the real thing." },
  { name: "Practice Test 2", format: "Adaptive · Bluebook", desc: "Timed, with the official Bluebook tools and scoring." },
  { name: "Practice Test 3", format: "Adaptive · Bluebook", desc: "Second module difficulty adapts to your first-module score." },
  { name: "Practice Test 4", format: "Adaptive · Bluebook", desc: "Official scoring converts your answers to a 400–1600 scale." },
  { name: "Practice Tests 5 & 6", format: "Adaptive · Bluebook", desc: "Two more full-length official forms inside the Bluebook app." },
];

// Percentile lookup is a coarse public approximation of the SAT scale.
function percentileFor(total: number): number {
  const table: [number, number][] = [
    [1600, 99], [1500, 98], [1400, 94], [1300, 86], [1200, 74],
    [1100, 58], [1000, 41], [900, 25], [800, 11], [700, 3], [400, 1],
  ];
  for (const [score, pct] of table) if (total >= score) return pct;
  return 1;
}

export default function OfficialTestsPage() {
  const [rw, setRw] = useState("");
  const [math, setMath] = useState("");
  const [target, setTarget] = useState("");

  const analysis = useMemo(() => {
    const rwN = parseInt(rw, 10);
    const mathN = parseInt(math, 10);
    if (isNaN(rwN) || isNaN(mathN)) return null;
    const clampSec = (n: number) => Math.max(200, Math.min(800, n));
    const rwc = clampSec(rwN);
    const mc = clampSec(mathN);
    const total = rwc + mc;
    const targetN = parseInt(target, 10);
    const gap = !isNaN(targetN) ? targetN - total : null;
    const weaker = rwc <= mc ? "Reading & Writing" : "Math";
    const weakerHref = weaker === "Math" ? "/sat/bank" : "/sat/bank";
    return { rwc, mc, total, gap, weaker, weakerHref, pct: percentileFor(total) };
  }, [rw, math, target]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <ClipboardCheck className="h-7 w-7 text-amber-500" /> Official Tests
        </h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          The real, full-length Digital SAT practice tests come straight from College Board — free.
          Take them in the official app, then bring your result here for AI-powered analysis.
        </p>
      </div>

      {/* Legal / how-it-works banner */}
      <div className="rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed">
          These are <span className="font-bold">College Board&apos;s own official tests</span>. We link you
          to them (we don&apos;t copy or host them) so you always get the authentic exam — then Ilm AI adds
          the analysis, prediction, and targeted practice on top.
        </p>
      </div>

      {/* Primary: Bluebook */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0d3b4f] text-white p-7 sm:p-8"
      >
        <div className="pointer-events-none absolute -top-20 -right-10 h-60 w-60 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Monitor className="h-7 w-7 text-amber-300" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-2">
              <Sparkles className="h-3 w-3" /> Recommended
            </div>
            <h2 className="text-2xl font-black">Bluebook — 6 full adaptive tests</h2>
            <p className="text-white/60 mt-1 max-w-lg text-sm leading-relaxed">
              College Board&apos;s official app. Section-adaptive, timed, with the exact tools and scoring
              you&apos;ll see on test day. This is the gold standard for a realistic score.
            </p>
          </div>
          <a
            href={BLUEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-400 text-[#0d3b4f] rounded-xl font-bold hover:bg-amber-300 transition-all"
          >
            Open Bluebook <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="relative mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BLUEBOOK_TESTS.map((t) => (
            <div key={t.name} className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="font-bold text-sm">{t.name}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/80 mt-0.5">
                {t.format}
              </p>
              <p className="text-xs text-white/50 mt-2 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Secondary: PDF / linear */}
      <div className="grid sm:grid-cols-2 gap-4">
        <a
          href={LINEAR_PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5 transition-all"
        >
          <div className="h-11 w-11 rounded-xl bg-sky-500/10 flex items-center justify-center mb-4">
            <Download className="h-5 w-5 text-sky-500" />
          </div>
          <p className="font-bold flex items-center gap-1">
            Linear (paper) practice tests
            <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Printable PDF versions of the official tests — handy when you can&apos;t run the app.
          </p>
        </a>
        <a
          href={PRACTICE_HUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5 transition-all"
        >
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <BookOpen className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="font-bold flex items-center gap-1">
            All official prep resources
            <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            College Board&apos;s full practice hub — scoring, answer explanations, and study guides.
          </p>
        </a>
      </div>

      {/* Analyze your official result */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-violet-500" />
          </div>
          <h3 className="text-xl font-black">Bring your result into Ilm AI</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6 max-w-xl">
          Finished an official test? Enter your two section scores below. We&apos;ll place you on the
          400–1600 scale, show your gap to target, and point you straight at your weaker section.
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          <ScoreInput label="Reading & Writing" icon={BookOpen} value={rw} onChange={setRw} accent="text-sky-500" />
          <ScoreInput label="Math" icon={FunctionSquare} value={math} onChange={setMath} accent="text-emerald-500" />
          <ScoreInput label="Target (optional)" icon={Target} value={target} onChange={setTarget} accent="text-amber-500" placeholder="1500" />
        </div>

        <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
          <Info className="h-3 w-3" /> Each section is scored 200–800.
        </p>

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50 p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total score</p>
                <p className="text-5xl font-black tabular-nums mt-1">{analysis.total}</p>
                <p className="text-xs text-slate-400 mt-1">≈ {analysis.pct}th percentile</p>
              </div>

              <div className="flex-1 space-y-3">
                <SecBar label="Reading & Writing" score={analysis.rwc} color="bg-sky-500" />
                <SecBar label="Math" score={analysis.mc} color="bg-emerald-500" />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
              {analysis.gap != null && (
                <p className="text-sm">
                  {analysis.gap > 0 ? (
                    <>
                      <span className="font-black text-amber-500">{analysis.gap} points</span>{" "}
                      <span className="text-slate-500">to your target.</span>
                    </>
                  ) : (
                    <span className="font-bold text-emerald-500">🎉 You&apos;ve hit your target — keep it up!</span>
                  )}
                </p>
              )}
              <div className="sm:ml-auto flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  Weakest: <span className="font-bold text-slate-700 dark:text-slate-200">{analysis.weaker}</span>
                </span>
                <Link
                  href={analysis.weakerHref}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0d3b4f] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                >
                  Practice {analysis.weaker} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function ScoreInput({
  label,
  icon: Icon,
  value,
  onChange,
  accent,
  placeholder = "—",
}: {
  label: string;
  icon: typeof BookOpen;
  value: string;
  onChange: (v: string) => void;
  accent: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5">
        <Icon className={`h-3.5 w-3.5 ${accent}`} /> {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent focus:border-[#0d3b4f] dark:focus:border-amber-400 outline-none text-lg font-bold tabular-nums transition-colors"
      />
    </label>
  );
}

function SecBar({ label, score, color }: { label: string; score: number; color: string }) {
  const pct = Math.max(0, Math.min(100, ((score - 200) / 600) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-black tabular-nums">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}
