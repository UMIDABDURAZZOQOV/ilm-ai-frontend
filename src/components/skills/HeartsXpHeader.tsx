"use client";

import { Flame, Zap } from "lucide-react";
import type { GamificationSummary } from "@/lib/skillTreeApi";

export default function HeartsXpHeader({ summary }: { summary: GamificationSummary | null }) {
  if (!summary) return null;
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-2 shadow-sm w-fit">
      <div className="flex items-center gap-1.5">
        <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
        <span className="font-bold text-sm">{summary.xp_total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Flame className={`w-5 h-5 ${summary.streak_days > 0 ? "fill-orange-500 text-orange-500" : "text-neutral-300"}`} />
        <span className="font-bold text-sm">{summary.streak_days}</span>
      </div>
    </div>
  );
}
