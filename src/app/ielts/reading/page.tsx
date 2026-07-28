"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { getReading, getReadingQuestions } from "@/lib/ieltsApi";
import type { IeltsReading, IeltsQuestion } from "@/lib/ieltsApi";
import { useI18n } from "@/hooks/useI18n";
import AiTutor from "@/components/skills/AiTutor";
import FocusTimerWidget from "@/components/ui/FocusTimerWidget";

export default function IeltsReadingPage() {
  const { lang } = useI18n();
  const [readings, setReadings] = useState<IeltsReading[]>([]);
  const [currentPassage, setCurrentPassage] = useState<IeltsReading | null>(null);
  const [questions, setQuestions] = useState<IeltsQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReading().then((data) => {
      setReadings(data);
      setLoading(false);
    });
  }, []);

  const loadPassage = async (id: number) => {
    const passage = readings.find((r) => r.id === id);
    if (passage) {
      setCurrentPassage(passage);
      const qs = await getReadingQuestions(id);
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

  if (!currentPassage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/ielts" className="text-sm font-bold text-slate-500 hover:text-slate-700">
            ‹ Back to IELTS
          </Link>
          <h1 className="text-3xl font-bold flex-1">Reading Practice</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {readings.map((passage) => (
            <motion.div
              key={passage.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-green-500 transition-colors"
              onClick={() => loadPassage(passage.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-green-500">Section {passage.section}</span>
                <span className="text-xs text-slate-500 capitalize">{passage.difficulty}</span>
              </div>
              <h3 className="font-bold mb-1">{passage.title}</h3>
              {passage.word_count && (
                <div className="text-sm text-slate-500">{passage.word_count} words</div>
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
      <FocusTimerWidget lang={lang} />
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentPassage(null)}
          className="text-sm font-bold text-slate-500 hover:text-slate-700"
        >
          ‹ Back to passages
        </button>
        <h1 className="text-3xl font-bold flex-1">{currentPassage.title}</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="h-4 w-4" />
          <span>60 minutes</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Passage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-green-500" />
            <h2 className="font-bold">Passage</h2>
          </div>
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line">
            {currentPassage.passage_text}
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
                <span className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-bold flex items-center justify-center shrink-0">
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
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-green-300"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {question.question_type === "tfng" && question.options && (
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
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-green-300"
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
                    className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:border-green-500 disabled:opacity-50"
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
                      <div>
                        <span className="text-red-600 dark:text-red-400">Incorrect. </span>
                        <span className="text-slate-500">Correct answer: {question.correct_answer}</span>
                      </div>
                      <AiTutor
                        lang={lang}
                        questionText={question.question_text}
                        options={question.options}
                        correctAnswer={question.correct_answer}
                        userAnswer={answers[question.id]}
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      {!showResults && (
        <button
          onClick={() => setShowResults(true)}
          disabled={Object.keys(answers).length === 0}
          className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
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
            onClick={() => setCurrentPassage(null)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-lg transition-colors"
          >
            Try Another Passage
          </button>
        </motion.div>
      )}
    </div>
  );
}
