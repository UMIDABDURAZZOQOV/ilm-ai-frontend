"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, RotateCcw, Check, X } from "lucide-react";
import { getFlashcards, type Flashcard } from "@/lib/skillTreeApi";

/**
 * A flip-card deck built from a subject's lesson theory. Front is the concept, back the
 * explanation; tap to flip, then mark "knew it" or "review". "Review" cards come round
 * again at the end of the deck, so a session ends only once everything has been recalled.
 */
export default function Flashcards({
  userId,
  subjectSlug,
  subjectName,
  onBack,
}: {
  userId: number;
  subjectSlug: string;
  subjectName: string;
  onBack: () => void;
}) {
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [knew, setKnew] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    getFlashcards(userId, subjectSlug)
      .then((d) => { setCards(d.cards); setQueue(d.cards); })
      .catch(() => setError("Kartochkalarni yuklab bo'lmadi."));
  }, [userId, subjectSlug]);

  const card = queue[0];
  const done = cards && queue.length === 0;

  const answer = (knewIt: boolean) => {
    setFlipped(false);
    setQueue((q) => {
      const [first, ...rest] = q;
      return knewIt ? rest : [...rest, first]; // review cards go to the back
    });
    if (knewIt) setKnew((k) => k + 1);
  };

  const restart = () => {
    if (!cards) return;
    setQueue(cards);
    setKnew(0);
    setFlipped(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ChevronLeft className="w-4 h-4" /> Orqaga
      </button>
      <h2 className="text-lg font-extrabold mb-1">Flashcardlar · {subjectName}</h2>
      <p className="text-sm text-neutral-500 mb-6">Kartani aylantiring, keyin bilaman/takror deб belgilang.</p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!cards && !error && <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
      {cards && cards.length === 0 && <p className="text-sm text-neutral-500">Bu fanda hozircha kartochka yo'q.</p>}

      {card && (
        <>
          <div className="text-xs text-neutral-400 mb-2 text-right">{cards!.length - queue.length + 1} / {cards!.length}</div>
          <button
            onClick={() => setFlipped((f) => !f)}
            className="w-full min-h-[240px] rounded-3xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 flex flex-col items-center justify-center text-center transition-colors"
          >
            {!flipped ? (
              <>
                <div className="text-xl font-black">{card.front}</div>
                <div className="text-xs text-neutral-400 mt-4">{card.lesson}</div>
                <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> ko'rish uchun bosing</div>
              </>
            ) : (
              <div className="text-[15px] whitespace-pre-line leading-relaxed">{card.back}</div>
            )}
          </button>

          {flipped && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={() => answer(false)} className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-orange-300 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 font-bold">
                <X className="w-4 h-4" /> Takror
              </button>
              <button onClick={() => answer(true)} className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 font-bold">
                <Check className="w-4 h-4" /> Bilaman
              </button>
            </div>
          )}
        </>
      )}

      {done && cards!.length > 0 && (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-black text-lg">Tayyor! {knew}/{cards!.length} kartani bildingiz</p>
          <button onClick={restart} className="mt-4 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm">
            Qayta boshlash
          </button>
        </div>
      )}
    </div>
  );
}
