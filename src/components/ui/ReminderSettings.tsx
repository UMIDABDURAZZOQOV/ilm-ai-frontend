"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

// Set the daily study-reminder time. The backend scheduler already sends the
// nudge (Telegram if linked, push if the app is installed) — this just exposes
// the time, which previously had no UI.
export default function ReminderSettings({ userId, lang = "uz" }: { userId: number; lang?: string }) {
  const [time, setTime] = useState("09:00");
  const [linked, setLinked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    apiFetch(`/telegram/status/${userId}`)
      .then((d: { reminder_time?: string; linked?: boolean }) => {
        if (d.reminder_time) setTime(d.reminder_time);
        setLinked(!!d.linked);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [userId]);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      await apiFetch("/telegram/reminder", { method: "POST", body: JSON.stringify({ user_id: userId, reminder_time: time }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  const tr = (uz: string, ru: string, en: string) => (lang === "ru" ? ru : lang === "en" ? en : uz);
  if (!ready) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-4 w-4 text-indigo-500" />
        <p className="text-sm font-bold">{tr("Kunlik eslatma", "Ежедневное напоминание", "Daily reminder")}</p>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        {linked
          ? tr("Telegram orqali yuboriladi.", "Отправляется в Telegram.", "Sent via Telegram.")
          : tr("Ilovani o'rnatsangiz yoki Telegram ulasangiz eslatma keladi.", "Установите приложение или подключите Telegram для напоминаний.", "Install the app or link Telegram to receive it.")}
      </p>
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        />
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saved ? tr("Saqlandi", "Сохранено", "Saved") : tr("Saqlash", "Сохранить", "Save")}
        </button>
      </div>
    </div>
  );
}
