"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  BookOpen,
  Timer,
  BarChart3,
  ArrowRight,
  ClipboardCheck,
  Layers,
  Target,
  CheckCircle2,
  ListChecks,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDashboard, type DashboardStats } from "@/lib/satIeltsApi";
import { PremiumCard, StatCard, ProgressRing, SectionTitle } from "@/components/ui/premium";

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

  const examDate = new Date("2026-08-22");
  const now = new Date();
  const ms = Math.max(0, examDate.getTime() - now.getTime());
  const daysToExam = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hrsToExam = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const minToExam = Math.floor((ms / (1000 * 60)) % 60);

  const quickActions = [
    { href: "/sat/bank", icon: BookOpen, title: "Question Bank", desc: "Practice by domain and skill, tracked per topic.", color: "#0ea5e9" },
    { href: "/sat/vocab", icon: Layers, title: "Vocabulary", desc: "Flashcards, matching, and quizzes for key SAT words.", color: "#f43f5e" },
    { href: "/sat/mock", icon: Timer, title: "Mock Test", desc: "Full-length timed simulation, just like exam day.", color: "#8b5cf6" },
    { href: "/sat/official", icon: ClipboardCheck, title: "Official Tests", desc: "Real College Board tests with AI analysis.", color: "#f59e0b" },
    { href: "/sat/analytics", icon: BarChart3, title: "Analytics", desc: "Score prediction, weak spots, and trends.", color: "#10b981" },
  ];

  const accuracy = stats?.overall_accuracy != null ? Math.round(stats.overall_accuracy) : null;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-black tracking-tight">
          {greeting}, <span className="text-slate-400">{user?.name?.split(" ")[0] || "student"}</span>
        </h1>
        <p className="text-slate-500 mt-1">Let&apos;s make today&apos;s practice count.</p>
      </motion.div>

      {/* Hero: countdown + predicted score ring */}
      <div className="grid lg:grid-cols-3 gap-5">
        <PremiumCard className="lg:col-span-2 p-6 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-op-teal/10 blur-2xl" />
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-3">
            <CalendarClock className="w-4 h-4 text-op-teal" /> Time left to the next SAT
          </div>
          <div className="flex items-end gap-4">
            {[
              { v: daysToExam, l: "days" },
              { v: hrsToExam, l: "hrs" },
              { v: minToExam, l: "min" },
            ].map((u) => (
              <div key={u.l} className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-slate-800 dark:text-white tabular-nums">{String(u.v).padStart(2, "0")}</span>
                <span className="text-sm font-bold text-slate-400">{u.l}</span>
              </div>
            ))}
          </div>
          <div className="text-sm text-slate-500 mt-3">Next test date · Saturday, August 22, 2026</div>
          <Link
            href="/sat/planner"
            className="inline-flex items-center gap-1.5 mt-5 bg-op-blue hover:bg-op-blueHover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            Create my study plan <ArrowRight className="w-4 h-4" />
          </Link>
        </PremiumCard>

        <PremiumCard delay={0.08} className="p-6 flex flex-col items-center justify-center">
          <div className="text-sm font-bold text-slate-500 mb-3 self-start flex items-center gap-2">
            <Target className="w-4 h-4 text-op-teal" /> Predicted score
          </div>
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-slate-400 my-6" />
          ) : (
            <ProgressRing value={predicted ?? 0} max={1600} color="#0E607A" size={148}>
              <div>
                <div className="text-3xl font-black text-slate-800 dark:text-white">{predicted ?? "—"}</div>
                <div className="text-[10px] font-bold text-slate-400">/ 1600</div>
              </div>
            </ProgressRing>
          )}
          {!predicted && !loading && (
            <Link href="/sat/bank" className="mt-3 text-sm font-bold text-op-blue">Take the diagnostic →</Link>
          )}
        </PremiumCard>
      </div>

      {/* Analytics stat row */}
      <div>
        <SectionTitle icon={BarChart3}>Analytics</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ListChecks} iconColor="#0ea5e9" label="Questions attempted" countTo={stats?.questions_attempted ?? 0} delay={0} />
          <StatCard icon={CheckCircle2} iconColor="#10b981" label="Current accuracy" value={accuracy != null ? `${accuracy}%` : "—"} delay={0.05} />
          <StatCard icon={Timer} iconColor="#8b5cf6" label="Sessions completed" countTo={stats?.sessions_completed ?? 0} delay={0.1} />
          <StatCard icon={AlertTriangle} iconColor="#f43f5e" label="Focus areas" countTo={stats?.weak_spots.length ?? 0} delay={0.15} />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <SectionTitle icon={Layers}>Practice</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map((a, i) => (
            <Link key={a.href} href={a.href} className="group block h-full">
              <PremiumCard hover delay={0.05 * i} className="p-5 h-full">
                <div className="w-11 h-11 rounded-xl grid place-items-center mb-4" style={{ backgroundColor: `${a.color}1a` }}>
                  <a.icon className="w-5 h-5" style={{ color: a.color }} />
                </div>
                <p className="font-bold flex items-center gap-1">
                  {a.title}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{a.desc}</p>
              </PremiumCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Focus areas */}
      {stats && stats.weak_spots.length > 0 && (
        <PremiumCard className="p-6">
          <SectionTitle icon={Target}>Focus areas</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {stats.weak_spots.map((w) => (
              <span key={w} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm rounded-full font-medium">
                {w}
              </span>
            ))}
          </div>
          <Link href="/sat/bank" className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-op-blue">
            Practice these <ArrowRight className="h-4 w-4" />
          </Link>
        </PremiumCard>
      )}
    </div>
  );
}
