"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Copy, Check, Gift, Send } from "lucide-react";
import { getReferral, applyReferral, type ReferralResponse } from "@/lib/skillTreeApi";

const SITE = "ilm-ai-edu.vercel.app";

export default function Referral({ lang, userId, onBack }: { lang: string; userId: number; onBack: () => void }) {
  const [data, setData] = useState<ReferralResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const [applyMsg, setApplyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    getReferral(userId).then(setData).catch(() => setData(null));
  }, [userId]);

  const shareText =
    lang === "ru"
      ? `Присоединяйся ко мне в Ilm AI и готовься к Milliy Sertifikat! Используй мой код ${data?.code} и получи бонус XP:`
      : lang === "en"
      ? `Join me on Ilm AI and prep for the Milliy Sertifikat! Use my code ${data?.code} for bonus XP:`
      : `Ilm AI'da men bilan birga Milliy Sertifikatga tayyorlan! Mening kodim ${data?.code} bilan bonus XP ol:`;

  function copyCode() {
    if (!data) return;
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function submitCode() {
    if (!code.trim()) return;
    setApplying(true);
    setApplyMsg(null);
    try {
      const r = await applyReferral(userId, code.trim());
      setApplyMsg({
        ok: true,
        text:
          lang === "ru"
            ? `+${r.bonus_xp} XP! Вас пригласил(а) ${r.inviter_name}.`
            : lang === "en"
            ? `+${r.bonus_xp} XP! Invited by ${r.inviter_name}.`
            : `+${r.bonus_xp} XP! Sizni ${r.inviter_name} taklif qildi.`,
      });
      getReferral(userId).then(setData).catch(() => {});
    } catch (e) {
      const detail = (e as { detail?: string })?.detail;
      const msgs: Record<string, string> = {
        already_referred: lang === "ru" ? "Вы уже вводили код" : lang === "en" ? "You've already used a code" : "Siz allaqachon kod kiritgansiz",
        invalid_code: lang === "ru" ? "Неверный код" : lang === "en" ? "Invalid code" : "Kod noto'g'ri",
        self_referral: lang === "ru" ? "Нельзя ввести свой код" : lang === "en" ? "Can't use your own code" : "O'z kodingizni kirita olmaysiz",
      };
      setApplyMsg({ ok: false, text: msgs[detail ?? ""] ?? (lang === "ru" ? "Ошибка" : lang === "en" ? "Error" : "Xatolik") });
    } finally {
      setApplying(false);
    }
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" />
        {lang === "ru" ? "Назад" : lang === "en" ? "Back" : "Orqaga"}
      </button>
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-6 h-6 text-pink-500" />
        <h2 className="text-lg font-extrabold">{lang === "ru" ? "Пригласи друга" : lang === "en" ? "Invite a friend" : "Do'st taklif qiling"}</h2>
      </div>

      {!data ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-neutral-400" /></div>
      ) : (
        <div className="max-w-lg space-y-5">
          <div className="rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white p-5">
            <p className="text-sm opacity-90 mb-1">
              {lang === "ru" ? "Ваш код приглашения" : lang === "en" ? "Your invite code" : "Sizning taklif kodingiz"}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold tracking-widest">{data.code}</span>
              <button onClick={copyCode} className="ml-auto bg-white/20 hover:bg-white/30 rounded-xl p-2.5">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs opacity-90 mt-3">
              {lang === "ru"
                ? `Каждый друг = +${data.bonus_per_invite} XP вам обоим`
                : lang === "en"
                ? `Each friend = +${data.bonus_per_invite} XP for you both`
                : `Har bir do'st = ikkalangizga ham +${data.bonus_per_invite} XP`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 text-center">
              <div className="text-2xl font-extrabold text-pink-500">{data.invited_count}</div>
              <div className="text-xs text-neutral-500">{lang === "ru" ? "Приглашено" : lang === "en" ? "Invited" : "Taklif qilingan"}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 text-center">
              <div className="text-2xl font-extrabold text-amber-500">+{data.bonus_earned}</div>
              <div className="text-xs text-neutral-500">XP</div>
            </div>
          </div>

          <button
            onClick={() => window.open(`https://t.me/share/url?url=https://${SITE}&text=${encodeURIComponent(shareText)}`, "_blank")}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-white bg-sky-500 hover:bg-sky-600"
          >
            <Send className="w-4 h-4" />
            {lang === "ru" ? "Поделиться в Telegram" : lang === "en" ? "Share on Telegram" : "Telegram'da ulashish"}
          </button>

          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-sm font-bold mb-2">
              {lang === "ru" ? "Есть код друга?" : lang === "en" ? "Have a friend's code?" : "Do'stingizning kodi bormi?"}
            </p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent uppercase tracking-widest font-bold text-sm outline-none focus:border-pink-500"
              />
              <button
                onClick={submitCode}
                disabled={applying}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-pink-500 hover:bg-pink-600 text-sm disabled:opacity-60"
              >
                {applying ? "..." : lang === "ru" ? "Ввести" : lang === "en" ? "Apply" : "Kiritish"}
              </button>
            </div>
            {applyMsg && (
              <p className={`text-xs mt-2 font-semibold ${applyMsg.ok ? "text-emerald-600" : "text-red-500"}`}>{applyMsg.text}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
