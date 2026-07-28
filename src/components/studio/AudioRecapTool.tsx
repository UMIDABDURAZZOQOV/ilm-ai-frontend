"use client";

import { useRef, useState } from "react";
import { Headphones, Loader2, Play, Square } from "lucide-react";
import { audioRecap } from "@/lib/studioApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

export default function AudioRecapTool({ lang, userId }: { lang: string; userId: number }) {
  const [busy, setBusy] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function stop() {
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setPlaying(false);
  }

  function playScript(text: string, b64: string | null) {
    stop();
    if (b64) {
      const audio = new Audio(`data:audio/mpeg;base64,${b64}`);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.play().then(() => setPlaying(true)).catch(() => fallbackSpeak(text));
    } else {
      fallbackSpeak(text);
    }
  }

  // No ElevenLabs audio (missing key / quota) → read it with the browser's voice.
  function fallbackSpeak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.98;
    u.onend = () => setPlaying(false);
    window.speechSynthesis.speak(u);
    setPlaying(true);
  }

  async function build() {
    setBusy(true);
    setError("");
    try {
      const r = await audioRecap(userId, lang);
      setScript(r.script);
      playScript(r.script, r.audio_base64);
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      setError(err?.detail === "no_materials" || err?.status === 400 ? "no_materials" : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">{tr(lang, "Eshitiladigan konspekt", "Аудио-конспект", "Audio recap")}</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {tr(lang, "Materialingizdan qisqa ovozli bayon — yo'lda tinglang.", "Короткий аудио-пересказ материала — слушайте в дороге.", "A short spoken recap of your material — listen on the go.")}
      </p>

      {!script ? (
        <button onClick={build} disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Headphones className="w-4 h-4" />}
          {busy ? tr(lang, "Tayyorlanyapti...", "Готовится...", "Preparing...") : tr(lang, "Konspekt yaratish", "Создать конспект", "Create recap")}
        </button>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => (playing ? stop() : playScript(script, null))}
            className="w-full py-3 rounded-2xl font-bold text-white bg-violet-600 hover:bg-violet-700 flex items-center justify-center gap-2"
          >
            {playing ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {playing ? tr(lang, "To'xtatish", "Стоп", "Stop") : tr(lang, "Tinglash", "Слушать", "Listen")}
          </button>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed whitespace-pre-line">{script}</p>
          </div>
        </div>
      )}

      {error === "no_materials" && <p className="text-sm text-amber-600 mt-3">{tr(lang, "Avval Dashboard'da material yuklang.", "Сначала загрузите материал.", "Upload material first.")}</p>}
      {error === "failed" && <p className="text-sm text-red-500 mt-3">{tr(lang, "Bo'lmadi — qayta urinib ko'ring.", "Не удалось — попробуйте снова.", "Couldn't build it — try again.")}</p>}
    </div>
  );
}
