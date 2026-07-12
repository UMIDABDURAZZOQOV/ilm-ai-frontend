"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { analyzeSession, type SessionAnalysisResult } from "@/lib/satIeltsApi";

interface Props {
  sessionId: number;
}

/** On-demand "what did I actually get wrong, and why" AI report — the
 * CookSAT/Jumpinto-style post-test analysis. Reused by both PracticeSession
 * and FullLengthTest's result views. */
export default function AiAnalysisPanel({ sessionId }: Props) {
  const [analysis, setAnalysis] = useState<SessionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeSession(sessionId);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || "Could not generate analysis.");
    } finally {
      setLoading(false);
    }
  }

  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-700/30 rounded-2xl p-6 text-center">
        <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-3" />
        <h4 className="text-white font-bold mb-1">AI Mistake Analysis</h4>
        <p className="text-slate-400 text-sm mb-4 max-w-sm mx-auto">
          See exactly why you got each question wrong and what to do differently next time.
        </p>
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Analyzing..." : "Get AI Analysis"}
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-700/30 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h4 className="text-white font-bold">AI Analysis</h4>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
      </div>

      {analysis.weak_areas.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Weak Areas</h5>
          <div className="flex flex-wrap gap-2">
            {analysis.weak_areas.map((area, i) => (
              <span key={i} className="px-3 py-1 bg-red-900/20 border border-red-700/30 text-red-300 text-xs rounded-full">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.mistake_analysis.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Why You Got These Wrong</h5>
          {analysis.mistake_analysis.map((m, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm space-y-1.5">
              <p className="text-slate-300 font-medium">{m.question}</p>
              <p className="text-xs text-red-400">Your answer: {m.your_answer}</p>
              {m.correct_answer && <p className="text-xs text-green-400">Correct: {m.correct_answer}</p>}
              <p className="text-xs text-slate-400 italic mt-1">{m.why_wrong}</p>
            </div>
          ))}
        </div>
      )}

      {analysis.study_tips.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Strategy Tips</h5>
          <ul className="space-y-2">
            {analysis.study_tips.map((tip, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.recommended_topics.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recommended Topics</h5>
          <div className="flex flex-wrap gap-2">
            {analysis.recommended_topics.map((topic, i) => (
              <span key={i} className="px-3 py-1 bg-blue-900/20 border border-blue-700/30 text-blue-300 text-xs rounded-full">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
