"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Send, Volume2, Trash2, Sparkles, Radio, FileText, ArrowRight, ImagePlus, X, Layers } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { textFlashcards, type Flashcard } from "@/lib/studioApi";
import {
  askAssistant,
  askAssistantImage,
  getAssistantBriefing,
  getAssistantMaterials,
  speakText,
  getAssistantHistory,
  clearAssistantHistory,
  type AssistantMessage,
  type AssistantAction,
} from "@/lib/assistantApi";
import LiveVoiceOverlay from "./LiveVoiceOverlay";
import { MarkdownText } from "@/components/MarkdownText";

// The chat carries a little more than the stored transcript: the companion may
// attach an in-app action button, cite which uploaded materials it used, and
// suggest follow-up questions.
type ChatMessage = AssistantMessage & {
  action?: AssistantAction | null;
  sources?: string[];
  followups?: string[];
};

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
  const [briefing, setBriefing] = useState<{ text: string; action: AssistantAction | null } | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [scopeFile, setScopeFile] = useState<string>(""); // "" = all materials
  const [pendingImage, setPendingImage] = useState<{ blob: Blob; preview: string } | null>(null);
  const [cardsByMsg, setCardsByMsg] = useState<Record<number, Flashcard[]>>({});
  const [cardsLoading, setCardsLoading] = useState<number | null>(null);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    // Proactive briefing + the learner's uploaded documents (for chat-with-a-doc).
    getAssistantBriefing(user.id)
      .then((d) => { if (!cancelled && d.briefing) setBriefing({ text: d.briefing, action: d.action }); })
      .catch(() => {});
    getAssistantMaterials(user.id)
      .then((d) => { if (!cancelled) setFiles(d.files || []); })
      .catch(() => {});
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
    if (sending) return;
    // An attached image takes the multimodal path (question optional).
    if (pendingImage) {
      return sendImage();
    }
    if (!input.trim()) return;
    const question = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setSending(true);
    try {
      const { answer, action, sources, followups } = await askAssistant(user.id, question, lang, scopeFile || null);
      setMessages((prev) => [...prev, { role: "assistant", content: answer, action, sources, followups }]);
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

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingImage({ blob: f, preview: URL.createObjectURL(f) });
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function sendImage() {
    if (!pendingImage) return;
    const question = input.trim();
    const img = pendingImage;
    setInput("");
    setPendingImage(null);
    setMessages((prev) => [...prev, { role: "user", content: question ? `🖼️ ${question}` : "🖼️" }]);
    setSending(true);
    try {
      const { answer, action, followups } = await askAssistantImage(user.id, question, lang, img.blob);
      setMessages((prev) => [...prev, { role: "assistant", content: answer, action, followups }]);
    } catch (err: any) {
      if (err?.status === 403) {
        alert(t("assistant_limit_reached"));
        onNavigate("subscription");
        setMessages((prev) => prev.slice(0, -1));
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: `${t("assistant_error_prefix")} ${err?.message ?? ""}` }]);
      }
    } finally {
      setSending(false);
    }
  }

  async function makeFlashcards(i: number, content: string) {
    if (cardsLoading !== null) return;
    setCardsLoading(i);
    try {
      const { flashcards } = await textFlashcards(user.id, content, lang);
      setCardsByMsg((prev) => ({ ...prev, [i]: flashcards }));
    } catch {
      /* silent — the answer is still on screen */
    } finally {
      setCardsLoading(null);
    }
  }

  function askFollowup(q: string) {
    setInput(q);
    // Send on the next tick so the input state is set for handleSend's guard.
    setTimeout(() => {
      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: q }]);
      setSending(true);
      askAssistant(user.id, q, lang, scopeFile || null)
        .then(({ answer, action, sources, followups }) =>
          setMessages((prev) => [...prev, { role: "assistant", content: answer, action, sources, followups }])
        )
        .catch((err: any) => {
          if (err?.status === 403) {
            alert(t("assistant_limit_reached"));
            onNavigate("subscription");
            setMessages((prev) => prev.slice(0, -1));
          } else {
            setMessages((prev) => [...prev, { role: "assistant", content: `${t("assistant_error_prefix")} ${err?.message ?? ""}` }]);
          }
        })
        .finally(() => setSending(false));
    }, 0);
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
          {/* Proactive daily briefing from the companion. */}
          {briefing && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary">Ilm AI</span>
              </div>
              <MarkdownText>{briefing.text}</MarkdownText>
              {briefing.action && (
                <Link href={briefing.action.href} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary text-white px-3 py-1.5 text-xs font-bold">
                  {briefing.action.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
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

                  {/* Suggested follow-up questions — only under the latest reply. */}
                  {msg.role === "assistant" && i === messages.length - 1 && msg.followups && msg.followups.length > 0 && !sending && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.followups.map((q, qi) => (
                        <button
                          key={qi}
                          onClick={() => askFollowup(q)}
                          className="text-left text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-3 py-1.5 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.role === "assistant" && (
                    <div className="mt-1 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleListenClick(i, msg.content)}
                        disabled={speakingIndex === i}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary disabled:opacity-100"
                      >
                        {speakingIndex === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-3 w-3" />}
                        {speakingIndex === i ? t("assistant_listening") : t("assistant_listen")}
                      </button>
                      {!cardsByMsg[i] && (
                        <button
                          onClick={() => makeFlashcards(i, msg.content)}
                          disabled={cardsLoading === i}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary"
                        >
                          {cardsLoading === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />}
                          {lang === "ru" ? "В карточки" : lang === "en" ? "To flashcards" : "Flashcard qil"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Generated flashcards from this answer. */}
                  {msg.role === "assistant" && cardsByMsg[i] && (
                    <div className="mt-2 space-y-1.5 w-full max-w-full">
                      {cardsByMsg[i].map((c, ci) => {
                        const key = `${i}-${ci}`;
                        return (
                          <button
                            key={ci}
                            onClick={() => setFlipped((f) => ({ ...f, [key]: !f[key] }))}
                            className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          >
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{c.front}</p>
                            {flipped[key] ? (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{c.back}</p>
                            ) : (
                              <p className="text-[11px] text-slate-400 mt-0.5">{lang === "ru" ? "Показать ответ" : lang === "en" ? "Reveal" : "Javobni ko'rish"}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
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
          {/* Scope the chat to one uploaded document, or all materials. */}
          {files.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={scopeFile}
                onChange={(e) => setScopeFile(e.target.value)}
                className="text-xs bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1.5 text-slate-600 dark:text-slate-300 max-w-full"
              >
                <option value="">{lang === "ru" ? "Все материалы" : lang === "en" ? "All materials" : "Barcha materiallar"}</option>
                {files.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}

          {/* Pending image preview. */}
          {pendingImage && (
            <div className="relative inline-block mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingImage.preview} alt="" className="h-20 rounded-xl border border-slate-200 dark:border-slate-700" />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-slate-700 text-white"
                aria-label="remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <input ref={imageInputRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
              aria-label={lang === "ru" ? "Прикрепить фото" : lang === "en" ? "Attach photo" : "Rasm biriktirish"}
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={pendingImage ? (lang === "ru" ? "Спросите об изображении..." : lang === "en" ? "Ask about the image..." : "Rasm haqida so'rang...") : t("assistant_placeholder")}
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
              disabled={(!input.trim() && !pendingImage) || sending}
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
