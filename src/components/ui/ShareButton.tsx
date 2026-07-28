"use client";

import { useState } from "react";
import { Share2, Loader2, Check } from "lucide-react";
import { createShare, shareUrl, type ShareKind } from "@/lib/shareApi";

/**
 * Creates a public read-only share link for a study artifact and copies it to the
 * clipboard. Self-contained — drop it next to any diagram/flashcards/cheatsheet.
 */
export default function ShareButton({
  userId,
  kind,
  title,
  payload,
  lang = "uz",
  className = "",
}: {
  userId: number;
  kind: ShareKind;
  title?: string;
  payload: unknown;
  lang?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const tr = (uz: string, ru: string, en: string) => (lang === "ru" ? ru : lang === "en" ? en : uz);

  async function share() {
    if (busy) return;
    setBusy(true);
    try {
      const { token } = await createShare({ userId, kind, title, payload });
      const url = shareUrl(token);
      try {
        if (navigator.share) await navigator.share({ title: title || "Ilm AI", url });
        else await navigator.clipboard.writeText(url);
      } catch {
        await navigator.clipboard.writeText(url).catch(() => {});
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={share}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 disabled:opacity-50 ${className}`}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? tr("Havola nusxalandi", "Ссылка скопирована", "Link copied") : tr("Ulashish", "Поделиться", "Share")}
    </button>
  );
}
