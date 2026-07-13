"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Headphones, BookOpen, PenTool, Mic, Play, TrendingUp, Target, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getListening, getReading, getWriting, getSpeaking, getUserMockTests } from "@/lib/ieltsApi";
import type { IeltsMockTest } from "@/lib/ieltsApi";

export default function IeltsPage() {
  const { user } = useAuth();
  const [mockTests, setMockTests] = useState<IeltsMockTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getUserMockTests(user.id).then((tests) => {
        setMockTests(tests);
        setLoading(false);
      });
    }
  }, [user]);

  const latestTest = mockTests[0];
  const overallBand = latestTest?.overall_band;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎯 IELTS Preparation</h1>
        <p className="text-slate-500 mt-1">Master all 4 skills with AI-powered practice</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white"
        >
          <div className="text-sm font-bold opacity-90 mb-2">Overall Band</div>
          <div className="text-4xl font-bold">{overallBand ? overallBand.toFixed(1) : "—"}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
        >
          <div className="text-sm font-bold text-slate-500 mb-2">Mock Tests</div>
          <div className="text-3xl font-bold">{mockTests.length}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
        >
          <div className="text-sm font-bold text-slate-500 mb-2">Practice Hours</div>
          <div className="text-3xl font-bold">0</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
        >
          <div className="text-sm font-bold text-slate-500 mb-2">Study Streak</div>
          <div className="text-3xl font-bold">0</div>
        </motion.div>
      </div>

      {/* 4 Skills Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Listening */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Headphones className="h-6 w-6" />
                <h2 className="text-xl font-bold">Listening</h2>
              </div>
              <p className="text-sm opacity-90 mb-4">Practice with authentic audio recordings and improve comprehension</p>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>30 minutes per section</span>
              </div>
            </div>
            <Play className="h-8 w-8" />
          </div>
        </motion.div>

        {/* Reading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-6 w-6" />
                <h2 className="text-xl font-bold">Reading</h2>
              </div>
              <p className="text-sm opacity-90 mb-4">Master academic passages with timed practice exercises</p>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>60 minutes per section</span>
              </div>
            </div>
            <Play className="h-8 w-8" />
          </div>
        </motion.div>

        {/* Writing */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PenTool className="h-6 w-6" />
                <h2 className="text-xl font-bold">Writing</h2>
              </div>
              <p className="text-sm opacity-90 mb-4">Get instant AI feedback on Task 1 and Task 2 essays</p>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4" />
                <span>AI-graded band scores</span>
              </div>
            </div>
            <Play className="h-8 w-8" />
          </div>
        </motion.div>

        {/* Speaking */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-6 w-6" />
                <h2 className="text-xl font-bold">Speaking</h2>
              </div>
              <p className="text-sm opacity-90 mb-4">Record responses and receive AI pronunciation feedback</p>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>Real-time analysis</span>
              </div>
            </div>
            <Play className="h-8 w-8" />
          </div>
        </motion.div>
      </div>

      {/* Full Mock Test CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1">Full Computer-Based Mock Test</h3>
            <p className="text-sm text-slate-500">Experience the real IELTS exam format with all 4 skills</p>
          </div>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors">
            Start Mock Test <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Recent Mock Tests */}
      {mockTests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
        >
          <h3 className="font-bold mb-4">Recent Mock Tests</h3>
          <div className="space-y-3">
            {mockTests.slice(0, 3).map((test) => (
              <div key={test.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <div className="font-medium">{test.test_type === "academic" ? "Academic" : "General Training"}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(test.started_at).toLocaleDateString()} · {test.status}
                  </div>
                </div>
                {test.overall_band && (
                  <div className="text-2xl font-bold text-blue-500">{test.overall_band.toFixed(1)}</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
