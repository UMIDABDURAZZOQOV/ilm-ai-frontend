"use client";

import { useI18n } from "@/hooks/useI18n";
import { Lang } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <div className="lang-switch">
      {(["en", "uz", "ru"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`lang-btn ${lang === l ? "active" : ""}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
