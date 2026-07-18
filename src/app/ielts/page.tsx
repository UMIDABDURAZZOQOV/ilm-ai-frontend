"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Headphones, BookOpen, PenTool, Mic, Play, TrendingUp, Target, Clock, ArrowRight, Award, Timer, Flame } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getUserMockTests } from "@/lib/ieltsApi";
import type { IeltsMockTest } from "@/lib/ieltsApi";
import { PremiumCard, StatCard, ProgressRing, SectionTitle } from "@/components/ui/premium";

const skills = [
  { href: "/ielts/listening", icon: Headphones, title: "Listening", desc: "Authentic audio recordings and comprehension practice.", meta: "30 min per section", metaIcon: Clock, from: "#8b5cf6", to: "#7c3aed" },
  { href: "/ielts/reading", icon: BookOpen, title: "Reading", desc: "Master academic passages with timed exercises.", meta: "60 min per section", metaIcon: Clock, from: "#22c55e", to: "#16a34a" },
  { href: "/ielts/writing", icon: PenTool, title: "Writing", desc: "Instant AI feedback on Task 1 and Task 2 essays.", meta: "AI-graded band scores", metaIcon: Target, from: "#f97316", to: "#ea580c" },
  { href: "/ielts/speaking", icon: Mic, title: "Speaking", desc: "Record responses, get AI pronunciation feedback.", meta: "Real-time analysis", metaIcon: TrendingUp, from: "#ec4899", to: "#db2777" },
];

export default function IeltsPage() {
  const { user } = useAuth();
  const [mockTests, setMockTests] = useState<IeltsMockTest[]>([]);

  useEffect(() => {
    if (user) getUserMockTests(user.id).then(setMockTests).catch(() => {});
  }, [user]);

  const overallBand = mockTests[0]?.overall_band ?? null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-black tracking-tight">IELTS Preparation</h1>
        <p className="text-slate-500 mt-1">Master all four skills with AI-powered practice.</p>
      </motion.div>

      {/* Overall band ring + stats */}
      <div className="grid lg:grid-cols-4 gap-4">
        <PremiumCard className="p-6 flex items-center gap-5 lg:col-span-1">
          <ProgressRing value={overallBand ?? 0} max={9} size={92} stroke={9} color="#3b82f6">
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-white">{overallBand ? overallBand.toFixed(1) : "—"}</div>
              <div className="text-[9px] font-bold text-slate-400">BAND</div>
            </div>
          </ProgressRing>
          <div>
            <div className="text-sm font-bold text-slate-500">Overall band</div>
            <div className="text-xs text-slate-400 mt-1">Latest mock test</div>
          </div>
        </PremiumCard>
        <StatCard icon={Award} iconColor="#3b82f6" label="Mock tests" countTo={mockTests.length} delay={0.05} />
        <StatCard icon={Timer} iconColor="#8b5cf6" label="Practice hours" countTo={0} delay={0.1} />
        <StatCard icon={Flame} iconColor="#f97316" label="Study streak" countTo={user?.id ? (mockTests.length > 0 ? 1 : 0) : 0} delay={0.15} />
      </div>

      {/* 4 skill cards */}
      <div>
        <SectionTitle icon={Play}>The four skills</SectionTitle>
        <div className="grid md:grid-cols-2 gap-4">
          {skills.map((s, i) => (
            <Link key={s.href} href={s.href}>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl p-6 text-white cursor-pointer relative overflow-hidden shadow-lg"
                style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
              >
                <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-xl" />
                <div className="flex items-start justify-between relative">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon className="h-6 w-6" />
                      <h2 className="text-xl font-black">{s.title}</h2>
                    </div>
                    <p className="text-sm opacity-90 mb-4 max-w-xs">{s.desc}</p>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <s.metaIcon className="h-4 w-4" /> {s.meta}
                    </div>
                  </div>
                  <Play className="h-8 w-8 opacity-80" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Full mock test CTA */}
      <Link href="/ielts/mock-test">
        <PremiumCard hover className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold mb-1">Full Computer-Based Mock Test</h3>
              <p className="text-sm text-slate-500">Experience the real IELTS exam format across all four skills.</p>
            </div>
            <span className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors">
              Start Mock Test <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </PremiumCard>
      </Link>

      {/* Recent mock tests */}
      {mockTests.length > 0 && (
        <PremiumCard className="p-6">
          <SectionTitle icon={Award}>Recent mock tests</SectionTitle>
          <div className="space-y-3">
            {mockTests.slice(0, 3).map((test) => (
              <div key={test.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.03] rounded-xl">
                <div>
                  <div className="font-medium">{test.test_type === "academic" ? "Academic" : "General Training"}</div>
                  <div className="text-xs text-slate-500">{new Date(test.started_at).toLocaleDateString()} · {test.status}</div>
                </div>
                {test.overall_band && <div className="text-2xl font-black text-blue-500">{test.overall_band.toFixed(1)}</div>}
              </div>
            ))}
          </div>
        </PremiumCard>
      )}
    </div>
  );
}
