"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { askAssistant, speakText } from "@/lib/assistantApi";

interface Props {
  userId: number;
  onClose: () => void;
}

type Phase = "listening" | "thinking" | "speaking" | "error";

const ORB_GRADIENT: Record<Phase, string> = {
  listening: "radial-gradient(circle at 35% 30%, #93c5fd, #6366f1 60%, #4338ca)",
  thinking: "radial-gradient(circle at 35% 30%, #c4b5fd, #8b5cf6 60%, #6d28d9)",
  speaking: "radial-gradient(circle at 35% 30%, #67e8f9, #06b6d4 55%, #4338ca)",
  error: "radial-gradient(circle at 35% 30%, #fca5a5, #ef4444 60%, #b91c1c)",
};

const ORB_ANIMATION: Record<Phase, { scale: number[]; rotate?: number[] }> = {
  listening: { scale: [1, 1.06, 1] },
  thinking: { scale: [1, 1.03, 1], rotate: [0, 8, -8, 0] },
  speaking: { scale: [1, 1.14, 1] },
  error: { scale: [1, 0.96, 1] },
};

/** Full-screen hands-free voice conversation with the AI Assistant — continuous
 * listen → think → speak loop, restarting automatically after each answer,
 * until the user closes it. Mirrors the mobile app's Live Voice mode.
 *
 * Driven by `recognition.onend` rather than `isFinal` in onresult — some
 * browsers' SpeechRecognition never fires a final result (just silently
 * ends), which previously left the UI stuck on "listening" forever. `onend`
 * always fires when the recognizer stops, for any reason, so it's the only
 * reliable place to decide what happens next. */
export default function LiveVoiceOverlay({ userId, onClose }: Props) {
  const { lang, t } = useI18n();
  const [phase, setPhase] = useState<Phase>("listening");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stoppedRef = useRef(false);
  const latestTranscriptRef = useRef("");
  const endHandledRef = useRef(false);

  const speakBrowserFallback = useCallback((text: string, onDone: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang === "uz" ? "uz" : lang === "ru" ? "ru" : "en";
    const preferred =
      voices.find((v) => v.lang.startsWith(langPrefix)) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onend = onDone;
    utterance.onerror = onDone;
    window.speechSynthesis.speak(utterance);
  }, [lang]);

  async function handleFinalTranscript(text: string) {
    if (stoppedRef.current) return;
    setPhase("thinking");
    try {
      const { answer } = await askAssistant(userId, text, lang);
      if (stoppedRef.current) return;
      playAnswer(answer);
    } catch (err: any) {
      if (stoppedRef.current) return;
      if (err?.status === 403) {
        alert(t("assistant_limit_reached"));
        handleClose();
        return;
      }
      setPhase("error");
      setTimeout(() => {
        if (!stoppedRef.current) startListening();
      }, 1500);
    }
  }

  async function playAnswer(answer: string) {
    setPhase("speaking");
    try {
      const { audio_base64 } = await speakText(answer, lang);
      if (stoppedRef.current) return;
      const audio = new Audio(`data:audio/mpeg;base64,${audio_base64}`);
      audioRef.current = audio;
      audio.onended = () => {
        if (!stoppedRef.current) startListening();
      };
      audio.onerror = () => speakBrowserFallback(answer, () => !stoppedRef.current && startListening());
      await audio.play();
    } catch {
      if (!stoppedRef.current) speakBrowserFallback(answer, () => !stoppedRef.current && startListening());
    }
  }

  const startListening = useCallback(() => {
    if (stoppedRef.current) return;
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert(t("assistant_speech_unsupported"));
      onClose();
      return;
    }
    setPhase("listening");
    setTranscript("");
    latestTranscriptRef.current = "";
    endHandledRef.current = false;

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
      setTranscript(text);
      latestTranscriptRef.current = text;
    };

    recognition.onerror = (event: any) => {
      if (stoppedRef.current) return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        stoppedRef.current = true;
        alert(t("mic_permission_denied"));
        onClose();
      }
      // Other errors (no-speech, aborted, network) — let onend drive what happens next.
    };

    // The only reliable "this listening turn is over" signal — fires whether
    // recognition finished normally, errored, or timed out on silence.
    recognition.onend = () => {
      if (stoppedRef.current || endHandledRef.current) return;
      endHandledRef.current = true;
      const text = latestTranscriptRef.current.trim();
      if (!text) {
        startListening();
      } else {
        handleFinalTranscript(text);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // start() throws if a recognition session is already active — safe to ignore.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function handleClose() {
    stoppedRef.current = true;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
    audioRef.current?.pause();
    window.speechSynthesis.cancel();
    onClose();
  }

  useEffect(() => {
    // Reset — React's Strict Mode (dev only) mounts every effect twice
    // (mount → cleanup → mount again) to surface bugs like this one. Without
    // this reset, the first mount's cleanup permanently sets stoppedRef to
    // true, and the second (real) mount's startListening() call sees that
    // and silently no-ops — leaving the UI stuck on "listening" forever
    // with a dead recognition object underneath it.
    stoppedRef.current = false;
    startListening();
    return () => {
      stoppedRef.current = true;
      try {
        recognitionRef.current?.stop();
      } catch {
        /* already stopped */
      }
      audioRef.current?.pause();
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phaseLabel =
    phase === "listening"
      ? t("live_listening")
      : phase === "thinking"
      ? t("live_thinking")
      : phase === "speaking"
      ? t("live_speaking")
      : t("live_error");

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col">
      <div className="flex items-center justify-between p-6">
        <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-bold text-slate-700 dark:text-slate-200">
          Live
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
        <motion.div
          className="rounded-full shadow-2xl"
          style={{ width: 220, height: 220, background: ORB_GRADIENT[phase] }}
          animate={ORB_ANIMATION[phase]}
          transition={{ duration: phase === "speaking" ? 0.7 : phase === "thinking" ? 1.1 : 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <p className="text-sm font-semibold text-slate-400">{phaseLabel}</p>
        {transcript && phase === "listening" && (
          <p className="text-center text-slate-500 dark:text-slate-300 text-base max-w-md">{transcript}</p>
        )}
      </div>

      <div className="p-10 flex items-center justify-center">
        <button
          onClick={handleClose}
          className="h-16 w-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
