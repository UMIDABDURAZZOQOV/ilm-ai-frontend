"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, Loader2, Check } from "lucide-react";
import { createDeck } from "@/lib/deckApi";

/**
 * Saves a set of flashcards as a reviewable deck (spaced repetition). Drop it
 * wherever flashcards are shown (Studio, companion answers). After saving it links
 * to /decks so the learner can review.
 */
export default function SaveDeckButton({
  userId,
  title,
  cards,
  lang = "uz",
  className = "",
}: {
  userId: number;
  title: string;
  cards: { front: string; back: string }[];
  lang?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const tr = (uz: string, ru: string, en: string) => (lang === "ru" ? ru : lang === "en" ? en : uz);

  async function save() {
    if (busy || saved || cards.length === 0) return;
    setBusy(true);
    try {
      await createDeck(userId, title || tr("To'plam", "Колода", "Deck"), cards);
      setSaved(true);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    return (
      <Link href="/decks" className={`inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 ${className}`}>
        <Check className="w-3.5 h-3.5" /> {tr("Saqlandi — takrorlash", "Сохранено — повторить", "Saved — review")}
      </Link>
    );
  }

  return (
    <button onClick={save} disabled={busy} className={`inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 disabled:opacity-50 ${className}`}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
      {tr("To'plamga saqlash", "Сохранить в колоду", "Save as deck")}
    </button>
  );
}
