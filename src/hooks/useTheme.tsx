"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
const STORAGE_KEY = "ilm_theme_mode";
const SUPPORTED: ThemeMode[] = ["light", "dark", "system"];

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function resolveSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeClass(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  // Restore persisted preference on mount (the blocking inline script in
  // layout.tsx already applied the right class before paint — this just
  // syncs React state to match, so the toggle UI shows the right selection).
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const mode = stored && SUPPORTED.includes(stored) ? stored : "system";
    setThemeModeState(mode);
    setResolvedTheme(mode === "system" ? resolveSystemTheme() : mode);
  }, []);

  // Track OS preference changes while in "system" mode.
  useEffect(() => {
    if (themeMode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = resolveSystemTheme();
      setResolvedTheme(next);
      applyThemeClass(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [themeMode]);

  function setThemeMode(mode: ThemeMode) {
    if (!SUPPORTED.includes(mode)) return;
    setThemeModeState(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
    const next = mode === "system" ? resolveSystemTheme() : mode;
    setResolvedTheme(next);
    applyThemeClass(next);
  }

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, resolvedTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
