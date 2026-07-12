"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Timer, BookOpen, FunctionSquare, Clock, ListChecks, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { startSession } from "@/lib/satIeltsApi";

// One step of a mock = one pure section, never mixing Math with Reading.
interface SectionStep {
  section: "Reading & Writing" | "Math";
  label: string;
  questions: number;
  minutes: number;
}

interface MockOption {
  key: string;
  title: string;
  desc: string;
  icon: typeof Timer;
  color: string;
  steps: SectionStep[];
}

const RW: SectionStep = { section: "Reading & Writing", label: "Reading & Writing", questions: 27, minutes: 35 };
const MATH: SectionStep = { section: "Math", label: "Math", questions: 22, minutes: 35 };

const OPTIONS: MockOption[] = [
  {
    key: "full",
    title: "Full-length SAT",
    desc: "Reading & Writing first, then Math — two separate timed sections, exactly like the real Digital SAT.",
    icon: FileText,
    color: "from-purple-500 to-fuchsia-600",
    steps: [RW, MATH],
  },
  {
    key: "rw",
    title: "Reading & Writing",
    desc: "A single timed R&W section — reading comprehension, grammar, and expression of ideas only.",
    icon: BookOpen,
    color: "from-blue-500 to-indigo-600",
    steps: [RW],
  },
  {
    key: "math",
    title: "Math",
    desc: "A single timed Math section — algebra, advanced math, data analysis, and geometry only.",
    icon: FunctionSquare,
    color: "from-emerald-500 to-teal-600",
    steps: [MATH],
  },
];

export default function MockTestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function launch(opt: MockOption) {
    if (!user || starting) return;
    setStarting(opt.key);
    setError(null);
    try {
      const first = opt.steps[0];
      const res = await startSession({
        user_id: user.id,
        exam_type: "SAT",
        section: first.section,
        difficulty: "medium",
        num_questions: first.questions,
        timed: true,
        duration_seconds: first.minutes * 60,
      });
      // The exam page reads this handoff; `plan` drives multi-section mocks.
      sessionStorage.setItem(
        "sat_session",
        JSON.stringify({
          session: res,
          mode: "mock",
          label: first.label,
          plan: {
            examType: "SAT",
            title: opt.title,
            steps: opt.steps,
            index: 0,
            results: [],
          },
        })
      );
      router.push("/sat/session");
    } catch (err: any) {
      setError(err.message || "Could not start the test. Try again.");
      setStarting(null);
    }
  }

  const totalQ = (o: MockOption) => o.steps.reduce((s, x) => s + x.questions, 0);
  const totalMin = (o: MockOption) => o.steps.reduce((s, x) => s + x.minutes, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Timer className="h-7 w-7 text-purple-500" /> Mock Tests
        </h1>
        <p className="text-slate-500 mt-1">
          Timed Digital SAT practice with real exam structure — sections stay separate, never mixed.
          Afterwards you get a score, domain breakdown, and AI mistake analysis.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {OPTIONS.map((opt, i) => (
          <motion.div
            key={opt.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5"
          >
            <div className={`h-24 bg-gradient-to-br ${opt.color} flex items-center justify-center`}>
              <opt.icon className="h-10 w-10 text-white/90 group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-bold text-lg">{opt.title}</h3>
              <p className="text-sm text-slate-500 mt-1 flex-1">{opt.desc}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-3 mb-4">
                <span className="flex items-center gap-1">
                  <ListChecks className="h-3.5 w-3.5" /> {totalQ(opt)} questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {totalMin(opt)} min
                </span>
              </div>
              {opt.steps.length > 1 && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
                  {opt.steps.map((s, si) => (
                    <span key={s.section} className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold">
                        {s.label}
                      </span>
                      {si < opt.steps.length - 1 && <span>→</span>}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => launch(opt)}
                disabled={starting !== null}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {starting === opt.key ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Preparing…
                  </>
                ) : (
                  <>
                    <Timer className="h-4 w-4" /> Start test
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm text-slate-500">
        <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">How it works</p>
        Each section is timed and submits automatically when the clock runs out — or finish early
        anytime. In the full-length test you move from Reading &amp; Writing to Math with a short break
        screen between, then see your combined results with per-question review and AI analysis.
      </div>
    </div>
  );
}
