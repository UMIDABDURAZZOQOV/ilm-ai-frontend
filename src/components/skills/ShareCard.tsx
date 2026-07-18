"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, Download, Send } from "lucide-react";
import type { GamificationSummary } from "@/lib/skillTreeApi";

const SITE = "ilm-ai-edu.vercel.app";

/** Canvas-drawn progress card the student can download or share to Telegram —
 * free marketing, zero API cost. */
export default function ShareCard({
  lang,
  userName,
  summary,
  onBack,
}: {
  lang: string;
  userName: string;
  summary: GamificationSummary | null;
  onBack: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 720;
    const H = 400;
    canvas.width = W;
    canvas.height = H;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#12b76a");
    grad.addColorStop(1, "#0ea5e9");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 28);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.arc(W - 70, 70, 130, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px 'Segoe UI', sans-serif";
    ctx.fillText("Ilm AI — Milliy Sertifikat", 44, 66);

    ctx.font = "600 22px 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(userName, 44, 108);

    ctx.font = "72px 'Segoe UI', sans-serif";
    ctx.fillText("🦉", W - 120, 120);

    const stats: [string, string][] = [
      [`${summary?.xp_total ?? 0} XP`, lang === "ru" ? "всего опыта" : lang === "en" ? "total XP" : "jami tajriba"],
      [`${summary?.streak_days ?? 0} 🔥`, lang === "ru" ? "дней подряд" : lang === "en" ? "day streak" : "kunlik seriya"],
    ];
    stats.forEach(([big, small], i) => {
      const x = 44 + i * 220;
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.beginPath();
      ctx.roundRect(x, 160, 200, 120, 20);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px 'Segoe UI', sans-serif";
      ctx.fillText(big, x + 22, 218);
      ctx.font = "500 17px 'Segoe UI', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(small, x + 22, 252);
    });

    ctx.font = "600 20px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      lang === "ru" ? "Учись вместе со мной!" : lang === "en" ? "Study with me!" : "Men bilan birga o'qi!",
      44,
      330
    );
    ctx.font = "bold 20px 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText(`https://${SITE}`, 44, 362);
  }, [userName, summary, lang]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "ilm-ai-progress.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  function shareTelegram() {
    const text =
      lang === "ru"
        ? `Я набрал ${summary?.xp_total ?? 0} XP и учусь ${summary?.streak_days ?? 0} дней подряд в Ilm AI! Присоединяйся:`
        : lang === "en"
        ? `I earned ${summary?.xp_total ?? 0} XP with a ${summary?.streak_days ?? 0}-day streak on Ilm AI! Join me:`
        : `Men Ilm AI'da ${summary?.xp_total ?? 0} XP to'pladim va ${summary?.streak_days ?? 0} kunlik seriyadaman! Sen ham qo'shil:`;
    window.open(`https://t.me/share/url?url=https://${SITE}&text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" />
        {lang === "ru" ? "Назад" : lang === "en" ? "Back" : "Orqaga"}
      </button>
      <h2 className="text-lg font-extrabold mb-4">
        {lang === "ru" ? "Поделиться прогрессом" : lang === "en" ? "Share your progress" : "Natijangizni ulashing"}
      </h2>
      <canvas ref={canvasRef} className="w-full max-w-xl rounded-3xl shadow-lg" />
      <div className="flex gap-3 mt-4">
        <button onClick={download} className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 text-sm">
          <Download className="w-4 h-4" />
          {lang === "ru" ? "Скачать" : lang === "en" ? "Download" : "Yuklab olish"}
        </button>
        <button onClick={shareTelegram} className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white bg-sky-500 hover:bg-sky-600 text-sm">
          <Send className="w-4 h-4" />
          Telegram
        </button>
      </div>
    </div>
  );
}
