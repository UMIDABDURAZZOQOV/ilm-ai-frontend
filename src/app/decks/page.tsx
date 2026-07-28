"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Layers, Trash2, Check, X, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Celebration from "@/components/ui/Celebration";
import { listDecks, getDueCards, reviewDeck, deleteDeck, type DeckSummary, type DueCard } from "@/lib/deckApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

export default function DecksPage() {
  const { user, isLoading } = useAuth();
  const { lang } = useI18n();
  const router = useRouter();

  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [active, setActive] = useState<{ id: number; title: string; cards: DueCard[] } | null>(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<{ index: number; correct: boolean }[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => { if (!isLoading && !user) router.push("/login"); }, [user, isLoading, router]);

  const load = useCallback(() => {
    if (!user) return;
    listDecks(user.id).then((d) => setDecks(d.decks)).catch(() => setDecks([]));
  }, [user]);
  useEffect(load, [load]);

  async function startReview(deck: DeckSummary) {
    if (!user) return;
    const d = await getDueCards(user.id, deck.id);
    if (d.cards.length === 0) return;
    setActive({ id: deck.id, title: d.title, cards: d.cards });
    setI(0); setFlipped(false); setResults([]); setFinished(false);
  }

  async function grade(correct: boolean) {
    if (!active) return;
    const next = [...results, { index: active.cards[i].index, correct }];
    setResults(next);
    if (i + 1 >= active.cards.length) {
      try { if (user) await reviewDeck(user.id, active.id, next); } catch { /* ignore */ }
      setFinished(true);
      load();
    } else {
      setI(i + 1); setFlipped(false);
    }
  }

  async function remove(deck: DeckSummary) {
    if (!user) return;
    if (!window.confirm(tr(lang, `"${deck.title}" o'chirilsinmi?`, `Удалить "${deck.title}"?`, `Delete "${deck.title}"?`))) return;
    await deleteDeck(user.id, deck.id).catch(() => {});
    setDecks((prev) => (prev ? prev.filter((x) => x.id !== deck.id) : prev));
  }

  if (isLoading || !user) {
    return <div className="sat-scope min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950"><Loader2 className="h-8 w-8 animate-spin text-neutral-400" /></div>;
  }

  // Review mode
  if (active) {
    const card = active.cards[i];
    const correctCount = results.filter((r) => r.correct).length;
    return (
      <div className="sat-scope min-h-screen bg-white dark:bg-neutral-950">
        <div className="max-w-lg mx-auto px-4 py-6">
          <button onClick={() => setActive(null)} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4" /> {tr(lang, "To'plamlar", "Колоды", "Decks")}
          </button>

          {finished ? (
            <div className="relative text-center py-16">
              <Celebration />
              <p className="text-5xl mb-3">🎉</p>
              <h2 className="text-xl font-extrabold mb-1">{tr(lang, "Takror tugadi!", "Повторение завершено!", "Review complete!")}</h2>
              <p className="text-sm text-neutral-500 mb-6">{correctCount}/{active.cards.length} {tr(lang, "to'g'ri", "верно", "correct")}</p>
              <button onClick={() => setActive(null)} className="px-6 py-3 rounded-2xl font-bold text-white bg-violet-600">{tr(lang, "Orqaga", "Назад", "Back")}</button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-3">
                <span>{active.title}</span>
                <span>{i + 1}/{active.cards.length}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.button
                  key={i + (flipped ? "b" : "f")}
                  initial={{ opacity: 0, rotateY: -8 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0 }}
                  onClick={() => setFlipped((f) => !f)}
                  className="w-full min-h-52 rounded-3xl border-2 border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/40 p-6 grid place-items-center text-center"
                >
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-400 mb-2">{flipped ? tr(lang, "Javob", "Ответ", "Back") : tr(lang, "Savol", "Вопрос", "Front")}</p>
                    <p className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{flipped ? card.back : card.front}</p>
                    {!flipped && <p className="text-xs text-neutral-400 mt-3">{tr(lang, "Javobni ko'rish uchun bosing", "Нажмите, чтобы увидеть", "Tap to reveal")}</p>}
                  </div>
                </motion.button>
              </AnimatePresence>

              {flipped && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 mt-4">
                  <button onClick={() => grade(false)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600">
                    <X className="h-4 w-4" /> {tr(lang, "Bilmadim", "Не знал", "Didn't know")}
                  </button>
                  <button onClick={() => grade(true)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600">
                    <Check className="h-4 w-4" /> {tr(lang, "Bildim", "Знал", "Knew it")}
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // List mode
  return (
    <div className="sat-scope min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2"><ThemeToggle /><LanguageSwitcher /></div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-6 h-6 text-violet-500" />
          <h1 className="text-xl font-extrabold">{tr(lang, "Flashcard to'plamlari", "Колоды карточек", "Flashcard decks")}</h1>
        </div>
        <p className="text-sm text-neutral-500 mb-6">{tr(lang, "Saqlangan to'plamlarni takrorlash bilan yodlang — muddati kelganlari birinchi.", "Учите сохранённые колоды с интервальным повторением.", "Learn your saved decks with spaced repetition — due cards first.")}</p>

        {decks === null ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-neutral-400" /></div>
        ) : decks.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
            <p className="text-sm text-neutral-500">{tr(lang, "Hali to'plam yo'q. Studio yoki companion flashcardlarini 'To'plamga saqlash' bilan qo'shing.", "Пока нет колод. Сохраните карточки из Studio.", "No decks yet. Save flashcards from Studio or the companion.")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {decks.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{d.title}</p>
                  <p className="text-xs text-neutral-500">
                    {d.total} {tr(lang, "karta", "карт", "cards")}
                    {d.due > 0 && <span className="text-violet-500 font-bold"> · {d.due} {tr(lang, "takror", "к повтору", "due")}</span>}
                  </p>
                </div>
                <button
                  onClick={() => startReview(d)}
                  disabled={d.due === 0}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40"
                >
                  {d.due > 0 ? tr(lang, "Takrorlash", "Повторить", "Review") : <RotateCcw className="h-4 w-4" />}
                </button>
                <button onClick={() => remove(d)} className="p-2 rounded-lg text-neutral-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
