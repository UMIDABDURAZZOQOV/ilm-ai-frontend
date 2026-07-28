"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Loader2, Play, Square } from "lucide-react";
import { generatePodcast, type PodcastLine } from "@/lib/studioApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

export default function PodcastTool({ lang, userId }: { lang: string; userId: number }) {
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [script, setScript] = useState<PodcastLine[] | null>(null);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(-1);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const stopRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  async function build() {
    setBusy(true);
    setError("");
    setScript(null);
    try {
      const r = await generatePodcast(userId, lang, undefined);
      setTitle(r.title);
      setScript(r.script);
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      setError(err?.detail === "no_materials" || err?.status === 400 ? "no_materials" : "failed");
    } finally {
      setBusy(false);
    }
  }

  function stop() {
    stopRef.current = true;
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setCurrent(-1);
  }

  // Two distinct browser voices (fallback: same voice, different pitch) so the
  // two hosts sound different — no audio-API quota involved.
  function voiceFor(speaker: "A" | "B") {
    const vs = voicesRef.current;
    if (vs.length >= 2) return speaker === "A" ? vs[0] : vs[1];
    return vs[0] || null;
  }

  async function play() {
    if (!script || !window.speechSynthesis) return;
    stopRef.current = false;
    setPlaying(true);
    for (let i = 0; i < script.length; i++) {
      if (stopRef.current) break;
      setCurrent(i);
      await new Promise<void>((resolve) => {
        const u = new SpeechSynthesisUtterance(script[i].text);
        const v = voiceFor(script[i].speaker);
        if (v) u.voice = v;
        u.pitch = script[i].speaker === "A" ? 1.05 : 0.9;
        u.rate = 1;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      });
    }
    setPlaying(false);
    setCurrent(-1);
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">{tr(lang, "AI podkast", "AI-подкаст", "AI podcast")}</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {tr(lang, "Materialingizni ikki suhbatdosh podkastiga aylantiring — tinglab o'rganing.", "Превратите материал в подкаст с двумя ведущими.", "Turn your material into a two-host podcast you can listen to.")}
      </p>

      {!script ? (
        <button onClick={build} disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
          {busy ? tr(lang, "Yozilyapti...", "Создаётся...", "Writing...") : tr(lang, "Podkast yasash", "Создать подкаст", "Create podcast")}
        </button>
      ) : (
        <div>
          {title && <h3 className="font-extrabold mb-2">{title}</h3>}
          <button
            onClick={() => (playing ? stop() : play())}
            className="w-full py-3 mb-3 rounded-2xl font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 flex items-center justify-center gap-2"
          >
            {playing ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {playing ? tr(lang, "To'xtatish", "Стоп", "Stop") : tr(lang, "Tinglash", "Слушать", "Listen")}
          </button>
          <div className="space-y-2">
            {script.map((l, i) => (
              <div key={i} className={`flex gap-2 ${l.speaker === "A" ? "" : "flex-row-reverse"}`}>
                <div className={`h-7 w-7 rounded-full grid place-items-center text-[11px] font-black text-white shrink-0 ${l.speaker === "A" ? "bg-fuchsia-500" : "bg-indigo-500"}`}>
                  {l.speaker}
                </div>
                <p className={`text-sm rounded-2xl px-3 py-2 max-w-[85%] ${i === current ? "ring-2 ring-fuchsia-400" : ""} ${l.speaker === "A" ? "bg-fuchsia-50 dark:bg-fuchsia-950/40" : "bg-indigo-50 dark:bg-indigo-950/40"} text-neutral-700 dark:text-neutral-200`}>
                  {l.text}
                </p>
              </div>
            ))}
          </div>
          <button onClick={build} disabled={busy} className="mt-3 text-sm font-bold text-fuchsia-500 hover:text-fuchsia-600 disabled:opacity-50">
            {tr(lang, "Yangi epizod", "Новый эпизод", "New episode")}
          </button>
        </div>
      )}

      {error === "no_materials" && <p className="text-sm text-amber-600 mt-3">{tr(lang, "Avval material yuklang.", "Сначала загрузите материал.", "Upload material first.")}</p>}
      {error === "failed" && <p className="text-sm text-red-500 mt-3">{tr(lang, "Bo'lmadi — qayta urinib ko'ring.", "Не удалось — попробуйте снова.", "Couldn't build it — try again.")}</p>}
    </div>
  );
}
