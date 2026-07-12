"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target,
  Brain,
  BarChart3,
  ArrowRight
} from "lucide-react";
import {
  startSession,
  submitAnswer,
  completeSession,
  type Question,
  type SessionStartResponse,
  type SessionResult,
  ExamType,
} from "@/lib/satIeltsApi";

interface DiagnosticTestProps {
  userId: number;
  examType: ExamType;
  onComplete: (result: SessionResult) => void;
}

export default function DiagnosticTest({ userId, examType, onComplete }: DiagnosticTestProps) {
  const [phase, setPhase] = useState<"intro" | "active" | "results">("intro");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<SessionStartResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === "active" && session) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, session]);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await startSession({
        user_id: userId,
        exam_type: examType,
        num_questions: 20,
        timed: false,
        session_type: "diagnostic",
      });
      setSession(res);
      setPhase("active");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (questionId: number, answer: string) => {
    if (!session) return;

    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    try {
      await submitAnswer(session.session_id, {
        question_id: questionId,
        answer,
        elapsed_ms: timeElapsed * 1000,
      });
    } catch (err) {
      console.error("Error submitting answer:", err);
    }

    // Move to next question
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Complete diagnostic
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await completeSession(session.session_id);
      setResult(res);
      setPhase("results");
      onComplete(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (phase === "intro") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-blue-900/10 backdrop-blur-xl max-w-2xl mx-auto"
      >
        <div className="text-center space-y-6">
          <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
            <Brain className="h-10 w-10 text-white" />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Diagnostic Test</h3>
            <p className="text-slate-400">
              Assess your current SAT level with a balanced test covering all domains and difficulty levels.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
              <p className="text-sm font-medium text-white">20 Questions</p>
              <p className="text-xs text-slate-500">Balanced mix</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-sm font-medium text-white">All Domains</p>
              <p className="text-xs text-slate-500">Math & RW</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <p className="text-sm font-medium text-white">Untimed</p>
              <p className="text-xs text-slate-500">Take your time</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <motion.button
            onClick={handleStart}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Starting Diagnostic…
              </>
            ) : (
              <>
                <Play className="h-5 w-5" /> Start Diagnostic Test
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (phase === "active" && session) {
    const question = session.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-3xl p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-xl max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white">Diagnostic Test</h4>
              <p className="text-xs text-slate-400">
                Question {currentQuestionIndex + 1} of {session.questions.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(timeElapsed)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          />
        </div>

        {/* Question */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                question.difficulty === "easy"
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : question.difficulty === "medium"
                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                  : "bg-red-500/10 text-red-400 border-red-500/30"
              }`}>
                {question.difficulty}
              </span>
              <span className="text-xs text-slate-500">{question.domain}</span>
            </div>
            <p className="text-white whitespace-pre-wrap">{question.question_text}</p>
          </div>

          {/* Options */}
          {question.question_type === "mcq" && question.options && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {question.options.map((option, idx) => {
                const isSelected = answers[question.id] === option;
                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleAnswer(question.id, option)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!!answers[question.id]}
                    className={`p-4 rounded-xl text-left transition-all border ${
                      isSelected
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (phase === "results" && result) {
    const score = Math.round(result.score_pct);
    const isPassing = score >= 70;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-blue-900/10 backdrop-blur-xl max-w-2xl mx-auto"
      >
        <div className="text-center space-y-6">
          <div className={`h-20 w-20 rounded-2xl flex items-center justify-center mx-auto ${
            isPassing ? "bg-green-500/20" : "bg-red-500/20"
          }`}>
            {isPassing ? (
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            ) : (
              <XCircle className="h-10 w-10 text-red-400" />
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {isPassing ? "Great Job!" : "Keep Practicing!"}
            </h3>
            <p className="text-slate-400">
              You scored {score}% ({result.questions_correct}/{result.questions_total} correct)
            </p>
          </div>

          {/* Score breakdown by domain */}
          {result.section_scores && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-300 mb-3">Performance by Domain</p>
              <div className="space-y-2">
                {Object.entries(result.section_scores).map(([domain, score]) => (
                  <div key={domain} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 flex-1">{domain}</span>
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          score >= 70 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-300 w-10 text-right">{Math.round(score)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <motion.button
            onClick={() => setPhase("intro")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
          >
            Take Another Diagnostic <ArrowRight className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return null;
}
