"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import {
  getSkillTree,
  listQuestions,
  type SkillTreeResponse,
  type SkillProgress,
  type Question,
} from "@/lib/satIeltsApi";
import BluebookPractice from "./BluebookPractice";

export default function QuestionBankPage() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [tree, setTree] = useState<SkillTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // OnePrep-style single-question practice opened from a topic/skill.
  const [practice, setPractice] = useState<{ questions: Question[]; title: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getSkillTree(user.id, "SAT")
      .then((d) => !cancelled && setTree(d))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Open the Bluebook-style browser for a domain (optionally narrowed to a skill).
  async function handleStart(domain: string, skill: string | null, key: string) {
    if (!user || starting) return;
    setStarting(key);
    setError(null);
    try {
      const res = await listQuestions({ exam_type: "SAT", domain, limit: 100 });
      let qs = res.questions;
      if (skill) qs = qs.filter((q) => q.skill === skill);
      if (qs.length === 0) qs = res.questions; // fall back to the whole domain
      if (qs.length === 0) {
        setError("No questions available for this topic yet.");
        setStarting(null);
        return;
      }
      setPractice({ questions: qs, title: skill || domain });
    } catch (err: any) {
      setError(err.message || "Could not load questions.");
    } finally {
      setStarting(null);
    }
  }

  if (practice && user) {
    return (
      <BluebookPractice
        questions={practice.questions}
        userId={user.id}
        title={practice.title}
        language={lang}
        onExit={() => setPractice(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const section = tree?.sections.find((s) => s.section === activeSection);

  // Calculate total questions per section
  const rwTotal = tree?.sections.find(s => s.section === "Reading & Writing")?.domains.reduce((sum, d) => sum + d.question_count, 0) ?? 0;
  const mathTotal = tree?.sections.find(s => s.section === "Math")?.domains.reduce((sum, d) => sum + d.question_count, 0) ?? 0;

  return (
    <div className="space-y-6">
      {!activeSection ? (
        <>
          <h1 className="text-[30px] font-extrabold tracking-tight">🗃 Question Bank</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[900px]">
            {/* Reading & Writing */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[18px] p-6 text-white flex flex-col gap-1.5 min-h-[170px]"
              style={{ background: "linear-gradient(120deg,#F06ECF,#C455E8)" }}
            >
              <div className="text-[20px] font-extrabold">Reading &amp; Writing</div>
              <div className="text-[14.5px] opacity-90">{rwTotal} questions</div>
              <button
                onClick={() => setActiveSection("Reading & Writing")}
                className="mt-auto self-start bg-white text-op-ink text-[14px] font-extrabold px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors"
              >
                Open ›
              </button>
            </motion.div>

            {/* Math */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-[18px] p-6 text-white flex flex-col gap-1.5 min-h-[170px]"
              style={{ background: "linear-gradient(120deg,#3EC1F5,#2E7BE0)" }}
            >
              <div className="text-[20px] font-extrabold">Math</div>
              <div className="text-[14.5px] opacity-90">{mathTotal} questions</div>
              <button
                onClick={() => setActiveSection("Math")}
                className="mt-auto self-start bg-white text-op-ink text-[14px] font-extrabold px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors"
              >
                Open ›
              </button>
            </motion.div>
          </div>

          <div className="text-[12px] text-op-faint max-w-[760px] text-center mx-auto mt-6 leading-relaxed">
            SAT® is a trademark of the College Board, used for identification purposes only. This platform is not affiliated with or endorsed by the College Board.
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => setActiveSection(null)}
            className="text-[14.5px] font-bold text-op-slate hover:text-op-ink"
          >
            ‹ Back to Question Bank
          </button>
          <h1 className="text-[30px] sm:text-[34px] font-extrabold tracking-tight">{activeSection}</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Practice all topics */}
          <div className="border border-op-line rounded-[16px] p-5 sm:p-6 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-[17px] font-extrabold">Practice all topics</div>
              <div className="text-[14px] text-op-slate">{activeSection} · {section?.domains.reduce((sum, d) => sum + d.question_count, 0) ?? 0} questions</div>
            </div>
            <button
              onClick={() => handleStart(activeSection, null, activeSection)}
              disabled={starting !== null}
              className="bg-op-panel text-op-ink text-[14px] font-extrabold px-6 py-3 rounded-[12px] hover:bg-[#E2E8EB] disabled:opacity-40 transition-colors shrink-0"
            >
              {starting === activeSection ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start practice"}
            </button>
          </div>

          <div className="flex justify-between text-[13.5px] font-bold text-op-muted border-b border-op-line pb-2">
            <span>Topic</span><span>Progress</span>
          </div>

          {/* Domain list */}
          <div className="space-y-5">
            {section?.domains.map((domain, di) => (
              <motion.div
                key={domain.domain}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: di * 0.05 }}
                className="pb-5 border-b border-op-line last:border-0 space-y-3"
              >
                <div className="text-[21px] font-extrabold">{domain.domain}</div>
                <div className="space-y-1">
                  {domain.skills.map((skill: SkillProgress) => {
                    const pct =
                      skill.question_count > 0 ? Math.min(100, (skill.attempted / skill.question_count) * 100) : 0;
                    const key = `${domain.domain}::${skill.skill}`;
                    return (
                      <button
                        key={skill.skill}
                        onClick={() => handleStart(domain.domain, skill.skill, key)}
                        disabled={starting !== null || skill.question_count === 0}
                        className="flex items-center gap-3.5 w-full bg-transparent hover:bg-op-panel rounded-lg disabled:opacity-40 transition-colors text-left p-2"
                      >
                        <span className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex-shrink-0 ${pct >= 100 ? "bg-op-blue border-op-blue" : "border-[#D5DCE0]"}`} />
                        <span className="text-[15.5px] font-semibold flex-1 min-w-0 truncate">{skill.skill}</span>
                        <span className="hidden sm:block w-[140px] h-[6px] bg-op-line rounded-full overflow-hidden shrink-0">
                          <span className="block h-full bg-op-blue rounded-full" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="text-[14px] font-bold text-op-slate w-14 text-right shrink-0">{skill.attempted}/{skill.question_count}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
