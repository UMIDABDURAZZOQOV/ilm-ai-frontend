"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Lang, TRANSLATIONS, TranslationKey } from "@/lib/i18n";

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);
const DEFAULT_LANGUAGE: Lang = "uz";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANGUAGE);

  useEffect(() => {
    let restored = DEFAULT_LANGUAGE;
    try {
      const saved = localStorage.getItem("ilm_lang") as Lang;
      if (saved && TRANSLATIONS[saved]) restored = saved;
    } catch { /* Public documents must work when browser storage is disabled. */ }
    setLangState(restored);
    document.documentElement.lang = restored;
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    try { localStorage.setItem("ilm_lang", newLang); } catch { /* Keep the selected language in memory. */ }
    document.documentElement.lang = newLang;
  };

  const t = (key: TranslationKey): string => {
    return TRANSLATIONS[lang][key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
