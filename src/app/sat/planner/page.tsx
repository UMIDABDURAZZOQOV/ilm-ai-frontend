"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Target, Clock, Loader2, Sparkles, ListChecks } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { generateStudyPlan, type StudyPlanResponse } from "@/lib/satIeltsApi";

export default function SatPlannerPage() {
  const { user } = useAuth();
  const [targetDate, setTargetDate] = useState("");
  const [targetScore, setTargetScore] = useState("1400");
  const [dailyHours, setDailyHours] = useState("2");
  const [plan, setPlan] = useState<StudyPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!user) return;
    const score = parseInt(targetScore, 10);
    const hours = parseFloat(dailyHours);
    if (!targetDate) { setError("Please choose a target exam date."); return; }
    if (!score || score < 400 || score > 1600) { setError("Target score must be between 400 and 1600."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await generateStudyPlan({
        user_id: user.id,
        exam_type: "SAT",
        target_date: targetDate,
        target_score: score,
        daily_hours: hours || 1,
      });
      setPlan(res);
    } catch (err: any) {
      setError(err?.status === 403 ? "You've reached today's AI limit. Try again tomorrow." : "Couldn't generate the plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Calendar className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> SAT Study Planner
        </h1>
        <p className="text-slate-500 mt-1">Set your goal and get an AI-built week-by-week plan tailored to your target.</p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-bold mb-2"><Calendar className="h-4 w-4 text-slate-400" /> Target exam date</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-[#0d3b4f] dark:focus:border-amber-400" />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-bold mb-2"><Target className="h-4 w-4 text-slate-400" /> Target score</label>
            <input type="number" min={400} max={1600} step={10} value={targetScore} onChange={(e) => setTargetScore(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-[#0d3b4f] dark:focus:border-amber-400" />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-bold mb-2"><Clock className="h-4 w-4 text-slate-400" /> Daily hours</label>
            <input type="number" min={0.5} max={12} step={0.5} value={dailyHours} onChange={(e) => setDailyHours(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-[#0d3b4f] dark:focus:border-amber-400" />
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <button onClick={generate} disabled={loading}
          className="mt-4 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#0d3b4f] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Generate my plan</>}
        </button>
      </div>

      {/* Plan */}
      {plan && plan.weeks?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-black">Your {plan.weeks.length}-week plan</h2>
          {plan.weeks.map((w, i) => (
            <motion.div key={w.week} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 rounded-xl bg-[#0d3b4f]/10 dark:bg-amber-400/10 flex items-center justify-center font-black text-[#0d3b4f] dark:text-amber-400">{w.week}</span>
                  <div>
                    <p className="font-bold">{w.focus}</p>
                    <p className="text-xs text-slate-400">{w.hours} hours this week</p>
                  </div>
                </div>
                {w.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {w.topics.map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              {w.tasks?.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {w.tasks.map((task, ti) => (
                    <li key={ti} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <ListChecks className="h-4 w-4 mt-0.5 shrink-0 text-[#0d3b4f] dark:text-amber-400" /> {task}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
