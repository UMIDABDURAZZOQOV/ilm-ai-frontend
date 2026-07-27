"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Send, Volume2, Trash2, Sparkles, Radio, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import {
  askAssistant,
  speakText,
  getAssistantHistory,
  clearAssistantHistory,
  type AssistantMessage,
  type AssistantAction,
} from "@/lib/assistantApi";
import LiveVoiceOverlay from "./LiveVoiceOverlay";
import { MarkdownText } from "@/components/MarkdownText";

// The chat carries a little more than the stored transcript: the companion may
// attach an in-app action button and cite which uploaded materials it used.
type ChatMessage = AssistantMessage & { action?: AssistantAction | null; sources?: string[] };

interface User {
  id: number;
  name: string;
  email: string;
}

interface AssistantDashboardProps {
  user: User;
  onNavigate: (panelId: string) => void;
}

export default function AssistantDashboard({ user, onNavigate }: AssistantDashboardProps) {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [showLive, setShowLive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getAssistantHistory(user.id)
      .then((data) => {
        if (!cancelled) setMessages(data.history || []);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  function startListening() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert(t("assistant_speech_unsupported"));
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  }

  function speakWithBrowserFallback(text: string) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang === "uz" ? "uz" : lang === "ru" ? "ru" : "en";
    const preferred =
      voices.find((v) => v.lang.startsWith(langPrefix)) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  async function handleListenClick(index: number, content: string) {
    setSpeakingIndex(index);
    try {
      const { audio_base64 } = await speakText(content, lang);
      const audio = new Audio(`data:audio/mpeg;base64,${audio_base64}`);
      audio.onended = () => setSpeakingIndex(null);
      audio.onerror = () => {
        speakWithBrowserFallback(content);
        setSpeakingIndex(null);
      };
      await audio.play();
    } catch {
      speakWithBrowserFallback(content);
      setSpeakingIndex(null);
    }
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    const question = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setSending(true);
    try {
      const { answer, action, sources } = await askAssistant(user.id, question, lang);
      setMessages((prev) => [...prev, { role: "assistant", content: answer, action, sources }]);
    } catch (err: any) {
      if (err?.status === 403) {
        alert(t("assistant_limit_reached"));
        onNavigate("subscription");
        setMessages((prev) => prev.slice(0, -1));
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: `${t("assistant_error_prefix")} ${err.message}` }]);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleClearHistory() {
    if (!window.confirm(t("assistant_clear_confirm"))) return;
    try {
      await clearAssistantHistory(user.id);
      setMessages([]);
    } catch {
      // best-effort
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t("dash_assistant")}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLive(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-colors"
          >
            <Radio className="h-3.5 w-3.5" />
            {t("live_voice_button")}
          </button>
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("assistant_clear")}
            </button>
          )}
        </div>
      </div>

      {showLive && (
        <LiveVoiceOverlay
          userId={user.id}
          onClose={() => {
            setShowLive(false);
            getAssistantHistory(user.id)
              .then((data) => setMessages(data.history || []))
              .catch(() => {});
          }}
        />
      )}

      <div className="h-[calc(100vh-260px)] flex flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {historyLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
              <Sparkles className="h-10 w-10 mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm">{t("assistant_empty")}</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`group max-w-[80%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-tr-none whitespace-pre-wrap"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none"
                    }`}
                  >
                    {msg.role === "user" ? msg.content : <MarkdownText>{msg.content}</MarkdownText>}
                  </div>

                  {/* Materials the answer drew from (RAG). */}
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {msg.sources.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5"
                        >
                          <FileText className="h-3 w-3" /> {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggested in-app next step (routing/action). */}
                  {msg.role === "assistant" && msg.action && (
                    <Link
                      href={msg.action.href}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 text-xs font-bold transition-colors"
                    >
                      {msg.action.label} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}

                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handleListenClick(i, msg.content)}
                      disabled={speakingIndex === i}
                      className="mt-1 flex items-center gap-1 text-xs text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                    >
                      {speakingIndex === i ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Volume2 className="h-3 w-3" />
                      )}
                      {speakingIndex === i ? t("assistant_listening") : t("assistant_listen")}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t("assistant_placeholder")}
              className="flex-1 px-4 py-3 pr-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={startListening}
              className={`p-3 rounded-xl transition-colors ${
                isListening ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="p-3 rounded-xl bg-primary text-white disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
