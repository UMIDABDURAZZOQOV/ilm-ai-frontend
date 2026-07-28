"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, FileText, Check, AlertTriangle, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getInsights, type Insights } from "@/lib/insightsApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 240, h = 48, max = 100, min = 0;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline points={pts.join(" ")} fill="none" stroke="#6366F1" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function InsightsPage() {
  const { user, isLoading } = useAuth();
  const { lang } = useI18n();
  const router = useRouter();
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    getInsights(user.id).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="sat-scope min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="sat-scope min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2"><ThemeToggle /><LanguageSwitcher /></div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-6 h-6 text-indigo-500" />
          <h1 className="text-xl font-extrabold">{tr(lang, "O'rganish tahlili", "Аналитика обучения", "Learning insights")}</h1>
        </div>
        <p className="text-sm text-neutral-500 mb-6">
          {tr(lang, "Nimalarni o'zlashtirdingiz — materiallar, natijalar va kuchli/zaif mavzular.", "Что вы освоили — материалы, результаты и темы.", "What you've learned — materials, results, and topics.")}
        </p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-neutral-400" /></div>
        ) : !data || !data.has_data ? (
          <div className="rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
            <p className="text-sm text-neutral-500">{tr(lang, "Hali ma'lumot yo'q — material yuklab, viktorina yeching.", "Пока нет данных — загрузите материал и пройдите тест.", "No data yet — upload material and take a quiz.")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 text-center">
                <div className="text-3xl font-black text-indigo-500">{data.quiz.overall_pct}%</div>
                <div className="text-xs text-neutral-500 mt-0.5">{tr(lang, "O'rtacha", "Средний", "Average")}</div>
              </div>
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 text-center">
                <div className="text-3xl font-black">{data.quiz.sessions}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{tr(lang, "Sessiyalar", "Сессии", "Sessions")}</div>
              </div>
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 text-center">
                <div className={`text-3xl font-black inline-flex items-center gap-1 ${data.quiz.trend >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {data.quiz.trend >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  {Math.abs(data.quiz.trend)}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">{tr(lang, "O'zgarish", "Тренд", "Trend")}</div>
              </div>
            </div>

            {/* Sparkline */}
            {data.quiz.recent_scores.length >= 2 && (
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
                <p className="text-xs font-bold text-neutral-400 mb-2">{tr(lang, "So'nggi natijalar", "Недавние результаты", "Recent scores")}</p>
                <Sparkline data={data.quiz.recent_scores} />
              </div>
            )}

            {/* Materials */}
            {data.materials.count > 0 && (
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
                <p className="text-xs font-bold text-neutral-400 mb-2">{tr(lang, "Materiallar", "Материалы", "Materials")} ({data.materials.count})</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.materials.files.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-0.5">
                      <FileText className="w-3 h-3" /> {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Strong / weak */}
            {data.strong_topics.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/40 p-4">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1.5"><Check className="w-4 h-4" /> {tr(lang, "Kuchli mavzular", "Сильные темы", "Strong topics")}</p>
                <div className="space-y-1.5">
                  {data.strong_topics.map((t) => (
                    <div key={t.topic} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-700 dark:text-neutral-200">{t.topic}</span>
                      <span className="font-bold text-emerald-600">{t.accuracy}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.weak_topics.length > 0 && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/40 p-4">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> {tr(lang, "Zaif mavzular", "Слабые темы", "Weak topics")}</p>
                <div className="space-y-1.5">
                  {data.weak_topics.map((t) => (
                    <div key={t.topic} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-700 dark:text-neutral-200">{t.topic}</span>
                      <span className="font-bold text-amber-600">{t.accuracy}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
