"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Play, Square } from "lucide-react";
import { bandColor, formatBand } from "@/lib/ieltsBand";

export interface SpeakingPart {
  part: 1 | 2 | 3;
  /** "The examiner asks you about yourself, your home, work or studies…" */
  intro: string;
  topic: string;              // "Hairstyles"
  questions: string[];
  /** Part 2 cue-card prep/answer timings, in seconds. */
  prep_seconds?: number;
  speak_seconds?: number;
}

export interface SpeakingFeedback {
  band: number;
  fluency?: number;
  lexical?: number;
  grammar?: number;
  pronunciation?: number;
  feedback: string;
  transcript?: string;
}

function mmss(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * IELTS Speaking: the cue card on the left, a recorder on the right. Recording
 * uses MediaRecorder; the blob is handed to `onSubmit` for the backend's Gemini
 * rubric grader.
 */
export default function SpeakingExam({
  part,
  onSubmit,
}: {
  part: SpeakingPart;
  onSubmit?: (audio: Blob, seconds: number) => Promise<SpeakingFeedback>;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError("");
    setFeedback(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access was denied. Allow it in your browser to record.");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function submit() {
    if (!blobRef.current || !onSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      setFeedback(await onSubmit(blobRef.current, seconds));
    } catch {
      setError("Could not grade this recording. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
      {/* cue card */}
      <div className="overflow-y-auto pr-2 pt-4">
        <h2 className="text-2xl font-black mb-2">PART {part.part}</h2>
        <p className="text-sm mb-5">{part.intro}</p>

        <h3 className="font-black mb-2">EXAMPLE</h3>
        <h2 className="text-3xl font-black mb-4">{part.topic}</h2>

        <ul className="list-disc pl-6 space-y-2">
          {part.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>

        {part.part === 2 && (
          <div className="mt-5 text-sm text-slate-500 space-y-1">
            {part.prep_seconds && <p>You have {part.prep_seconds}s to prepare.</p>}
            {part.speak_seconds && <p>You should speak for {mmss(part.speak_seconds)}.</p>}
          </div>
        )}
      </div>

      {/* recorder */}
      <div className="overflow-y-auto pl-2 pt-4 border-l border-slate-200 dark:border-neutral-800">
        <div className="rounded-lg bg-slate-100 dark:bg-neutral-800 px-3 py-2 text-sm italic text-slate-500 mb-6">
          Record your answer, then submit it for an AI band estimate.
        </div>

        <div className="flex flex-col items-center gap-3">
          {audioUrl && (
            <audio controls src={audioUrl} className="w-full mb-2">
              Your browser does not support audio playback.
            </audio>
          )}

          <button
            onClick={recording ? stop : start}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg ${
              recording ? "bg-red-600" : "bg-slate-900"
            }`}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {recording ? <Square className="w-6 h-6" /> : <Mic className="w-7 h-7" />}
          </button>

          <div className="text-lg font-black tabular-nums">{mmss(seconds)}</div>
          <div className="text-sm text-slate-500">
            {recording ? "Recording… keep going!" : audioUrl ? "Ready to submit" : "Tap to record"}
          </div>

          {audioUrl && onSubmit && (
            <button
              onClick={submit}
              disabled={submitting}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Submit for Feedback
            </button>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </div>

        {feedback && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-slate-900 text-white">
              <span className="font-bold text-sm">Band Score</span>
              <span className="text-xl font-black" style={{ color: bandColor(feedback.band) }}>
                {formatBand(feedback.band)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Criterion label="Fluency & Coherence" value={feedback.fluency} />
              <Criterion label="Lexical Resource" value={feedback.lexical} />
              <Criterion label="Grammatical Range" value={feedback.grammar} />
              <Criterion label="Pronunciation" value={feedback.pronunciation} />
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line">{feedback.feedback}</p>
            {feedback.transcript && (
              <details className="rounded-xl border border-slate-200 dark:border-neutral-800 p-3">
                <summary className="text-xs font-bold text-slate-500 cursor-pointer">Transcript</summary>
                <p className="text-sm mt-2 whitespace-pre-line italic">{feedback.transcript}</p>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Criterion({ label, value }: { label: string; value?: number }) {
  if (value === undefined) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-neutral-800 px-3 py-2">
      <div className="text-slate-500">{label}</div>
      <div className="font-black text-base" style={{ color: bandColor(value) }}>
        {formatBand(value)}
      </div>
    </div>
  );
}
