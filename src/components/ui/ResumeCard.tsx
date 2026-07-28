"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlayCircle, ArrowRight } from "lucide-react";
import { getCourse } from "@/lib/courseApi";

// "Continue where you left off": if the learner has a course in progress, surface
// it with progress so one tap resumes. Silent (renders nothing) when there's
// nothing to resume, so it never clutters a fresh dashboard.
export default function ResumeCard({ userId, lang = "uz" }: { userId: number; lang?: string }) {
  const [info, setInfo] = useState<{ title: string; done: number; total: number } | null>(null);

  useEffect(() => {
    getCourse(userId)
      .then((d) => {
        if (!d.course) return;
        const total = d.course.chapters.reduce((n, c) => n + c.lessons.length, 0);
        const done = Object.values(d.progress || {}).filter((p) => p.completed).length;
        if (total > 0) setInfo({ title: d.course.title, done, total });
      })
      .catch(() => {});
  }, [userId]);

  if (!info) return null;
  const pct = Math.round((info.done / info.total) * 100);
  const tr = (uz: string, ru: string, en: string) => (lang === "ru" ? ru : lang === "en" ? en : uz);
  const finished = info.done >= info.total;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Link href="/course" className="group block rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-lg hover:shadow-2xl">
        <div className="flex items-center gap-3">
          <PlayCircle className="h-9 w-9 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">
              {finished ? tr("Kursingiz", "Ваш курс", "Your course") : tr("Davom ettiring", "Продолжите", "Continue")}
            </p>
            <p className="font-extrabold text-lg leading-tight truncate">{info.title}</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-bold mb-1 text-white/90">
            <span>{info.done}/{info.total} {tr("dars", "уроков", "lessons")}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-black/20 overflow-hidden">
            <motion.div className="h-full rounded-full bg-white/90" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
