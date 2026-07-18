"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { explainQuestion } from "@/lib/skillTreeApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

/**
 * On-demand AI tutor. Rendered next to a wrong answer's feedback; only calls
 * Gemini when the learner actually taps it (never per question), so API cost
 * stays low. Once fetched, the explanation is cached in local state.
 */
export default function AiTutor({
  lang,
  questionText,
  options,
  correctAnswer,
  userAnswer,
}: {
  lang: string;
  questionText: string;
  options?: string[] | null;
  correctAnswer: string;
  userAnswer?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function ask() {
    if (loading || explanation) return;
    setLoading(true);
    setError(false);
    try {
      const r = await explainQuestion({
        question_text: questionText,
        options,
        correct_answer: correctAnswer,
        user_answer: userAnswer,
        lang,
      });
      setExplanation(r.explanation);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (explanation) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="mt-3 rounded-2xl border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950 p-3"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-bold text-violet-600 dark:text-violet-300">
            {tr(lang, "AI repetitor", "AI репетитор", "AI tutor")}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-line">{explanation}</p>
      </motion.div>
    );
  }

  return (
    <div className="mt-2">
      <button
        onClick={ask}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-violet-600 dark:text-violet-300 bg-violet-100 dark:bg-violet-950 hover:bg-violet-200 dark:hover:bg-violet-900 disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {loading
          ? tr(lang, "O'ylayapti...", "Думает...", "Thinking...")
          : tr(lang, "🤔 Tushuntirib ber", "🤔 Объясни", "🤔 Explain this")}
      </button>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 mt-1">
            {tr(lang, "Hozir bo'lmadi, qayta urinib ko'ring", "Не получилось, попробуйте снова", "Couldn't load, try again")}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
