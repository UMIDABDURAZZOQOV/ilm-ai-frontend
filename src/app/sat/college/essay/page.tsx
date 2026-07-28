"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, Check, Lightbulb, Wand2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { reviewEssay, type EssayReview } from "@/lib/collegeApi";

export default function EssayCoachPage() {
  const { user } = useAuth();
  const [essay, setEssay] = useState("");
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<"personal_statement" | "supplemental">("personal_statement");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<EssayReview | null>(null);
  const [error, setError] = useState("");

  const words = essay.trim() ? essay.trim().split(/\s+/).length : 0;

  async function submit() {
    if (!user || words < 20 || busy) return;
    setBusy(true);
    setError("");
    setReview(null);
    try {
      const r = await reviewEssay({ userId: user.id, essay, prompt, essayType: type });
      setReview(r);
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      setError(err?.status === 403 ? "limit" : err?.detail === "essay_too_short" ? "short" : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link href="/sat/college" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white mb-4">
        <ArrowLeft className="h-4 w-4" /> Colleges
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <Wand2 className="w-6 h-6 text-teal-500" />
        <h1 className="text-2xl font-bold">Admissions Essay Coach</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Paste your personal statement or a supplemental essay and get honest, specific feedback like a counselor would give.
      </p>

      <div className="flex items-center gap-2 mb-3">
        {(["personal_statement", "supplemental"] as const).map((tt) => (
          <button
            key={tt}
            onClick={() => setType(tt)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${
              type === tt ? "border-teal-500 bg-teal-50 dark:bg-teal-950 text-teal-600" : "border-slate-200 dark:border-slate-800 text-slate-500"
            }`}
          >
            {tt === "personal_statement" ? "Personal statement" : "Supplemental"}
          </button>
        ))}
      </div>

      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Essay prompt (optional)"
        className="w-full mb-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-teal-500"
      />
      <textarea
        value={essay}
        onChange={(e) => setEssay(e.target.value)}
        rows={12}
        placeholder="Paste your essay here…"
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-teal-500 resize-none"
      />
      <div className="flex items-center justify-between mt-2 mb-4">
        <span className="text-xs text-slate-400">{words} words</span>
        <button
          onClick={submit}
          disabled={busy || words < 20}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? "Reviewing…" : "Get feedback"}
        </button>
      </div>

      {error === "short" && <p className="text-sm text-amber-600">Write a bit more first.</p>}
      {error === "limit" && <p className="text-sm text-amber-600">You've reached your AI usage limit.</p>}
      {error === "failed" && <p className="text-sm text-red-500">Couldn't review it — please try again.</p>}

      {review && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 mt-2">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">Overall</h3>
              {review.rating !== null && (
                <span className="text-lg font-black text-teal-500">{review.rating}/10</span>
              )}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{review.overall}</p>
          </div>

          {review.strengths.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/40 p-5">
              <h3 className="font-bold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1.5"><Check className="w-4 h-4" /> Strengths</h3>
              <ul className="space-y-1.5">
                {review.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700 dark:text-slate-200 flex gap-2"><span className="text-emerald-500">•</span>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {review.improvements.length > 0 && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/40 p-5">
              <h3 className="font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> How to improve</h3>
              <ul className="space-y-1.5">
                {review.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700 dark:text-slate-200 flex gap-2"><span className="text-amber-500">•</span>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {review.line_edits.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="font-bold mb-3">Line edits</h3>
              <div className="space-y-3">
                {review.line_edits.map((e, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-red-500 line-through decoration-red-300">{e.before}</p>
                    <p className="text-emerald-600 dark:text-emerald-400">{e.after}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
