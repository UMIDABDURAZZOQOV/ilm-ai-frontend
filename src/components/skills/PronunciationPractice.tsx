"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2, Mic, Square, Volume2 } from "lucide-react";
import {
  getPronunciationPhrases,
  scorePronunciation,
  type PronunciationPhrase,
} from "@/lib/skillTreeApi";

/**
 * Pronunciation practice for the language subjects: a phrase is shown, the learner
 * says it, and Gemini scores how close the pronunciation was. The one thing text
 * practice can't teach. Uses the same MediaRecorder → base64 → Gemini path as IELTS
 * Speaking; a phone/laptop microphone is all it needs.
 */

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

const scoreColor = (s: number) => (s >= 80 ? "#22c55e" : s >= 55 ? "#f59e0b" : "#ef4444");

export default function PronunciationPractice({
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
  const [phrases, setPhrases] = useState<PronunciationPhrase[] | null>(null);
  const [language, setLanguage] = useState("");
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ heard: string; score: number; tip: string } | null>(null);
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    getPronunciationPhrases(userId, subjectSlug)
      .then((d) => { setPhrases(d.phrases); setLanguage(d.language); })
      .catch(() => setError("Iboralarni yuklab bo'lmadi."));
    return () => recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, [userId, subjectSlug]);

  const phrase = phrases?.[index];

  const speak = () => {
    if (!phrase || typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(phrase.text);
    u.lang = language === "Korean" ? "ko-KR" : language === "French" ? "fr-FR" : "en-US";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const startRec = async () => {
    setError("");
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 800 || !phrase) return;
        setBusy(true);
        try {
          const r = await scorePronunciation({
            user_id: userId,
            subject: subjectSlug,
            target_text: phrase.text,
            audio_base64: await toBase64(blob),
            mime_type: blob.type || "audio/webm",
          });
          setResult(r);
        } catch {
          setError("Baholab bo'lmadi. Yana urinib ko'ring.");
        } finally {
          setBusy(false);
        }
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Mikrofonga ruxsat bering.");
    }
  };

  const stopRec = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const next = () => {
    setResult(null);
    setError("");
    setIndex((i) => (phrases ? (i + 1) % phrases.length : 0));
  };

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ChevronLeft className="w-4 h-4" /> Orqaga
      </button>
      <h2 className="text-lg font-extrabold mb-1">Talaffuz mashqi · {subjectName}</h2>
      <p className="text-sm text-neutral-500 mb-6">Iborani ovoz chiqarib ayting — AI talaffuzingizni baholaydi.</p>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {!phrases && !error && <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
      {phrases && phrases.length === 0 && <p className="text-sm text-neutral-500">Hozircha ibora yo'q.</p>}

      {phrase && (
        <div className="rounded-3xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
          <div className="text-center mb-5">
            <div className="text-2xl font-black mb-1 flex items-center justify-center gap-2">
              {phrase.text}
              <button onClick={speak} className="text-neutral-400 hover:text-sky-500" title="Tinglash">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-neutral-500">{phrase.uz}</div>
          </div>

          <div className="flex justify-center mb-4">
            {busy ? (
              <div className="h-16 w-16 rounded-full grid place-items-center bg-neutral-100 dark:bg-neutral-800">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : recording ? (
              <button onClick={stopRec} className="h-16 w-16 rounded-full grid place-items-center bg-red-500 text-white animate-pulse">
                <Square className="w-6 h-6" fill="currentColor" />
              </button>
            ) : (
              <button onClick={startRec} className="h-16 w-16 rounded-full grid place-items-center bg-sky-500 text-white hover:bg-sky-600">
                <Mic className="w-7 h-7" />
              </button>
            )}
          </div>

          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <div className="text-4xl font-black" style={{ color: scoreColor(result.score) }}>{result.score}</div>
                <div className="text-sm text-neutral-500">/ 100</div>
              </div>
              <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${result.score}%`, background: scoreColor(result.score) }} />
              </div>
              {result.heard && <p className="text-xs text-neutral-500 text-center">Eshitildi: “{result.heard}”</p>}
              {result.tip && <p className="text-sm text-center">{result.tip}</p>}
            </div>
          )}

          <div className="flex justify-between items-center mt-5">
            <span className="text-xs text-neutral-400">{index + 1} / {phrases?.length}</span>
            <button onClick={next} className="text-sm font-bold px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
              Keyingisi →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
