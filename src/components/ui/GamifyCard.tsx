"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { getGamifyStats } from "@/lib/insightsApi";

// XP + streak earned across the whole app (Fanlar lessons AND studying with the
// companion/Studio, which now count too). A small, motivating home card.
export default function GamifyCard({ userId, lang = "uz" }: { userId: number; lang?: string }) {
  const [stats, setStats] = useState<{ xp_total: number; streak_days: number } | null>(null);

  useEffect(() => {
    getGamifyStats(userId).then(setStats).catch(() => setStats(null));
  }, [userId]);

  if (!stats || (stats.xp_total === 0 && stats.streak_days === 0)) return null;
  const tr = (uz: string, ru: string, en: string) => (lang === "ru" ? ru : lang === "en" ? en : uz);

  return (
    <div className="grid grid-cols-2 gap-4">
      <motion.div whileHover={{ y: -3 }} className="rounded-2xl p-4 text-white bg-gradient-to-br from-orange-500 to-rose-500 shadow-lg flex items-center gap-3">
        <Flame className="h-8 w-8 shrink-0" />
        <div>
          <div className="text-2xl font-black leading-none"><AnimatedNumber value={stats.streak_days} /></div>
          <div className="text-xs font-semibold opacity-90 mt-0.5">{tr("kunlik streak", "дней подряд", "day streak")}</div>
        </div>
      </motion.div>
      <motion.div whileHover={{ y: -3 }} className="rounded-2xl p-4 text-white bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg flex items-center gap-3">
        <Zap className="h-8 w-8 shrink-0" />
        <div>
          <div className="text-2xl font-black leading-none"><AnimatedNumber value={stats.xp_total} /></div>
          <div className="text-xs font-semibold opacity-90 mt-0.5">{tr("umumiy XP", "всего XP", "total XP")}</div>
        </div>
      </motion.div>
    </div>
  );
}
