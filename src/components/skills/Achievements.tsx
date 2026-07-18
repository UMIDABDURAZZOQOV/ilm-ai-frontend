"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Flame, BookOpen, Star, HelpCircle, Zap, Award } from "lucide-react";
import { getAchievements, type Achievement } from "@/lib/skillTreeApi";

const GROUP_META: Record<string, { icon: typeof Flame; color: string }> = {
  streak: { icon: Flame, color: "#FF9600" },
  lessons: { icon: BookOpen, color: "#58CC02" },
  perfect: { icon: Star, color: "#FFC800" },
  questions: { icon: HelpCircle, color: "#1CB0F6" },
  xp: { icon: Zap, color: "#CE82FF" },
};

function groupTitle(lang: string, group: string, target: number): string {
  const uz: Record<string, string> = {
    streak: `${target} kunlik seriya`,
    lessons: `${target} ta dars tugatish`,
    perfect: `${target} ta mukammal dars`,
    questions: `${target} ta savol yechish`,
    xp: `${target} XP to'plash`,
  };
  const ru: Record<string, string> = {
    streak: `Серия ${target} дней`,
    lessons: `Пройти ${target} уроков`,
    perfect: `${target} идеальных уроков`,
    questions: `Решить ${target} вопросов`,
    xp: `Набрать ${target} XP`,
  };
  const en: Record<string, string> = {
    streak: `${target}-day streak`,
    lessons: `Complete ${target} lessons`,
    perfect: `${target} perfect lessons`,
    questions: `Answer ${target} questions`,
    xp: `Earn ${target} XP`,
  };
  const map = lang === "ru" ? ru : lang === "en" ? en : uz;
  return map[group] ?? group;
}

export default function Achievements({ lang, userId, onBack }: { lang: string; userId: number; onBack: () => void }) {
  const [items, setItems] = useState<Achievement[] | null>(null);

  useEffect(() => {
    getAchievements(userId)
      .then((d) => setItems(d.achievements))
      .catch(() => setItems([]));
  }, [userId]);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" />
        {lang === "ru" ? "Назад" : lang === "en" ? "Back" : "Orqaga"}
      </button>
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-6 h-6 text-violet-500" />
        <h2 className="text-lg font-extrabold">{lang === "ru" ? "Достижения" : lang === "en" ? "Achievements" : "Yutuqlar"}</h2>
      </div>
      {!items ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-neutral-400" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((a) => {
            const meta = GROUP_META[a.group] ?? GROUP_META.xp;
            const Icon = meta.icon;
            const pct = a.target > 0 ? Math.round((a.progress / a.target) * 100) : 0;
            return (
              <div
                key={a.id}
                className={`rounded-2xl border-2 p-4 flex flex-col items-center text-center gap-2 ${
                  a.earned ? "bg-white dark:bg-neutral-900" : "opacity-55 bg-neutral-50 dark:bg-neutral-950"
                }`}
                style={{ borderColor: a.earned ? meta.color : "rgba(128,128,128,0.25)" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${meta.color}22` }}
                >
                  <Icon className="w-6 h-6" style={{ color: meta.color }} />
                </div>
                <p className="text-xs font-bold leading-tight">{groupTitle(lang, a.group, a.target)}</p>
                <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                </div>
                <p className="text-[10px] text-neutral-500 font-semibold">
                  {a.progress}/{a.target}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
