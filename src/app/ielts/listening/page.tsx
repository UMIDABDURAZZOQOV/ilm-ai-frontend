"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getListening, getListeningQuestions } from "@/lib/ieltsApi";
import type { IeltsListening, IeltsQuestion } from "@/lib/ieltsApi";

export default function IeltsListeningPage() {
  const [listening, setListening] = useState<IeltsListening[]>([]);
  const [currentExercise, setCurrentExercise] = useState<IeltsListening | null>(null);
  const [questions, setQuestions] = useState<IeltsQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListening().then((data) => {
      setListening(data);
      setLoading(false);
    });
  }, []);

  const loadExercise = async (id: number) => {
    const exercise = listening.find((e) => e.id === id);
    if (exercise) {
      setCurrentExercise(exercise);
      const qs = await getListeningQuestions(id);
      setQuestions(qs);
      setAnswers({});
      setShowResults(false);
    }
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        correct++;
      }
    });
    return { correct, total: questions.length, percentage: (correct / questions.length) * 100 };
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!currentExercise) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/ielts" className="text-sm font-bold text-slate-500 hover:text-slate-700">
            ‹ Back to IELTS
          </Link>
          <h1 className="text-3xl font-bold flex-1">Listening Practice</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {listening.map((exercise) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-purple-500 transition-colors"
              onClick={() => loadExercise(exercise.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-purple-500">Section {exercise.section}</span>
                <span className="text-xs text-slate-500 capitalize">{exercise.difficulty}</span>
              </div>
              <h3 className="font-bold mb-1">{exercise.title}</h3>
              {exercise.duration_seconds && (
                <div className="text-sm text-slate-500">
                  {Math.floor(exercise.duration_seconds / 60)} min
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  const score = calculateScore();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentExercise(null)}
          className="text-sm font-bold text-slate-500 hover:text-slate-700"
        >
          ‹ Back to exercises
        </button>
        <h1 className="text-3xl font-bold flex-1">{currentExercise.title}</h1>
      </div>

      {/* Audio Player */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <button className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center hover:bg-purple-600 transition-colors">
            <Play className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-1/3" />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1:23</span>
              <span>3:45</span>
            </div>
          </div>
          <button className="text-slate-500 hover:text-slate-700">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium mb-2">{question.question_text}</p>
                {question.hint && (
                  <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {question.hint}
                  </span>
                )}
              </div>
            </div>

            {question.question_type === "mcq" && question.options && (
              <div className="space-y-2 ml-11">
                {question.options.map((option, oi) => (
                  <button
                    key={oi}
                    onClick={() => !showResults && handleAnswer(question.id, option)}
                    disabled={showResults}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      showResults
                        ? option === question.correct_answer
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : answers[question.id] === option
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-slate-200 dark:border-slate-700"
                        : answers[question.id] === option
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-purple-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {question.question_type === "completion" && (
              <div className="ml-11">
                <input
                  type="text"
                  value={answers[question.id] || ""}
                  onChange={(e) => !showResults && handleAnswer(question.id, e.target.value)}
                  disabled={showResults}
                  placeholder="Type your answer..."
                  className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>
            )}

            {showResults && (
              <div className="ml-11 mt-3">
                {answers[question.id] === question.correct_answer ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Correct!
                  </div>
                ) : (
                  <div className="text-sm">
                    <span className="text-red-600 dark:text-red-400">Incorrect. </span>
                    <span className="text-slate-500">Correct answer: {question.correct_answer}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Submit Button */}
      {!showResults && (
        <button
          onClick={() => setShowResults(true)}
          disabled={Object.keys(answers).length === 0}
          className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
        >
          Submit Answers
        </button>
      )}

      {/* Results */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center"
        >
          <div className="text-4xl font-bold mb-2">{score.correct}/{score.total}</div>
          <div className="text-slate-500 mb-4">{score.percentage.toFixed(0)}% correct</div>
          <button
            onClick={() => setCurrentExercise(null)}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-6 py-2 rounded-lg transition-colors"
          >
            Try Another Exercise
          </button>
        </motion.div>
      )}
    </div>
  );
}
