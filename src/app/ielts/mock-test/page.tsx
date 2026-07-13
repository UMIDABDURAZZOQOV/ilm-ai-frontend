"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Clock, CheckCircle, ArrowLeft, Headphones, BookOpen, PenTool, Mic } from "lucide-react";
import Link from "next/link";
import { startMockTest, completeMockTest } from "@/lib/ieltsApi";
import type { IeltsMockTest } from "@/lib/ieltsApi";
import { useAuth } from "@/hooks/useAuth";

export default function IeltsMockTestPage() {
  const { user } = useAuth();
  const [testType, setTestType] = useState<"academic" | "general_training" | null>(null);
  const [currentTest, setCurrentTest] = useState<IeltsMockTest | null>(null);
  const [currentSection, setCurrentSection] = useState<"listening" | "reading" | "writing" | "speaking">("listening");
  const [timeLeft, setTimeLeft] = useState(0);

  const startTest = async (type: "academic" | "general_training") => {
    if (!user) return;
    try {
      const test = await startMockTest({ user_id: user.id, test_type: type });
      setCurrentTest(test);
      setTestType(type);
      setCurrentSection("listening");
      setTimeLeft(30 * 60); // 30 minutes for listening
    } catch (error) {
      console.error("Failed to start test:", error);
    }
  };

  const completeSection = () => {
    if (currentSection === "listening") {
      setCurrentSection("reading");
      setTimeLeft(60 * 60); // 60 minutes for reading
    } else if (currentSection === "reading") {
      setCurrentSection("writing");
      setTimeLeft(60 * 60); // 60 minutes for writing
    } else if (currentSection === "writing") {
      setCurrentSection("speaking");
      setTimeLeft(15 * 60); // 15 minutes for speaking
    }
  };

  const finishTest = async () => {
    if (!currentTest) return;
    try {
      const completed = await completeMockTest(currentTest.id);
      setCurrentTest(completed);
    } catch (error) {
      console.error("Failed to complete test:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!testType) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/ielts" className="text-sm font-bold text-slate-500 hover:text-slate-700">
            ‹ Back to IELTS
          </Link>
          <h1 className="text-3xl font-bold flex-1">Computer-Based Mock Test</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => startTest("academic")}
          >
            <h2 className="text-2xl font-bold mb-2">Academic</h2>
            <p className="text-sm opacity-90 mb-4">For students applying for higher education or professional registration</p>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>2 hours 45 minutes total</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => startTest("general_training")}
          >
            <h2 className="text-2xl font-bold mb-2">General Training</h2>
            <p className="text-sm opacity-90 mb-4">For those migrating to English speaking countries</p>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>2 hours 45 minutes total</span>
            </div>
          </motion.div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold mb-4">Test Structure</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <Headphones className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="font-bold">Listening</div>
              <div className="text-sm text-slate-500">30 min</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-bold">Reading</div>
              <div className="text-sm text-slate-500">60 min</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <PenTool className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="font-bold">Writing</div>
              <div className="text-sm text-slate-500">60 min</div>
            </div>
            <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
              <Mic className="h-8 w-8 text-pink-500 mx-auto mb-2" />
              <div className="font-bold">Speaking</div>
              <div className="text-sm text-slate-500">15 min</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentTest && currentTest.status === "completed") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/ielts" className="text-sm font-bold text-slate-500 hover:text-slate-700">
            ‹ Back to IELTS
          </Link>
          <h1 className="text-3xl font-bold flex-1">Test Results</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center"
        >
          <div className="text-6xl font-bold text-blue-500 mb-2">
            {currentTest.overall_band?.toFixed(1)}
          </div>
          <div className="text-xl text-slate-500 mb-6">Overall Band Score</div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div className="text-sm text-slate-500 mb-1">Listening</div>
              <div className="text-2xl font-bold text-purple-500">
                {currentTest.listening_score?.toFixed(1) || "—"}
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-sm text-slate-500 mb-1">Reading</div>
              <div className="text-2xl font-bold text-green-500">
                {currentTest.reading_score?.toFixed(1) || "—"}
              </div>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <div className="text-sm text-slate-500 mb-1">Writing</div>
              <div className="text-2xl font-bold text-orange-500">
                {currentTest.writing_score?.toFixed(1) || "—"}
              </div>
            </div>
            <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
              <div className="text-sm text-slate-500 mb-1">Speaking</div>
              <div className="text-2xl font-bold text-pink-500">
                {currentTest.speaking_score?.toFixed(1) || "—"}
              </div>
            </div>
          </div>

          <Link
            href="/ielts"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <button
          onClick={() => setCurrentTest(null)}
          className="text-sm font-bold text-slate-500 hover:text-slate-700"
        >
          ‹ Exit Test
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
          </div>
          <div className="text-sm font-bold text-slate-500 capitalize">
            {currentSection}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
        {currentSection === "listening" && (
          <div className="text-center py-12">
            <Headphones className="h-16 w-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Listening Section</h2>
            <p className="text-slate-500 mb-6">Listen to audio recordings and answer questions</p>
            <button
              onClick={completeSection}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Complete Listening Section
            </button>
          </div>
        )}

        {currentSection === "reading" && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Reading Section</h2>
            <p className="text-slate-500 mb-6">Read passages and answer comprehension questions</p>
            <button
              onClick={completeSection}
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Complete Reading Section
            </button>
          </div>
        )}

        {currentSection === "writing" && (
          <div className="text-center py-12">
            <PenTool className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Writing Section</h2>
            <p className="text-slate-500 mb-6">Complete Task 1 and Task 2 writing assignments</p>
            <button
              onClick={completeSection}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Complete Writing Section
            </button>
          </div>
        )}

        {currentSection === "speaking" && (
          <div className="text-center py-12">
            <Mic className="h-16 w-16 text-pink-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Speaking Section</h2>
            <p className="text-slate-500 mb-6">Record your responses to speaking prompts</p>
            <button
              onClick={finishTest}
              className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Finish Test
            </button>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-4">
          {["listening", "reading", "writing", "speaking"].map((section, index) => (
            <div
              key={section}
              className={`flex-1 h-2 rounded-full ${
                index <= ["listening", "reading", "writing", "speaking"].indexOf(currentSection)
                  ? "bg-blue-500"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Listening</span>
          <span>Reading</span>
          <span>Writing</span>
          <span>Speaking</span>
        </div>
      </div>
    </div>
  );
}
