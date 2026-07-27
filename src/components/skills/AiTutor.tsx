"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Send, Volume2, Square } from "lucide-react";
import { explainQuestion, tutorChat, type TutorMessage } from "@/lib/skillTreeApi";
import { speakText } from "@/lib/assistantApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

/**
 * On-demand AI tutor, now a continuing chat. The first tap fetches an explanation;
 * after that the learner can keep asking follow-up questions about the same problem
 * and the tutor answers in context. Every call is user-initiated, so API cost stays
 * tied to real use, and the whole thread lives in local state.
 */
export default function AiTutor({
  lang,
  questionText,
  options,
  correctAnswer,
  userAnswer,
}: {
  lang: string;
  questionText: string;
  options?: string[] | null;
  correctAnswer: string;
  userAnswer?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  // Which assistant message is currently being read aloud (index), and whether
  // its audio is still being fetched. Only one plays at a time.
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollDown = () =>
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }));

  function stopAudio() {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeakingIdx(null);
    setLoadingIdx(null);
  }

  // Read a tutor reply aloud via ElevenLabs. Tapping again (or another message)
  // stops the current playback first. On any TTS failure we just stay silent —
  // the text is already on screen, so nothing is lost.
  async function speak(text: string, idx: number) {
    if (speakingIdx === idx || loadingIdx === idx) {
      stopAudio();
      return;
    }
    stopAudio();
    setLoadingIdx(idx);
    try {
      const r = await speakText(text, lang);
      const audio = new Audio(`data:audio/mpeg;base64,${r.audio_base64}`);
      audioRef.current = audio;
      audio.onended = () => setSpeakingIdx((cur) => (cur === idx ? null : cur));
      audio.onerror = () => stopAudio();
      await audio.play();
      setSpeakingIdx(idx);
    } catch {
      // silent fallback — the explanation is still readable on screen
    } finally {
      setLoadingIdx((cur) => (cur === idx ? null : cur));
    }
  }

  async function explain() {
    if (loading || messages.length) return;
    setLoading(true);
    setError(false);
    try {
      const r = await explainQuestion({
        question_text: questionText,
        options,
        correct_answer: correctAnswer,
        user_answer: userAnswer,
        lang,
      });
      setMessages([{ role: "assistant", content: r.explanation }]);
      scrollDown();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const next: TutorMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(false);
    try {
      const r = await tutorChat({
        question_text: questionText,
        options,
        correct_answer: correctAnswer,
        messages: next,
        lang,
      });
      setMessages([...next, { role: "assistant", content: r.reply }]);
    } catch {
      setError(true);
    } finally {
      setSending(false);
      scrollDown();
    }
  }

  // Before the first explanation — just the button.
  if (!messages.length) {
    return (
      <div className="mt-2">
        <button
          onClick={explain}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-violet-600 dark:text-violet-300 bg-violet-100 dark:bg-violet-950 hover:bg-violet-200 dark:hover:bg-violet-900 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading
            ? tr(lang, "O'ylayapti...", "Думает...", "Thinking...")
            : tr(lang, "🤔 Tushuntirib ber", "🤔 Объясни", "🤔 Explain this")}
        </button>
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 mt-1">
              {tr(lang, "Hozir bo'lmadi, qayta urinib ko'ring", "Не получилось, попробуйте снова", "Couldn't load, try again")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-3 rounded-2xl border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950 p-3"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
        <span className="text-xs font-bold text-violet-600 dark:text-violet-300">
          {tr(lang, "AI repetitor", "AI репетитор", "AI tutor")}
        </span>
      </div>

      <div ref={scrollRef} className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            {m.role === "assistant" ? (
              <div className="flex items-start gap-1.5">
                <button
                  onClick={() => speak(m.content, i)}
                  className="mt-0.5 shrink-0 text-violet-500 hover:text-violet-600 disabled:opacity-50"
                  aria-label={
                    speakingIdx === i
                      ? tr(lang, "To'xtatish", "Остановить", "Stop")
                      : tr(lang, "Ovoz bilan o'qish", "Озвучить", "Read aloud")
                  }
                >
                  {loadingIdx === i ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : speakingIdx === i ? (
                    <Square className="w-4 h-4 fill-current" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <p className="text-sm leading-relaxed whitespace-pre-line text-neutral-700 dark:text-neutral-200">
                  {m.content}
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-line rounded-xl px-3 py-2 bg-violet-600 text-white max-w-[85%]">
                {m.content}
              </p>
            )}
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-1.5 text-xs text-violet-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {tr(lang, "Yozyapti...", "Печатает...", "Typing...")}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">
          {tr(lang, "Hozir bo'lmadi, qayta urinib ko'ring", "Не получилось", "Couldn't load")}
        </p>
      )}

      {/* Follow-up input */}
      <div className="flex items-center gap-2 mt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={sending}
          placeholder={tr(lang, "Yana savol bering...", "Задайте вопрос...", "Ask a follow-up...")}
          className="flex-1 rounded-xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="p-2 rounded-xl bg-violet-600 text-white disabled:opacity-50"
          aria-label={tr(lang, "Yuborish", "Отправить", "Send")}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
