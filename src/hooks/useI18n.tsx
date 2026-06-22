"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Lang, TRANSLATIONS, TranslationKey } from "@/lib/i18n";

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    const saved = localStorage.getItem("ilm_lang") as Lang;
    if (saved && TRANSLATIONS[saved]) {
      setLangState(saved);
      document.documentElement.lang = saved;
    } else {
      document.documentElement.lang = lang;
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("ilm_lang", newLang);
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
