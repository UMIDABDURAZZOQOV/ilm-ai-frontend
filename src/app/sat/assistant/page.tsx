"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Send, Loader2, Sparkles, Mic, ChevronRight, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { apiFetch } from "@/lib/api";
import { MarkdownText } from "@/components/MarkdownText";

// Specializes the shared assistant endpoint for the SAT without any backend change.
const SAT_SYSTEM =
  "You are an expert Digital SAT tutor on the Ilm AI platform. Help strictly with SAT prep: " +
  "Reading & Writing, Math, test strategy, timing, the 400–1600 scoring, and study plans. " +
  "Be clear, accurate and encouraging; use short worked examples. If a question is unrelated to " +
  "the SAT, gently steer the student back to SAT prep. Question: ";

const STARTERS = [
  { lead: "Quiz me", rest: "on SAT Math strategies" },
  { lead: "Explain", rest: "how to approach SAT Reading passages" },
  { lead: "Help me", rest: "build a study plan for the Digital SAT" },
  { lead: "Strategies", rest: "to improve my SAT score" },
  { lead: "Show me", rest: "a practice question on linear equations" },
];

interface Msg { role: "user" | "ai"; content: string }

export default function SatAssistantPage() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading || !user) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await apiFetch("/assistant/ask", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, question: SAT_SYSTEM + q, language: lang }),
      });
      setMessages((m) => [...m, { role: "ai", content: res.answer || "…" }]);
    } catch (err: any) {
      const msg =
        err?.status === 403
          ? "You've reached today's AI limit. Try again tomorrow or upgrade for more."
          : "Sorry, I couldn't respond right now. Please try again.";
      setMessages((m) => [...m, { role: "ai", content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  function startListening() {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US";
    rec.onresult = (e: any) => setInput(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  const empty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {empty ? (
        // ── Welcome / starters ──────────────────────────────────────────────
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#0d3b4f] to-teal-500 flex items-center justify-center shadow-lg mb-4">
            <GraduationCap className="h-10 w-10 text-amber-300" />
          </div>
          <h1 className="text-xl font-black">SAT AI Tutor</h1>
          <p className="text-slate-500 mt-1 mb-8">Ask me anything about your Digital SAT prep.</p>

          <div className="w-full max-w-xl space-y-1">
            {STARTERS.map((s) => (
              <button
                key={s.rest}
                onClick={() => send(`${s.lead} ${s.rest}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <span className="text-[15px]">
                  <span className="font-bold">{s.lead}</span>{" "}
                  <span className="text-slate-500">{s.rest}</span>
                </span>
                <ChevronRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-[#0d3b4f] dark:group-hover:text-amber-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        // ── Conversation ────────────────────────────────────────────────────
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
              <Sparkles className="h-4 w-4 text-amber-400" /> SAT AI Tutor
            </div>
            <button onClick={() => setMessages([])} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                m.role === "user"
                  ? "bg-[#0d3b4f] text-white whitespace-pre-wrap"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              }`}>
                {m.role === "user" ? m.content : <MarkdownText>{m.content}</MarkdownText>}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {/* Composer */}
      <div className="pt-2">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask the SAT tutor anything…"
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none max-h-40"
          />
          <button
            onClick={startListening}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${listening ? "bg-red-500 text-white" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            aria-label="Voice input"
          >
            <Mic className="h-5 w-5" />
          </button>
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="h-10 w-10 rounded-xl bg-[#0d3b4f] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-all"
            aria-label="Send"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-2">The SAT AI Tutor can make mistakes. Check important details.</p>
      </div>
    </div>
  );
}
