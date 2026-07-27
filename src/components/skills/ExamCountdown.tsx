"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Flame, Target, Check, Pencil } from "lucide-react";
import { getExamCountdown, setExamDate, type ExamCountdown as Countdown } from "@/lib/skillTreeApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

/**
 * Turns the exam date into a live "today's share": days left + a paced daily XP
 * target, sitting at the top of the skills home. Uses User.target_date (the same
 * date the study planner uses), so setting it here also feeds the planner. When
 * no date is set it shows a one-tap date picker instead.
 */
export default function ExamCountdown({ lang, userId }: { lang: string; userId: number }) {
  const [data, setData] = useState<Countdown | null>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getExamCountdown(userId)
      .then((d) => {
        setData(d);
        if (d.target_date) setValue(d.target_date);
      })
      .catch(() => setData({ has_date: false }));
  }, [userId]);

  async function save() {
    if (!value) return;
    setSaving(true);
    try {
      await setExamDate(userId, value);
      const d = await getExamCountdown(userId);
      setData(d);
      setEditing(false);
    } catch {
      /* leave the picker open so the learner can retry */
    } finally {
      setSaving(false);
    }
  }

  if (!data) return null;

  // No date yet (or actively changing it) → compact date picker.
  if (!data.has_date || editing) {
    const today = new Date().toISOString().slice(0, 10);
    return (
      <div className="rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <CalendarClock className="w-5 h-5 text-indigo-500" />
          <span className="font-bold text-sm">
            {tr(lang, "Imtihon sanangiz qachon?", "Когда ваш экзамен?", "When is your exam?")}
          </span>
        </div>
        <p className="text-xs text-neutral-500 mb-3">
          {tr(
            lang,
            "Sanani belgilang — har kuni qancha shug'ullanish kerakligini ko'rsatamiz.",
            "Укажите дату — покажем, сколько заниматься каждый день.",
            "Set the date and we'll show your daily target to get there."
          )}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            min={today}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
          <button
            onClick={save}
            disabled={!value || saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50"
          >
            {tr(lang, "Saqlash", "Сохранить", "Save")}
          </button>
        </div>
      </div>
    );
  }

  const days = data.days_left ?? 0;
  const goalMet = (data.weekly_xp ?? 0) > 0 && data.studied_today;

  // Exam already passed → gentle prompt to set the next goal.
  if (data.passed) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full text-left rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 mb-5 flex items-center gap-3"
      >
        <CalendarClock className="w-6 h-6 text-neutral-400" />
        <span className="text-sm font-semibold text-neutral-500">
          {tr(lang, "Imtihon o'tdi — yangi maqsad qo'yasizmi?", "Экзамен прошёл — новая цель?", "Exam passed — set a new goal?")}
        </span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-5 mb-5 text-white shadow-lg bg-gradient-to-br from-indigo-500 to-violet-600 relative"
    >
      <button
        onClick={() => setEditing(true)}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/15 hover:bg-white/25"
        aria-label={tr(lang, "Sanani o'zgartirish", "Изменить дату", "Change date")}
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-end gap-3">
        <div className="text-5xl font-black leading-none">{days}</div>
        <div className="pb-1">
          <div className="text-sm font-bold">
            {days === 1
              ? tr(lang, "kun qoldi", "день остался", "day left")
              : tr(lang, "kun qoldi", "дней осталось", "days left")}
          </div>
          <div className="text-xs opacity-90">
            {tr(lang, "imtihongacha", "до экзамена", "until your exam")}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 text-sm">
        <div className="inline-flex items-center gap-1.5">
          <Target className="w-4 h-4" />
          <span className="font-bold">{data.suggested_daily_xp} XP</span>
          <span className="opacity-80">{tr(lang, "/ kun", "/ день", "/ day")}</span>
        </div>
        {(data.streak_days ?? 0) > 0 && (
          <div className="inline-flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-300" />
            <span className="font-bold">{data.streak_days}</span>
          </div>
        )}
        {goalMet && (
          <div className="inline-flex items-center gap-1 ml-auto bg-white/20 rounded-full px-2.5 py-1 text-xs font-bold">
            <Check className="w-3.5 h-3.5" />
            {tr(lang, "Bugun bajarildi", "Сегодня выполнено", "Done today")}
          </div>
        )}
      </div>
    </motion.div>
  );
}
