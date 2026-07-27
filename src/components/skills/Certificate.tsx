"use client";

import { useEffect, useRef } from "react";
import { X, Download } from "lucide-react";

/**
 * Ilm AI's own certificate of completion for a subject finished 100%. It is the
 * platform's achievement record — clearly branded Ilm AI, not an official document of
 * any external institution — drawn on a canvas so it can be downloaded as an image.
 */
export default function Certificate({
  name,
  subject,
  lessons,
  onClose,
}: {
  name: string;
  subject: string;
  lessons: number;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = 1200, H = 848;
    c.width = W; c.height = H;

    // background + border
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#0d3b4f";
    ctx.lineWidth = 10;
    ctx.strokeRect(28, 28, W - 56, H - 56);
    ctx.strokeStyle = "#58CC02";
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 44, W - 88, H - 88);

    const center = (text: string, y: number, font: string, color: string) => {
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.fillText(text, W / 2, y);
    };

    center("ILM AI", 130, "bold 40px Georgia, serif", "#58CC02");
    center("TABRIKNOMA", 210, "bold 60px Georgia, serif", "#0d3b4f");
    center("Ushbu guvohnoma bilan tasdiqlanadiki,", 300, "26px Georgia, serif", "#475569");

    center(name, 380, "bold 52px Georgia, serif", "#0f172a");
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 300, 400);
    ctx.lineTo(W / 2 + 300, 400);
    ctx.stroke();

    center('"' + subject + '" fanini to\'liq yakunladi', 470, "30px Georgia, serif", "#475569");
    center(`${lessons} ta dars — barchasi muvaffaqiyatli o'zlashtirildi`, 520, "22px Georgia, serif", "#64748b");

    const dt = new Date().toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });
    center(dt, 660, "24px Georgia, serif", "#0f172a");
    center("Sana", 690, "18px Georgia, serif", "#94a3b8");

    center("Ilm AI — fanlarni boshidan oxirigacha", 760, "italic 20px Georgia, serif", "#94a3b8");
  }, [name, subject, lessons]);

  const download = () => {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.download = `sertifikat-${subject}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-black">Sertifikat</h3>
          <button onClick={onClose} aria-label="Yopish"><X className="h-5 w-5 text-neutral-400" /></button>
        </div>
        <canvas ref={canvasRef} className="w-full h-auto rounded-lg border border-neutral-200 dark:border-neutral-800" />
        <div className="flex justify-end mt-3">
          <button onClick={download} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm">
            <Download className="h-4 w-4" /> Yuklab olish (PNG)
          </button>
        </div>
      </div>
    </div>
  );
}
