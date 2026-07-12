"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  BookOpen,
  Timer,
  BarChart3,
  Target,
  ArrowRight,
  Flame,
  ClipboardCheck,
  Layers,
  Sparkles,
  Calendar,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDashboard, type DashboardStats } from "@/lib/satIeltsApi";

export default function SatHomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getDashboard(user.id, "SAT")
      .then((d) => !cancelled && setStats(d))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const predicted = stats?.predicted_score ? Math.round(stats.predicted_score) : null;
  const target = stats?.target_score ?? null;

  // Calculate days to exam (example: August 22, 2026)
  const examDate = new Date("2026-08-22");
  const today = new Date();
  const daysToExam = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const quickActions = [
    {
      href: "/sat/bank",
      icon: BookOpen,
      title: "Question Bank",
      desc: "Practice by domain and skill, tracked per topic.",
      accent: "text-sky-500",
      ring: "group-hover:ring-sky-400/40",
      glow: "bg-sky-500/10",
    },
    {
      href: "/sat/vocab",
      icon: Layers,
      title: "Vocabulary",
      desc: "Flashcards, matching, and quizzes for key SAT words.",
      accent: "text-rose-500",
      ring: "group-hover:ring-rose-400/40",
      glow: "bg-rose-500/10",
    },
    {
      href: "/sat/mock",
      icon: Timer,
      title: "Mock Test",
      desc: "Full-length timed simulation, just like exam day.",
      accent: "text-violet-500",
      ring: "group-hover:ring-violet-400/40",
      glow: "bg-violet-500/10",
    },
    {
      href: "/sat/official",
      icon: ClipboardCheck,
      title: "Official Tests",
      desc: "Real College Board tests — bring results in for AI analysis.",
      accent: "text-amber-500",
      ring: "group-hover:ring-amber-400/40",
      glow: "bg-amber-500/10",
    },
    {
      href: "/sat/analytics",
      icon: BarChart3,
      title: "Analytics",
      desc: "Score prediction, weak spots, and progress trends.",
      accent: "text-emerald-500",
      ring: "group-hover:ring-emerald-400/40",
      glow: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header with Search and Stats ─────────────────────────────────────── */}
      <div className="flex items-center gap-4 justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {greeting}, <span className="text-slate-400">{user?.name?.split(" ")[0] || "student"}</span>
          </h1>
          <p className="text-slate-500 mt-1">Let's start by creating a study plan</p>
        </div>
        {stats && stats.sessions_completed > 0 && (
          <div className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold">
            <span className="text-orange-500">🔥 {stats.sessions_completed}</span>
            <span className="text-slate-400 font-medium ml-1">sessions</span>
          </div>
        )}
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Study Plan */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="text-lg font-bold mb-4">☰ Today's Study Plan</div>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center gap-3 text-slate-400 text-sm">
              No plan yet — create one to see today's sessions here.
              <Link href="/sat/planner" className="bg-op-blue hover:bg-op-blueHover text-white text-sm font-bold px-4 py-2 rounded-lg">
                Create my study plan
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map((a, i) => (
              <motion.div
                key={a.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.05 }}
              >
                <Link
                  href={a.href}
                  className={`group relative block h-full rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5 ${a.ring}`}
                >
                  <div
                    className={`h-11 w-11 rounded-xl ${a.glow} flex items-center justify-center mb-4`}
                  >
                    <a.icon className={`h-5 w-5 ${a.accent}`} />
                  </div>
                  <p className="font-bold flex items-center gap-1">
                    {a.title}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{a.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          {/* Days to Exam */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="text-sm font-bold text-slate-500 mb-2">Time left to the next SAT</div>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">{daysToExam}<span className="text-sm font-bold text-slate-400"> days</span></span>
            </div>
            <div className="text-sm text-slate-500 mt-2">Next test date: August 22, 2026</div>
          </div>

          {/* Current Score */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="text-sm font-bold text-slate-500 mb-2">Current Score</div>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            ) : (
              <>
                <div className="text-4xl font-bold">{predicted ?? "—"}</div>
                <div className="text-sm text-slate-400 mt-1">
                  {predicted ? "Predicted score" : "Take the diagnostic to see your predicted score"}
                </div>
                {!predicted && (
                  <Link href="/sat/bank" className="inline-block mt-3 bg-op-blue hover:bg-op-blueHover text-white text-sm font-bold px-4 py-2 rounded-lg">
                    Start diagnostic
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Focus Areas */}
          {stats && stats.weak_spots.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="text-sm font-bold mb-3">Focus areas</div>
              <div className="flex flex-wrap gap-2">
                {stats.weak_spots.map((w) => (
                  <span
                    key={w}
                    className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm rounded-full font-medium"
                  >
                    {w}
                  </span>
                ))}
              </div>
              <Link href="/sat/bank" className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-op-blue">
                Practice these <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
