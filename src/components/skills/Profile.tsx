"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Flame, Zap, BookMarked } from "lucide-react";
import { getProfile, type ProfileResponse, type SubjectProgress } from "@/lib/skillTreeApi";

function subjName(lang: string, s: SubjectProgress) {
  return lang === "ru" ? s.name_ru : lang === "en" ? s.name_en : s.name_uz;
}

/** 12-week (84-day) activity heatmap, Duolingo/GitHub-style. */
function ActivityCalendar({ activity }: { activity: Record<string, number> }) {
  const days: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: activity[key] ?? 0 });
  }
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const shade = (c: number) =>
    c === 0 ? "bg-neutral-100 dark:bg-neutral-800" : c < 2 ? "bg-emerald-300" : c < 4 ? "bg-emerald-500" : "bg-emerald-600";

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((d) => (
            <div key={d.date} className={`w-3 h-3 rounded-sm ${shade(d.count)}`} title={`${d.date}: ${d.count}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Profile({ lang, userId, onBack }: { lang: string; userId: number; onBack: () => void }) {
  const [data, setData] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    getProfile(userId).then(setData).catch(() => setData(null));
  }, [userId]);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" />
        {lang === "ru" ? "Назад" : lang === "en" ? "Back" : "Orqaga"}
      </button>

      {!data ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-neutral-400" /></div>
      ) : (
        <div className="max-w-lg space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-white flex items-center justify-center text-2xl font-extrabold overflow-hidden shrink-0">
              {data.profile_picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.profile_picture} alt="" className="h-full w-full object-cover" />
              ) : (
                data.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-xl font-extrabold">{data.name}</h2>
              <span
                className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1"
                style={{ backgroundColor: `${data.league.color}33`, color: data.league.color }}
              >
                {lang === "ru" ? data.league.name_ru : lang === "en" ? data.league.name_en : data.league.name_uz}
                {" "}{lang === "ru" ? "лига" : lang === "en" ? "league" : "ligasi"}
              </span>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Zap, color: "#FFC800", value: data.xp_total, label: "XP" },
              { icon: Flame, color: "#FF9600", value: data.streak_days, label: lang === "ru" ? "дней" : lang === "en" ? "streak" : "kun" },
              { icon: BookMarked, color: "#58CC02", value: data.lessons_completed, label: lang === "ru" ? "уроков" : lang === "en" ? "lessons" : "dars" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3 text-center">
                <s.icon className="w-5 h-5 mx-auto mb-1" style={{ color: s.color }} />
                <div className="text-xl font-extrabold">{s.value}</div>
                <div className="text-[10px] text-neutral-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Strongest / weakest */}
          {(data.strongest || data.weakest) && (
            <div className="grid grid-cols-2 gap-3">
              {data.strongest && (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-3">
                  <p className="text-[10px] font-bold uppercase text-emerald-500">{lang === "ru" ? "Сильнейший" : lang === "en" ? "Strongest" : "Eng kuchli"}</p>
                  <p className="text-sm font-bold">{subjName(lang, data.strongest)}</p>
                  <p className="text-xs text-neutral-500">{data.strongest.pct}%</p>
                </div>
              )}
              {data.weakest && data.weakest.slug !== data.strongest?.slug && (
                <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3">
                  <p className="text-[10px] font-bold uppercase text-red-500">{lang === "ru" ? "Слабейший" : lang === "en" ? "Weakest" : "Eng zaif"}</p>
                  <p className="text-sm font-bold">{subjName(lang, data.weakest)}</p>
                  <p className="text-xs text-neutral-500">{data.weakest.pct}%</p>
                </div>
              )}
            </div>
          )}

          {/* Activity */}
          <div>
            <p className="text-sm font-bold mb-2">{lang === "ru" ? "Активность (12 недель)" : lang === "en" ? "Activity (12 weeks)" : "Faollik (12 hafta)"}</p>
            <ActivityCalendar activity={data.activity} />
          </div>

          {/* Per-subject progress */}
          <div>
            <p className="text-sm font-bold mb-2">{lang === "ru" ? "Прогресс по предметам" : lang === "en" ? "Progress by subject" : "Fanlar bo'yicha progress"}</p>
            <div className="space-y-2.5">
              {data.subjects.map((s) => (
                <div key={s.slug}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold">{subjName(lang, s)}</span>
                    <span className="text-neutral-500">{s.completed}/{s.total} · ⭐{s.stars}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color ?? "#58CC02" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
