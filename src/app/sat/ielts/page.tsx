"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookText, PenLine, Mic, Headphones, ChevronRight, GraduationCap } from "lucide-react";
import { IELTS_READING, IELTS_WRITING, IELTS_SPEAKING, IELTS_LISTENING } from "@/lib/ielts";

const SKILLS = [
  {
    href: "/sat/ielts/reading",
    title: "Reading",
    desc: "Academic passages with True/False/Not Given, multiple choice, and completion.",
    icon: BookText,
    accent: "from-sky-500 to-blue-600",
    count: `${IELTS_READING.length} passages`,
  },
  {
    href: "/sat/ielts/writing",
    title: "Writing",
    desc: "Task 1 and Task 2 prompts with timing, word counts, and band tips.",
    icon: PenLine,
    accent: "from-violet-500 to-fuchsia-600",
    count: `${IELTS_WRITING.length} prompts`,
  },
  {
    href: "/sat/ielts/speaking",
    title: "Speaking",
    desc: "Part 1, Part 2 cue cards, and Part 3 discussion questions with a timer.",
    icon: Mic,
    accent: "from-amber-500 to-orange-600",
    count: `${IELTS_SPEAKING.length} sets`,
  },
  {
    href: "/sat/ielts/listening",
    title: "Listening",
    desc: "Original scripts read aloud, then answer from what you hear.",
    icon: Headphones,
    accent: "from-emerald-500 to-teal-600",
    count: `${IELTS_LISTENING.length} exercises`,
  },
];

export default function IeltsHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <GraduationCap className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> IELTS Practice
        </h1>
        <p className="text-slate-500 mt-1">
          All four skills — original content in the real IELTS format, with instant feedback.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {SKILLS.map((s, i) => (
          <motion.div key={s.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link
              href={s.href}
              className="group h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5"
            >
              <div className={`h-20 bg-gradient-to-br ${s.accent} flex items-center justify-center`}>
                <s.icon className="h-9 w-9 text-white/90 group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">{s.title}</h3>
                  <span className="text-xs text-slate-400 font-semibold">{s.count}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1 flex-1">{s.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#0d3b4f] dark:text-amber-400">
                  Practice <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm text-slate-500">
        <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">100% original content</p>
        Every passage, prompt, and script here is written originally for Ilm AI in the standard IELTS format.
        The bank is growing toward 200 questions per skill.
      </div>
    </div>
  );
}
