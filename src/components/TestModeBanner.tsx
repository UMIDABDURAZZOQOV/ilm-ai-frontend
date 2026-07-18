"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

/**
 * Slim site-wide "test mode" notice shown at the very top of every page.
 * Dismissible per browser session (sessionStorage) so it reappears on the next
 * visit but doesn't nag during one session.
 */
export default function TestModeBanner() {
  const { lang } = useI18n();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(sessionStorage.getItem("ilm_testmode_dismissed") === "1");
  }, []);

  if (hidden) return null;

  const text =
    lang === "ru"
      ? "Сайт работает в тестовом режиме — возможны ошибки."
      : lang === "en"
      ? "The site is in test mode — errors may occur."
      : "Sayt test rejimida ishlamoqda — xatoliklar bo'lishi mumkin.";

  return (
    <div className="relative z-[60] flex items-center justify-center gap-2 bg-amber-400 text-amber-950 text-[13px] font-bold px-9 py-1.5 text-center">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>{text}</span>
      <button
        onClick={() => {
          sessionStorage.setItem("ilm_testmode_dismissed", "1");
          setHidden(true);
        }}
        aria-label="Close"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-amber-500/40"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
