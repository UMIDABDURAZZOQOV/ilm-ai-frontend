"use client";

import { useEffect, useState } from "react";
import { Loader2, Trophy, ArrowLeft } from "lucide-react";
import { getWeeklyLeaderboard, type LeaderboardResponse } from "@/lib/skillTreeApi";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ lang, onBack }: { lang: string; onBack: () => void }) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklyLeaderboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" />
        {lang === "ru" ? "Назад" : lang === "en" ? "Back" : "Orqaga"}
      </button>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-amber-500" />
        <h2 className="text-lg font-extrabold">
          {lang === "ru" ? "Рейтинг недели" : lang === "en" ? "Weekly leaderboard" : "Haftalik reyting"}
        </h2>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-neutral-400" /></div>
      ) : !data || data.entries.length === 0 ? (
        <p className="text-sm text-neutral-500 py-8 text-center">
          {lang === "ru" ? "На этой неделе пока никто не занимался — будь первым!" : lang === "en" ? "No one has studied this week yet — be the first!" : "Bu hafta hali hech kim shug'ullanmadi — birinchi bo'ling!"}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.entries.map((e) => (
            <div
              key={e.user_id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
                e.is_me
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              }`}
            >
              <span className="w-8 text-center font-extrabold text-sm">
                {e.rank <= 3 ? MEDALS[e.rank - 1] : e.rank}
              </span>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-white flex items-center justify-center text-xs font-extrabold overflow-hidden shrink-0">
                {e.profile_picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.profile_picture} alt="" className="h-full w-full object-cover" />
                ) : (
                  e.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="flex-1 text-sm font-bold truncate">
                {e.name}
                {e.is_me && <span className="text-emerald-600 dark:text-emerald-400"> ({lang === "ru" ? "вы" : lang === "en" ? "you" : "siz"})</span>}
              </span>
              <span className="text-sm font-extrabold text-amber-500">{e.weekly_xp} XP</span>
            </div>
          ))}
          {data.own_rank !== null && data.own_rank > 20 && (
            <p className="text-xs text-neutral-500 text-center mt-2">
              {lang === "ru" ? `Ваше место: ${data.own_rank}` : lang === "en" ? `Your rank: ${data.own_rank}` : `Sizning o'rningiz: ${data.own_rank}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
