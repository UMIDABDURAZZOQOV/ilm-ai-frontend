"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PenLine, ArrowLeft, Clock, Sparkles, Loader2, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { apiFetch } from "@/lib/api";
import { IELTS_WRITING, type IeltsWritingTask } from "@/lib/ielts";

export default function IeltsWritingPage() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [task, setTask] = useState<IeltsWritingTask | null>(null);
  const [filter, setFilter] = useState<"All" | "Task 1" | "Task 2">("All");
  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const words = useMemo(() => (essay.trim() ? essay.trim().split(/\s+/).length : 0), [essay]);

  const list = IELTS_WRITING.filter((t) => filter === "All" || t.task === filter);

  function open(t: IeltsWritingTask) {
    setTask(t);
    setEssay("");
    setFeedback(null);
  }

  async function getFeedback() {
    if (!task || !user || words < 20) return;
    setLoading(true);
    setFeedback(null);
    try {
      const prompt = `You are an IELTS Writing examiner. Assess the following ${task.task} response against the four IELTS band criteria (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy). Give an estimated band score (0-9) and 3 concise, specific improvement points. Prompt: "${task.prompt}". Response: "${essay}"`;
      const res = await apiFetch("/assistant/ask", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, question: prompt, language: lang }),
      });
      setFeedback(res.answer || "No feedback returned.");
    } catch (err: any) {
      setFeedback(
        err?.status === 403
          ? "You've reached today's AI feedback limit. Try again tomorrow or upgrade."
          : "AI feedback is unavailable right now. Your essay is still saved above."
      );
    } finally {
      setLoading(false);
    }
  }

  // ── List ─────────────────────────────────────────────────────────────────
  if (!task) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <PenLine className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> IELTS Writing
          </h1>
          <p className="text-slate-500 mt-1">Original Task 1 and Task 2 prompts with timing, word counts, and AI feedback.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 gap-1 w-full sm:w-auto sm:inline-flex">
          {(["All", "Task 1", "Task 2"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                filter === f ? "bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => open(t)}
              className="group text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex rounded-full bg-[#0d3b4f]/10 dark:bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#0d3b4f] dark:text-amber-400">
                  {t.task}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{t.category}</span>
              </div>
              <p className="text-sm mt-3 line-clamp-3 text-slate-700 dark:text-slate-200">{t.prompt}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-3">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t.minutes} min</span>
                <span>min {t.minWords} words</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ── Practice ─────────────────────────────────────────────────────────────
  const enough = words >= task.minWords;
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => setTask(null)} className="p-2 -ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-black flex-1">{task.task} · {task.category}</h1>
        <span className={`shrink-0 text-sm font-bold tabular-nums ${enough ? "text-emerald-500" : "text-slate-400"}`}>
          {words} / {task.minWords}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">{task.prompt}</p>
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Examiner tips</p>
          <ul className="space-y-1">
            {task.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-[#0d3b4f] dark:text-amber-400" /> {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <textarea
        value={essay}
        onChange={(e) => setEssay(e.target.value)}
        placeholder="Write your response here…"
        className="w-full h-72 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm leading-relaxed outline-none focus:border-[#0d3b4f] dark:focus:border-amber-400 resize-y"
      />

      <button
        onClick={getFeedback}
        disabled={loading || words < 20}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0d3b4f] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Get AI band feedback</>}
      </button>

      {feedback && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> AI feedback
          </p>
          <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-200">{feedback}</p>
        </div>
      )}
    </div>
  );
}
