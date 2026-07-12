"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, BookOpen, FunctionSquare, Play, Filter, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getSkillTree,
  startSession,
  type SkillTreeResponse,
  type SkillProgress,
} from "@/lib/satIeltsApi";
import QuestionBank from "@/app/dashboard/sat-ielts/QuestionBank";
import DiagnosticTest from "@/app/dashboard/sat-ielts/DiagnosticTest";

export default function QuestionBankPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tree, setTree] = useState<SkillTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"skills" | "questions" | "diagnostic">("skills");

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

  async function handleStart(domain: string, skill: string | null, key: string) {
    if (!user || starting) return;
    setStarting(key);
    setError(null);
    try {
      const res = await startSession({
        user_id: user.id,
        exam_type: "SAT",
        domain,
        skill,
        difficulty: "medium",
        num_questions: 10,
        timed: false,
      });
      sessionStorage.setItem(
        "sat_session",
        JSON.stringify({ session: res, mode: "practice", label: skill || domain })
      );
      router.push("/sat/session");
    } catch (err: any) {
      setError(err.message || "Could not start practice.");
      setStarting(null);
    }
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
      {viewMode === "skills" && !activeSection ? (
        <>
          <div>
            <h1 className="text-3xl font-bold">🗃 Question Bank</h1>
            <p className="text-slate-500 mt-1">Practice by domain and skill, tracked per topic.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {/* Reading & Writing Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-6 text-white flex flex-col gap-2 min-h-[170px]"
            >
              <div className="text-xl font-bold">Reading & Writing</div>
              <div className="text-sm opacity-90">{rwTotal} questions</div>
              <button 
                onClick={() => setActiveSection("Reading & Writing")}
                className="mt-auto self-start bg-white text-slate-900 text-sm font-bold px-5 py-2.5 rounded-full"
              >
                Open <ArrowRight className="h-4 w-4 inline ml-1" />
              </button>
            </motion.div>

            {/* Math Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white flex flex-col gap-2 min-h-[170px]"
            >
              <div className="text-xl font-bold">Math</div>
              <div className="text-sm opacity-90">{mathTotal} questions</div>
              <button 
                onClick={() => setActiveSection("Math")}
                className="mt-auto self-start bg-white text-slate-900 text-sm font-bold px-5 py-2.5 rounded-full"
              >
                Open <ArrowRight className="h-4 w-4 inline ml-1" />
              </button>
            </motion.div>
          </div>

          <div className="text-xs text-slate-400 max-w-2xl text-center mt-8 leading-relaxed">
            SAT® is a trademark of the College Board, used for identification purposes only. This platform is not affiliated with or endorsed by the College Board.
          </div>
        </>
      ) : viewMode === "skills" && activeSection ? (
        <>
          <div className="space-y-3">
            <button
              onClick={() => setActiveSection(null)}
              className="text-sm font-bold text-slate-500 hover:text-slate-700"
            >
              ‹ Back to Question Bank
            </button>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">{activeSection}</h1>
              <button
                onClick={() => setViewMode(viewMode === "skills" ? "questions" : viewMode === "questions" ? "diagnostic" : "skills")}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-all shrink-0"
              >
                <Filter className="h-4 w-4" />
                {viewMode === "skills" ? "Browse Questions" : viewMode === "questions" ? "Diagnostic Test" : "Skill Tree"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Practice all button */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-lg font-bold">Practice all topics</div>
              <div className="text-sm text-slate-500">{activeSection} · {section?.domains.reduce((sum, d) => sum + d.question_count, 0) ?? 0} questions</div>
            </div>
            <button
              onClick={() => handleStart(activeSection, null, activeSection)}
              disabled={starting !== null}
              className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-all"
            >
              {starting === activeSection ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start practice"}
            </button>
          </div>

          {/* Domain list */}
          <div className="space-y-6">
            {section?.domains.map((domain, di) => (
              <motion.div
                key={domain.domain}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: di * 0.05 }}
                className="pb-6 border-b border-slate-200 dark:border-slate-800 last:border-0"
              >
                <div className="text-2xl font-bold mb-4">{domain.domain}</div>
                <div className="space-y-3">
                  {domain.skills.map((skill: SkillProgress) => {
                    const pct =
                      skill.question_count > 0 ? Math.min(100, (skill.attempted / skill.question_count) * 100) : 0;
                    const key = `${domain.domain}::${skill.skill}`;
                    return (
                      <button
                        key={skill.skill}
                        onClick={() => handleStart(domain.domain, skill.skill, key)}
                        disabled={starting !== null || skill.question_count === 0}
                        className="flex items-center gap-4 w-full bg-transparent hover:opacity-75 disabled:opacity-40 transition-all text-left p-2"
                      >
                        <span className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                        <span className="text-base font-semibold flex-1 text-slate-900 dark:text-white">{skill.skill}</span>
                        <div className="w-36 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        <span className="text-sm font-bold text-slate-500 w-16 text-right">{skill.attempted}/{skill.question_count}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : viewMode === "questions" ? (
        <>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode("skills")}
              className="text-sm font-bold text-slate-500 hover:text-slate-700"
            >
              ‹ Back to Question Bank
            </button>
            <h1 className="text-3xl font-bold flex-1">Browse Questions</h1>
          </div>
          <QuestionBank userId={user!.id} examType="SAT" />
        </>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode("skills")}
              className="text-sm font-bold text-slate-500 hover:text-slate-700"
            >
              ‹ Back to Question Bank
            </button>
            <h1 className="text-3xl font-bold flex-1">Diagnostic Test</h1>
          </div>
          <DiagnosticTest userId={user!.id} examType="SAT" onComplete={() => {}} />
        </>
      )}
    </div>
  );
}
