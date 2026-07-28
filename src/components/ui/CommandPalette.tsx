"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Sparkles, BookOpen, Camera, Headphones, Network, ScrollText, ClipboardList,
  Languages, NotebookPen, FolderOpen, BarChart3, Timer, Trophy, GraduationCap, Building2,
  PenLine, MessageSquare, Home, CornerDownLeft,
} from "lucide-react";

type Cmd = { label: string; href: string; icon: typeof Home; group: string; keywords?: string };

// One flat, searchable index of everywhere worth jumping to.
const COMMANDS: Cmd[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home, group: "Umumiy" },
  { label: "AI Companion", href: "/dashboard?panel=assistant", icon: MessageSquare, group: "Umumiy", keywords: "chat suhbat repetitor tutor" },
  { label: "Materialdan kurs", href: "/course", icon: Sparkles, group: "Ilm AI", keywords: "course kurs" },
  { label: "Ilm AI Studio", href: "/studio", icon: Sparkles, group: "Ilm AI", keywords: "studio asboblar" },
  { label: "Rasmdan to'plam", href: "/studio", icon: Camera, group: "Studio", keywords: "photo kit surat" },
  { label: "Eshitiladigan konspekt", href: "/studio", icon: Headphones, group: "Studio", keywords: "audio recap" },
  { label: "Bilim xaritasi", href: "/studio", icon: Network, group: "Studio", keywords: "knowledge map xarita" },
  { label: "Shpargalka", href: "/studio", icon: ScrollText, group: "Studio", keywords: "cheat sheet" },
  { label: "Materialdan sinov", href: "/studio", icon: ClipboardList, group: "Studio", keywords: "mock test" },
  { label: "Tarjima + tushuntirish", href: "/studio", icon: Languages, group: "Studio", keywords: "translate tarjima" },
  { label: "Qo'lyozma → kutubxona", href: "/studio", icon: NotebookPen, group: "Studio", keywords: "notes daftar" },
  { label: "Daftaringizni qidirish", href: "/studio", icon: Search, group: "Studio", keywords: "search qidiruv" },
  { label: "Materiallarim", href: "/studio", icon: FolderOpen, group: "Studio", keywords: "documents hujjat" },
  { label: "Fokus rejimi", href: "/focus", icon: Timer, group: "Ilm AI", keywords: "pomodoro focus taymer" },
  { label: "Flashcard to'plamlari", href: "/decks", icon: BookOpen, group: "Ilm AI", keywords: "decks flashcards srs takrorlash" },
  { label: "O'rganish tahlili", href: "/insights", icon: BarChart3, group: "Ilm AI", keywords: "insights analytics tahlil" },
  { label: "Fanlar", href: "/skills", icon: Trophy, group: "O'quv", keywords: "skills milliy sertifikat ona tili tarix" },
  { label: "Liga", href: "/skills", icon: Trophy, group: "O'quv", keywords: "league leaderboard reyting" },
  { label: "SAT", href: "/sat", icon: GraduationCap, group: "Imtihonlar", keywords: "sat" },
  { label: "IELTS", href: "/sat/ielts", icon: BookOpen, group: "Imtihonlar", keywords: "ielts" },
  { label: "College App", href: "/sat/college", icon: Building2, group: "Imtihonlar", keywords: "college universitet" },
  { label: "Essay Coach", href: "/sat/college/essay", icon: PenLine, group: "Imtihonlar", keywords: "essay esse personal statement" },
  { label: "Materiallarga yuklash", href: "/dashboard?panel=files", icon: FolderOpen, group: "Umumiy", keywords: "upload yuklash pdf" },
  { label: "Viktorina (materialdan)", href: "/dashboard?panel=quiz", icon: ClipboardList, group: "Umumiy", keywords: "quiz" },
  { label: "Flashcardlar", href: "/dashboard?panel=flashcards", icon: BookOpen, group: "Umumiy", keywords: "flashcards kartochka" },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) { setQ(""); setActive(0); setTimeout(() => inputRef.current?.focus(), 40); }
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COMMANDS;
    return COMMANDS.filter((c) => (c.label + " " + (c.keywords || "") + " " + c.group).toLowerCase().includes(s));
  }, [q]);

  function go(c: Cmd) {
    setOpen(false);
    router.push(c.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active]); }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 border-b border-neutral-100 dark:border-neutral-800">
              <Search className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                placeholder="Qidirish yoki o'tish…  (Ctrl/Cmd + K)"
                className="flex-1 py-3.5 bg-transparent text-sm outline-none text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400"
              />
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {results.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">Hech narsa topilmadi</p>
              ) : (
                results.map((c, i) => (
                  <button
                    key={c.label + c.href}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(c)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${i === active ? "bg-indigo-50 dark:bg-indigo-950/50" : ""}`}
                  >
                    <c.icon className={`h-4 w-4 shrink-0 ${i === active ? "text-indigo-500" : "text-neutral-400"}`} />
                    <span className="flex-1 text-sm font-medium text-neutral-800 dark:text-neutral-100">{c.label}</span>
                    <span className="text-[11px] text-neutral-400">{c.group}</span>
                    {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-indigo-400" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
