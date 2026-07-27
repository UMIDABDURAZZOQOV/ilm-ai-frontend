"use client";

import { useEffect, useState } from "react";
import { Loader2, Trophy, ArrowLeft, ChevronUp } from "lucide-react";
import {
  getWeeklyLeaderboard,
  getLeague,
  type LeaderboardResponse,
  type LeagueResponse,
  type LeagueTier,
} from "@/lib/skillTreeApi";

const MEDALS = ["🥇", "🥈", "🥉"];
const LEAGUE_EMOJI: Record<string, string> = { diamond: "💎", gold: "🥇", silver: "🥈", bronze: "🥉" };

function tierName(lang: string, t: LeagueTier) {
  return lang === "ru" ? t.name_ru : lang === "en" ? t.name_en : t.name_uz;
}

export default function Leaderboard({ lang, userId, onBack }: { lang: string; userId: number; onBack: () => void }) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [league, setLeagueData] = useState<LeagueResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getWeeklyLeaderboard().then(setData).catch(() => setData(null)),
      getLeague(userId).then(setLeagueData).catch(() => setLeagueData(null)),
    ]).finally(() => setLoading(false));
  }, [userId]);

  // Progress bar toward the next tier: how far weekly XP has come from this
  // tier's floor toward the next tier's floor.
  const progressPct = (() => {
    if (!league || !league.next_league) return 100;
    const floor = league.league.min_xp;
    const span = league.next_league.min_xp - floor;
    return span > 0 ? Math.min(100, Math.round(((league.weekly_xp - floor) / span) * 100)) : 0;
  })();

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" />
        {lang === "ru" ? "Назад" : lang === "en" ? "Back" : "Orqaga"}
      </button>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-amber-500" />
        <h2 className="text-lg font-extrabold">
          {lang === "ru" ? "Лига недели" : lang === "en" ? "Weekly league" : "Haftalik liga"}
        </h2>
      </div>

      {/* Current league banner + promotion progress */}
      {league && (
        <div
          className="rounded-3xl p-5 mb-5 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${league.league.color}, ${league.league.color}bb)` }}
        >
          <div className="flex items-center gap-3">
            <span className="text-4xl">{LEAGUE_EMOJI[league.league.id] ?? "🏆"}</span>
            <div className="flex-1">
              <div className="text-xl font-black drop-shadow">{tierName(lang, league.league)}</div>
              <div className="text-sm font-semibold opacity-90">
                {league.weekly_xp} XP · {lang === "ru" ? "за неделю" : lang === "en" ? "this week" : "shu hafta"}
              </div>
            </div>
          </div>
          {league.next_league ? (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-bold mb-1 opacity-95">
                <span className="inline-flex items-center gap-1">
                  <ChevronUp className="w-3.5 h-3.5" />
                  {tierName(lang, league.next_league)}
                </span>
                <span>
                  {league.xp_to_next} XP {lang === "ru" ? "осталось" : lang === "en" ? "to go" : "qoldi"}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-black/20 overflow-hidden">
                <div className="h-full rounded-full bg-white/90" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm font-bold opacity-95">
              {lang === "ru" ? "Высшая лига — так держать!" : lang === "en" ? "Top league — keep it up!" : "Eng yuqori liga — shunday davom eting!"}
            </p>
          )}
        </div>
      )}

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
              <span className="text-base" title={e.league}>{LEAGUE_EMOJI[e.league] ?? ""}</span>
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
