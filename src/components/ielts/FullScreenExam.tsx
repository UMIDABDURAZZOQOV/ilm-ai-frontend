"use client";

import { useEffect, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

/**
 * Full-viewport chrome for an open exam.
 *
 * The exams used to render inside the SAT/IELTS dashboard layout, so the 252px
 * sidebar stayed on screen and squeezed the split view into about half the width —
 * the passage and its questions each ended up in a narrow column. A real test paper
 * gets the whole page, so this covers everything with a fixed overlay instead of
 * threading a "hide the chrome" flag through the layout: the exam is opened from page
 * state, not from a route, so the layout cannot know about it.
 *
 * `bottom` is for the test navigator (Listening · 1 · 2 · 3 · Writing).
 */
export default function FullScreenExam({
  title,
  subtitle,
  onExit,
  actions,
  bottom,
  children,
}: {
  title: string;
  subtitle?: string | null;
  onExit: () => void;
  actions?: ReactNode;
  bottom?: ReactNode;
  children: ReactNode;
}) {
  // Escape leaves the exam, and the page behind must not scroll under the overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onExit]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-[#0b1017] text-slate-900 dark:text-slate-100">
      <header className="shrink-0 flex items-center gap-3 px-4 h-12 border-b border-slate-200 dark:border-neutral-800">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Exit</span>
        </button>

        <div className="flex-1 min-w-0 text-center">
          <div className="font-bold truncate">{title}</div>
          {subtitle && <div className="text-[11px] text-slate-500 truncate">{subtitle}</div>}
        </div>

        <div className="flex items-center gap-2">{actions}</div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>

      {bottom && (
        <div className="shrink-0 border-t border-slate-200 dark:border-neutral-800">{bottom}</div>
      )}
    </div>
  );
}
