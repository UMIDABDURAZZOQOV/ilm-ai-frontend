"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCcw, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import {
  getDueReviews,
  completeReview,
  generateTopicQuiz,
  type ReviewItem,
  type ReviewQuizQuestion,
} from "@/lib/reviewApi";

interface User {
  id: number;
  name: string;
  email: string;
}

interface ReviewDashboardProps {
  user: User;
  onNavigate: (panelId: string) => void;
}

type ViewState = "list" | "quiz" | "result";

export default function ReviewDashboard({ user, onNavigate }: ReviewDashboardProps) {
  const { t, lang } = useI18n();
  const [due, setDue] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>("list");
  const [startingId, setStartingId] = useState<number | null>(null);

  const [activeItem, setActiveItem] = useState<ReviewItem | null>(null);
  const [questions, setQuestions] = useState<ReviewQuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [resultScore, setResultScore] = useState({ score: 0, total: 0 });

  const loadDue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDueReviews(user.id);
      setDue(data.due);
    } catch {
      setDue([]);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadDue();
  }, [loadDue]);

  async function startReview(item: ReviewItem) {
    setStartingId(item.id);
    try {
      const res = await generateTopicQuiz({
        user_id: user.id,
        topic: item.topic,
        num_questions: 5,
        difficulty: "medium",
        language: lang,
      });
      if (!res.questions || res.questions.length === 0) {
        alert(t("review_generate_error"));
        return;
      }
      setActiveItem(item);
      setQuestions(res.questions);
      setCurrentIdx(0);
      setSelected(null);
      setCorrectCount(0);
      setView("quiz");
    } catch (err: any) {
      alert(`${t("review_error_prefix")} ${err.message}`);
    } finally {
      setStartingId(null);
    }
  }

  async function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    const isCorrect = option === questions[currentIdx].correct_answer;
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    setCorrectCount(newCorrect);

    if (currentIdx === questions.length - 1) {
      const total = questions.length;
      setResultScore({ score: newCorrect, total });
      if (activeItem) {
        try {
          await completeReview(activeItem.id, { user_id: user.id, score: newCorrect, total });
        } catch {
          // best-effort — the review schedule just won't advance this time
        }
      }
    }
  }

  function handleNext() {
    if (currentIdx === questions.length - 1) {
      setView("result");
      return;
    }
    setCurrentIdx((i) => i + 1);
    setSelected(null);
  }

  function backToList() {
    setView("list");
    setActiveItem(null);
    loadDue();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (view === "result") {
    const pct = resultScore.total > 0 ? Math.round((resultScore.score / resultScore.total) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-10 max-w-md w-full shadow-xl">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <RotateCcw className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            {resultScore.score} / {resultScore.total} ({pct}%)
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            {pct >= 70 ? t("review_pass_msg") : t("review_fail_msg")}
          </p>
          <button
            onClick={backToList}
            className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-blue-600 transition-all"
          >
            {t("review_back_to_list")}
          </button>
        </div>
      </div>
    );
  }

  if (view === "quiz" && activeItem) {
    const q = questions[currentIdx];
    return (
      <div className="space-y-4">
        <button
          onClick={backToList}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("review_back")}
        </button>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>{activeItem.topic}</span>
          <span>
            {currentIdx + 1} / {questions.length}
          </span>
        </div>
        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">{q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrectOpt = opt === q.correct_answer;
              const showState = selected !== null;
              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={selected !== null}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center justify-between gap-2 ${
                    showState && isCorrectOpt
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : showState && isSelected
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : "border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {opt}
                  {showState && isCorrectOpt && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  {showState && isSelected && !isCorrectOpt && <XCircle className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
          {selected && (
            <>
              {q.explanation && <p className="mt-4 text-xs text-slate-500">{q.explanation}</p>}
              <button
                onClick={handleNext}
                className="mt-5 w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-blue-600 transition-all"
              >
                {currentIdx === questions.length - 1 ? t("review_finish") : t("review_next")}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (due.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 py-16 text-center">
        <div className="bg-slate-900/5 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-12 max-w-md w-full shadow-xl">
          <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <RotateCcw className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
            {t("review_empty_title")}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            {t("review_empty_desc")}
          </p>
          <button
            onClick={() => onNavigate("gaps")}
            className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-blue-600 transition-all"
          >
            {t("review_empty_cta")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t("dash_review")}</h2>
        <span className="text-xs font-semibold text-slate-400">
          {due.length} {t("review_topics_ready")}
        </span>
      </div>
      <div className="grid gap-3">
        {due.map((item) => (
          <div
            key={item.id}
            className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{item.topic}</p>
              {item.source_material && <p className="text-xs text-slate-400 mt-0.5">{item.source_material}</p>}
              <span className="inline-block mt-2 text-[11px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                {item.interval_stage + 1}-{t("review_stage")}
              </span>
            </div>
            <button
              onClick={() => startReview(item)}
              disabled={startingId === item.id}
              className="shrink-0 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-all"
            >
              {startingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : t("review_start")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
