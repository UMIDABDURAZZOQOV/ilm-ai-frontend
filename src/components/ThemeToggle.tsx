"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/**
 * Site-wide light/dark toggle. Small icon button meant to sit in any top bar
 * (landing nav, dashboard header, auth pages) so the theme is switchable from
 * anywhere, not just settings.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setThemeMode } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setThemeMode(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0 ${className}`}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
