"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Flag, ArrowLeft, Sparkles, Send } from "lucide-react";
import type { Question } from "@/lib/satIeltsApi";
import { askAssistant } from "@/lib/assistantApi";
import { MathText } from "@/components/MathText";
import { MarkdownText } from "@/components/MarkdownText";

// OnePrep-style single-question practice (Bluebook look): browse the question
// bank one item at a time — passage on the left, question + A–D choices on the
// right, check the answer for an inline verdict + explanation, and an AI tutor
// below. Untimed; Previous/Next moves through the fetched set.

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function optionLetter(opt: string, i: number): string {
  const m = opt.match(/^([A-F])[\).]/);
  return m ? m[1] : LETTERS[i];
}
function optionBody(opt: string): string {
  return opt.replace(/^([A-F])[\).]\s*/, "");
}

export default function BluebookPractice({
  questions,
  userId,
  title,
  language,
  onExit,
}: {
  questions: Question[];
  userId: number;
  title: string;
  language: string;
  onExit: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMsgs, setAiMsgs] = useState<Record<number, { role: "user" | "ai"; text: string }[]>>({});
  const [aiLoading, setAiLoading] = useState(false);

  const q = questions[idx];
  const isChecked = !!checked[q?.id];
  const picked = selected[q?.id];
  const isCorrect = picked != null && picked === q?.correct_answer;
  const msgs = aiMsgs[q?.id] ?? [];

  const passage = useMemo(() => q?.passage?.trim() || "", [q]);

  if (!q) {
    return (
      <div className="text-center py-16 text-op-slate">
        No questions available for this topic yet.
        <div className="mt-4">
          <button onClick={onExit} className="text-op-blue font-bold">‹ Back to Question Bank</button>
        </div>
      </div>
    );
  }

  function pick(opt: string) {
    if (isChecked) return;
    setSelected((s) => ({ ...s, [q.id]: opt }));
  }
  function check() {
    if (picked == null) return;
    setChecked((c) => ({ ...c, [q.id]: true }));
  }
  function go(delta: number) {
    const next = Math.min(questions.length - 1, Math.max(0, idx + delta));
    setIdx(next);
    setAiOpen(false);
  }
  function toggleFlag() {
    setFlagged((prev) => {
      const n = new Set(prev);
      n.has(q.id) ? n.delete(q.id) : n.add(q.id);
      return n;
    });
  }
  async function sendAi(preset?: string) {
    const question = (preset ?? aiInput).trim();
    if (!question || aiLoading) return;
    setAiInput("");
    setAiMsgs((m) => ({ ...m, [q.id]: [...(m[q.id] ?? []), { role: "user", text: question }] }));
    setAiLoading(true);
    try {
      const context = `SAT question I'm working on:\n${q.question_text}\n${q.options ? "Options:\n" + q.options.join("\n") : ""}\n\nMy question: ${question}`;
      const res = await askAssistant(userId, context, language);
      setAiMsgs((m) => ({ ...m, [q.id]: [...(m[q.id] ?? []), { role: "ai", text: res.answer }] }));
    } catch (e: any) {
      setAiMsgs((m) => ({ ...m, [q.id]: [...(m[q.id] ?? []), { role: "ai", text: e?.detail || "Sorry, I couldn't answer right now." }] }));
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onExit} className="flex items-center gap-1.5 text-[14px] font-bold text-op-slate hover:text-op-ink">
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
        <span className="text-[13.5px] font-bold text-op-muted truncate max-w-[40%]">{title}</span>
        <span className="ml-auto text-[13px] font-bold text-op-muted">Question {idx + 1} of {questions.length}</span>
        <span className={`text-[12.5px] font-bold px-2.5 py-1 rounded-full ${
          q.difficulty === "easy" ? "bg-[#E6F6EC] text-[#1F8A5B]" : q.difficulty === "hard" ? "bg-[#FBEAEA] text-[#D14343]" : "bg-[#FFF3C4] text-[#8A6D00]"
        }`}>{q.difficulty}</span>
      </div>

      {/* Question card */}
      <div className={`border border-op-line rounded-[16px] overflow-hidden grid ${passage ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {passage && (
          <div className="p-6 lg:border-r border-op-line lg:max-h-[560px] lg:overflow-y-auto">
            <div className="text-[12px] font-extrabold tracking-widest text-op-muted uppercase mb-2">Passage</div>
            <MathText className="font-serif-sat text-[16.5px] leading-[1.75] text-op-ink whitespace-pre-line">{passage}</MathText>
          </div>
        )}
        <div className="p-6 flex flex-col gap-4">
          {/* Q header */}
          <div className="flex items-center gap-3 bg-op-panel2 rounded-lg px-3 py-2">
            <span className="bg-op-ink text-white text-[14px] font-extrabold w-[30px] h-[30px] flex items-center justify-center rounded-md">{idx + 1}</span>
            <button
              onClick={toggleFlag}
              className={`flex items-center gap-1.5 text-[13.5px] font-bold ${flagged.has(q.id) ? "text-[#D6317E]" : "text-op-slate hover:text-op-ink"}`}
            >
              <Flag className="h-3.5 w-3.5" fill={flagged.has(q.id) ? "currentColor" : "none"} /> Mark for Review
            </button>
          </div>

          {/* Prompt */}
          <MathText className="font-serif-sat text-[16.5px] leading-[1.6] font-semibold text-op-ink">{q.question_text}</MathText>

          {/* Choices */}
          {q.options ? (
            <div className="flex flex-col gap-2.5">
              {q.options.map((opt, oi) => {
                const sel = picked === opt;
                const showCorrect = isChecked && opt === q.correct_answer;
                const showWrong = isChecked && sel && !isCorrect;
                return (
                  <button
                    key={opt}
                    onClick={() => pick(opt)}
                    disabled={isChecked}
                    className={`flex gap-3 items-start text-left rounded-[10px] px-3.5 py-3 border-[1.5px] transition-colors ${
                      showCorrect ? "border-[#1F8A5B] bg-[#E7F4EE]"
                      : showWrong ? "border-[#D14343] bg-[#FBEAEA]"
                      : sel ? "border-op-blue bg-op-sky/60"
                      : "border-op-line hover:border-op-faint"
                    }`}
                  >
                    <span className={`shrink-0 w-[26px] h-[26px] rounded-full border-[1.5px] flex items-center justify-center text-[13px] font-extrabold ${
                      showCorrect ? "border-[#1F8A5B] bg-[#1F8A5B] text-white"
                      : showWrong ? "border-[#D14343] bg-[#D14343] text-white"
                      : sel ? "border-op-blue bg-op-blue text-white"
                      : "border-op-faint text-op-slate"
                    }`}>{optionLetter(opt, oi)}</span>
                    <MathText className="font-serif-sat text-[15.5px] leading-[1.5] text-op-ink flex-1">{optionBody(opt)}</MathText>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-[14px] text-op-slate italic">Open-ended question — check the explanation for the model answer.</div>
          )}

          {/* Verdict */}
          {isChecked && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-[12px] border px-4 py-3.5 text-[14.5px] leading-[1.6] ${isCorrect ? "bg-[#E7F4EE] border-[#BCE3D0]" : "bg-[#FBEAEA] border-[#F2C6C6]"}`}
            >
              <b className={isCorrect ? "text-[#1F8A5B]" : "text-[#D14343]"}>
                {isCorrect ? "Correct! " : "Incorrect. "}
              </b>
              {!isCorrect && q.correct_answer && (
                <span className="text-op-ink">Correct answer: <b>{optionBody(q.correct_answer)}</b>. </span>
              )}
              {q.explanation && <MathText className="text-[#33373E]">{q.explanation}</MathText>}
            </motion.div>
          )}
        </div>
      </div>

      {/* AI tutor */}
      <div className="border border-op-line rounded-[16px] p-4 sm:p-5">
        {!aiOpen && msgs.length === 0 ? (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-9 h-9 rounded-full bg-op-sky flex items-center justify-center"><Sparkles className="h-4 w-4 text-op-skyText" /></span>
            <span className="font-extrabold text-[15px]">AI Tutor</span>
            <button onClick={() => { setAiOpen(true); sendAi("Explain this step by step."); }} className="ml-auto bg-[#8B3DE8] hover:bg-[#7A2FD6] text-white text-[13.5px] font-extrabold px-4 py-2 rounded-full transition-colors">🤖 Explain step by step</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-op-sky flex items-center justify-center"><Sparkles className="h-4 w-4 text-op-skyText" /></span>
              <span className="font-extrabold text-[15px]">AI Tutor</span>
            </div>
            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto">
              {msgs.map((m, i) => (
                m.role === "user" ? (
                  <div key={i} className="self-end bg-op-sky text-op-ink rounded-[12px] px-3.5 py-2 text-[14px] font-semibold max-w-[85%]">{m.text}</div>
                ) : (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-op-sky flex items-center justify-center"><Sparkles className="h-3.5 w-3.5 text-op-skyText" /></span>
                    <MarkdownText className="text-[14px] leading-[1.65] text-op-ink flex-1 min-w-0">{m.text}</MarkdownText>
                  </div>
                )
              ))}
              {aiLoading && <div className="flex items-center gap-2 text-op-muted text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</div>}
            </div>
            <div className="flex gap-2">
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAi()}
                placeholder="Ask a question about this problem…"
                className="flex-1 border border-op-line bg-op-panel rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none focus:border-op-blue"
              />
              <button onClick={() => sendAi()} disabled={aiLoading} className="w-10 h-10 rounded-full bg-op-ink text-white flex items-center justify-center disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <button onClick={() => go(-1)} disabled={idx === 0} className="border border-op-line text-op-ink text-[13.5px] font-extrabold px-5 py-2.5 rounded-full disabled:opacity-40 hover:bg-op-panel transition-colors">Previous</button>
        {!isChecked ? (
          <button onClick={check} disabled={picked == null} className="bg-op-blue hover:bg-op-blueHover text-white text-[14px] font-extrabold px-6 py-2.5 rounded-full disabled:opacity-40 transition-colors">Check answer</button>
        ) : (
          <button onClick={() => { setAiOpen(true); if (msgs.length === 0) sendAi("Explain this step by step."); }} className="bg-op-panel text-op-ink text-[13.5px] font-extrabold px-5 py-2.5 rounded-full hover:bg-[#E2E8EB] transition-colors">☰ Explanation</button>
        )}
        <div className="flex-1" />
        <button onClick={() => go(1)} disabled={idx >= questions.length - 1} className="bg-op-ink text-white text-[14px] font-extrabold px-6 py-2.5 rounded-full disabled:opacity-40 hover:bg-[#2B2E35] transition-colors">Next ›</button>
      </div>
    </div>
  );
}
