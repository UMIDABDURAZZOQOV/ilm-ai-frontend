"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter, 
  Search, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp
} from "lucide-react";
import {
  listQuestions,
  Question,
  Difficulty,
  ExamType,
  getSkillTree,
  SkillTreeResponse,
} from "@/lib/satIeltsApi";

// ── Constants ─────────────────────────────────────────────────────────────────

const SAT_DOMAINS = [
  "Algebra",
  "Advanced Math",
  "Problem Solving & Data Analysis",
  "Geometry & Trigonometry",
  "Information and Ideas",
  "Craft and Structure",
  "Expression of Ideas",
  "Standard English Conventions",
];

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const DIFFICULTY_COLORS = {
  easy: "bg-green-500/10 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  hard: "bg-red-500/10 text-red-400 border-red-500/30",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuestionBankProps {
  userId: number;
  examType: ExamType;
}

interface FilterState {
  domain: string | null;
  difficulty: Difficulty | null;
  search: string;
}

// ── Component ───────────────────────────────────────────────────────────────────

export default function QuestionBank({ userId, examType }: QuestionBankProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillTree, setSkillTree] = useState<SkillTreeResponse | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    domain: null,
    difficulty: null,
    search: "",
  });
  
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<Record<number, string>>({});

  // Fetch questions and skill tree
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all questions
        const questionsRes = await listQuestions({ exam_type: examType, limit: 1000 });
        setQuestions(questionsRes.questions);
        setFilteredQuestions(questionsRes.questions);
        
        // Fetch skill tree for progress
        const skillTreeRes = await getSkillTree(userId, examType);
        setSkillTree(skillTreeRes);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId, examType]);

  // Apply filters
  useEffect(() => {
    let filtered = [...questions];
    
    if (filters.domain) {
      filtered = filtered.filter((q) => q.domain === filters.domain);
    }
    
    if (filters.difficulty) {
      filtered = filtered.filter((q) => q.difficulty === filters.difficulty);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((q) =>
        q.question_text.toLowerCase().includes(searchLower) ||
        q.domain.toLowerCase().includes(searchLower) ||
        (q.skill && q.skill.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredQuestions(filtered);
  }, [filters, questions]);

  // Get skill progress for a question
  const getSkillProgress = (question: Question) => {
    if (!skillTree) return null;
    
    for (const section of skillTree.sections) {
      for (const domain of section.domains) {
        if (domain.domain === question.domain) {
          for (const skill of domain.skills) {
            if (skill.skill === question.skill) {
              return skill;
            }
          }
        }
      }
    }
    return null;
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: number, answer: string) => {
    setSelectedAnswer((prev) => ({ ...prev, [questionId]: answer }));
  };

  // Toggle answer visibility
  const toggleAnswer = (questionId: number) => {
    setShowAnswer((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Toggle question expansion
  const toggleQuestion = (questionId: number) => {
    setExpandedQuestion((prev) => (prev === questionId ? null : questionId));
  };

  // Get domain stats
  const getDomainStats = () => {
    const stats: Record<string, { total: number; attempted: number; correct: number }> = {};
    
    if (!skillTree) return stats;
    
    for (const section of skillTree.sections) {
      for (const domain of section.domains) {
        stats[domain.domain] = {
          total: domain.question_count,
          attempted: domain.attempted,
          correct: domain.correct,
        };
      }
    }
    
    return stats;
  };

  const domainStats = getDomainStats();
  const totalQuestions = questions.length;
  const totalAttempted = Object.values(domainStats).reduce((sum, s) => sum + s.attempted, 0);
  const totalCorrect = Object.values(domainStats).reduce((sum, s) => sum + s.correct, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-3xl p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xl">Question Bank</h3>
              <p className="text-sm text-slate-400">
                {totalQuestions} questions available • {totalAttempted} attempted
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0}%
              </p>
              <p className="text-xs text-slate-400">Accuracy</p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Domain Progress Bars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SAT_DOMAINS.slice(0, 8).map((domain) => {
            const stats = domainStats[domain];
            if (!stats) return null;
            const accuracy = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0;
            const progress = (stats.attempted / stats.total) * 100;
            
            return (
              <motion.div
                key={domain}
                whileHover={{ scale: 1.02 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300 truncate">{domain}</span>
                  <span className="text-xs text-slate-500">{stats.attempted}/{stats.total}</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full rounded-full ${
                      accuracy >= 70 ? "bg-green-500" : accuracy >= 50 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-slate-300">Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search questions..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>

          {/* Domain Filter */}
          <select
            value={filters.domain || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, domain: e.target.value || null }))}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          >
            <option value="">All Domains</option>
            {SAT_DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={filters.difficulty || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, difficulty: (e.target.value as Difficulty) || null }))}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          >
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {(filters.domain || filters.difficulty || filters.search) && (
          <button
            onClick={() => setFilters({ domain: null, difficulty: null, search: "" })}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            Clear all filters
          </button>
        )}
      </motion.div>

      {/* Questions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {filteredQuestions.length} of {totalQuestions} questions
          </p>
        </div>

        <AnimatePresence>
          {filteredQuestions.map((question, index) => {
            const skillProgress = getSkillProgress(question);
            const isExpanded = expandedQuestion === question.id;
            const answerShown = showAnswer[question.id];
            const userAnswer = selectedAnswer[question.id];
            const isCorrect = userAnswer === question.correct_answer;

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.02 }}
                className={`bg-slate-900/50 border rounded-xl overflow-hidden transition-all ${
                  isExpanded ? "border-blue-500/50" : "border-slate-800"
                }`}
              >
                {/* Question Header */}
                <motion.button
                  onClick={() => toggleQuestion(question.id)}
                  whileHover={{ scale: 1.01 }}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${DIFFICULTY_COLORS[question.difficulty]}`}>
                          {question.difficulty}
                        </span>
                        <span className="text-xs text-slate-500">{question.domain}</span>
                        {question.skill && (
                          <span className="text-xs text-slate-600">• {question.skill}</span>
                        )}
                        {skillProgress && skillProgress.attempted > 0 && (
                          <span className="text-xs text-slate-500">
                            • {Math.round((skillProgress.correct / skillProgress.attempted) * 100)}% accuracy
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200 line-clamp-2">
                        {question.question_text}
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-800 p-4 space-y-4"
                    >
                      {/* Full Question Text */}
                      <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-sm text-slate-200 whitespace-pre-wrap">{question.question_text}</p>
                      </div>

                      {/* Options (MCQ) */}
                      {question.question_type === "mcq" && question.options && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-300">Select your answer:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {question.options.map((option, idx) => {
                              const isSelected = userAnswer === option;
                              const isCorrectOption = option === question.correct_answer;
                              
                              return (
                                <motion.button
                                  key={idx}
                                  onClick={() => handleAnswerSelect(question.id, option)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  disabled={answerShown}
                                  className={`p-3 rounded-xl text-sm text-left transition-all border ${
                                    isSelected
                                      ? answerShown
                                        ? isCorrectOption
                                          ? "bg-green-500/20 border-green-500/50 text-green-400"
                                          : "bg-red-500/20 border-red-500/50 text-red-400"
                                        : "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                      : answerShown && isCorrectOption
                                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                                      : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                                  }`}
                                >
                                  <span className="font-medium">{option}</span>
                                  {answerShown && isCorrectOption && (
                                    <CheckCircle2 className="inline ml-2 h-4 w-4 text-green-400" />
                                  )}
                                  {answerShown && isSelected && !isCorrectOption && (
                                    <XCircle className="inline ml-2 h-4 w-4 text-red-400" />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Show Answer Button */}
                      {!answerShown && userAnswer && (
                        <motion.button
                          onClick={() => toggleAnswer(question.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Show Answer
                        </motion.button>
                      )}

                      {/* Answer & Explanation */}
                      {answerShown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <div className={`rounded-xl p-4 border ${
                            isCorrect
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-red-500/10 border-red-500/30"
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              {isCorrect ? (
                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-400" />
                              )}
                              <span className={`font-medium ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                                {isCorrect ? "Correct!" : "Incorrect"}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300">
                              <span className="font-medium">Correct answer:</span> {question.correct_answer}
                            </p>
                          </div>

                          {question.rubric && (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                              <p className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-blue-400" /> Explanation
                              </p>
                              <p className="text-sm text-slate-400 whitespace-pre-wrap">{question.rubric}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No questions match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
