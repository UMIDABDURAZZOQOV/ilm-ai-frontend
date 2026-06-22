"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  GraduationCap,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Upload,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
  MessageCircle,
  CreditCard,
  ChevronRight,
  Star,
  Copy,
  Volume2,
  Mic,
  Camera,
  BookOpen,
  Zap,
  Shield,
  RotateCcw,
  Trash2,
  Target,
  TrendingUp,
  Award,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function DashboardContent() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { t, lang } = useI18n();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Stats & Data
  const [files, setFiles] = useState<any[]>([]);
  const [stats, setStats] = useState({ files: 0, streak: 0, tgLinked: false });
  const [loading, setLoading] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string; citations?: string[] }[]>([]);
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("speechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US";
    
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
    };
    recognition.start();
  };

  // Quiz State
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizCount, setQuizCount] = useState(5);
  const [quizResult, setQuizResult] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  // Plan State
  const [planGoal, setPlanGoal] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [planHours, setPlanHours] = useState(2);
  const [planResult, setPlanResult] = useState<any>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTopic, setUploadTopic] = useState("");
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [uploadStatus, setUploadStatus] = useState<{
    msg: string;
    type: "success" | "error" | null;
  }>({ msg: "", type: null });

  // Gaps State
  const [gapsResult, setGapsResult] = useState<any>(null);

  // Feedback State
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackStatus, setFeedbackStatus] = useState<{
    msg: string;
    type: "success" | "error" | null;
  }>({ msg: "", type: null });

  // Subscription State
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"payme" | "click" | "stripe" | null>(null);
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);

  // Flashcards State
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Quiz Stats State
  const [quizStats, setQuizStats] = useState<any>(null);

  // Settings State
  const [settingsGoal, setSettingsGoal] = useState("");
  const [settingsTargetDate, setSettingsTargetDate] = useState("");
  const [settingsStatus, setSettingsStatus] = useState<{ msg: string; type: "success" | "error" | null }>({ msg: "", type: null });

  // Telegram reminder
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminderStatus, setReminderStatus] = useState<{ msg: string; type: "success" | "error" | null }>({ msg: "", type: null });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      const fileData = await apiFetch(`/files/list?user_id=${user?.id}`);
      setFiles(fileData.files || []);

      const tgData = await apiFetch(`/telegram/status/${user?.id}`);
      setStats({
        files: fileData.files?.length || 0,
        streak: tgData.streak_days || 0,
        tgLinked: tgData.linked || false,
      });
      setReminderTime(tgData.reminder_time || "09:00");

      const subData = await apiFetch(`/payments/status/${user?.id}`);
      setSubscriptionStatus(subData);

      try {
        const fcData = await apiFetch(`/quiz/flashcards/${user?.id}`);
        setFlashcards(fcData.flashcards || []);
      } catch {
        setFlashcards([]);
      }

      try {
        const qStats = await apiFetch(`/quiz/stats/${user?.id}`);
        setQuizStats(qStats);
      } catch {
        setQuizStats(null);
      }

      try {
        const profile = await apiFetch(`/auth/profile/${user?.id}`);
        setSettingsGoal(profile.learning_goal || "");
        setSettingsTargetDate(profile.target_date || "");
      } catch {
        // Profile fields remain empty until saved
      }

      try {
        const historyData = await apiFetch(`/chat/history/${user?.id}`);
        const history = historyData.history || [];
        setMessages(
          history.map((msg: { role: string; content: string }) => ({
            role: msg.role === "assistant" ? "ai" as const : "user" as const,
            content: msg.content,
          }))
        );
      } catch {
        setMessages([]);
      }
    } catch {
      // ignore initial load errors
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;
    
    // Check free tier limits
    if (!subscriptionStatus?.is_premium && files.length >= 5) {
      alert("Free tier is limited to 5 files. Please upgrade for unlimited uploads.");
      setActivePanel("subscription");
      return;
    }

    setLoading(true);
    setUploadStatus({ msg: "", type: null });

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (uploadTopic) formData.append("topic", uploadTopic);

    try {
      const data = await apiFetch(`/files/upload?user_id=${user.id}`, {
        method: "POST",
        body: formData,
      });

      setUploadStatus({
        msg: `Successfully uploaded ${data.filename}`,
        type: "success",
      });
      setSelectedFile(null);
      setUploadTopic("");
      fetchInitialData();
    } catch (err: any) {
      setUploadStatus({ msg: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!user || !pasteContent.trim()) return;

    if (!subscriptionStatus?.is_premium && files.length >= 5) {
      alert("Free tier is limited to 5 files. Please upgrade for unlimited uploads.");
      setActivePanel("subscription");
      return;
    }

    setLoading(true);
    setUploadStatus({ msg: "", type: null });

    try {
      const data = await apiFetch("/files/upload-text", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          filename: pasteTitle.trim() || `notes-${Date.now()}.txt`,
          text: pasteContent,
          topic: uploadTopic || "General",
        }),
      });
      setUploadStatus({
        msg: `Successfully uploaded ${data.filename}`,
        type: "success",
      });
      setPasteTitle("");
      setPasteContent("");
      setUploadTopic("");
      fetchInitialData();
    } catch (err: any) {
      setUploadStatus({ msg: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReminder = async () => {
    if (!user) return;
    setLoading(true);
    setReminderStatus({ msg: "", type: null });
    try {
      await apiFetch("/telegram/reminder", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, reminder_time: reminderTime }),
      });
      setReminderStatus({ msg: "Reminder time saved!", type: "success" });
    } catch {
      setReminderStatus({ msg: "Failed to save reminder time", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRevisitMaterial = (material: string) => {
    setActivePanel("chat");
    setChatInput(`Help me review and understand the material from "${material}". What are the key concepts I should focus on?`);
  };

  const handleDeleteFile = async (filename: string) => {
    if (!user) return;
    if (!confirm(`Delete "${filename}"?`)) return;
    try {
      await apiFetch(`/files/delete?user_id=${user.id}&filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
      fetchInitialData();
    } catch (err: any) {
      alert("Failed to delete file: " + err.message);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await apiFetch("/auth/update-profile", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          learning_goal: settingsGoal,
          target_date: settingsTargetDate,
        }),
      });
      setSettingsStatus({ msg: "Settings saved!", type: "success" });
    } catch (err: any) {
      setSettingsStatus({ msg: "Failed to save settings", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user) return;
    const question = chatInput;
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const data = await apiFetch("/chat/ask", {
        method: "POST",
        body: JSON.stringify({ 
          user_id: user.id, 
          question,
          language: lang // Pass current language for localized response
        }),
      });
      setMessages((prev) => [...prev, { 
        role: "ai", 
        content: data.answer,
        citations: data.citations || data.sources // Support for citations
      }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!user) return;

    if (
      !subscriptionStatus?.is_premium &&
      subscriptionStatus?.quiz_today >= subscriptionStatus?.quiz_limit
    ) {
      alert(`Daily quiz limit reached (${subscriptionStatus?.quiz_limit}). Upgrade to Premium for unlimited quizzes.`);
      setActivePanel("subscription");
      return;
    }

    setLoading(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnsweredQuestions([]);
    setUserAnswers({});
    try {
      const data = await apiFetch("/quiz/generate", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          difficulty: quizDifficulty,
          num_questions: quizCount,
          language: lang // Ensure quiz is in current language
        }),
      });
      if (!data.questions || data.questions.length === 0) {
        alert("No questions were generated. Make sure you have uploaded materials first.");
      }
      setQuizResult(data.questions || []);
    } catch (err: any) {
      alert(`Quiz error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch("/quiz/flashcards", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, language: lang }),
      });
      setFlashcards(data.flashcards || []);
      setCurrentCardIndex(0);
      setIsCardFlipped(false);
    } catch (err: any) {
      alert("Failed to generate flashcards.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAnswer = () => {
    if (quizResult.length === 0) return;
    const currentQuestion = quizResult[currentQuestionIndex];
    
    // For non-MCQ questions, use the typed text as the answer
    const answer = selectedAnswer || "";
    if (!answer && currentQuestion.type === "mcq") return; // MCQ requires selection
    
    const isCorrect = answer === currentQuestion.correct_answer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    const newAnswered = [...answeredQuestions, currentQuestionIndex];
    setAnsweredQuestions(newAnswered);
    const updatedAnswers = { ...userAnswers, [currentQuestionIndex]: answer };
    setUserAnswers(updatedAnswers);

    // When all questions are answered, save quiz session to backend
    if (newAnswered.length === quizResult.length && user) {
      const finalScore = score + (isCorrect ? 1 : 0);
      const results = quizResult.map((q, idx) => ({
        question: q.question,
        user_answer: updatedAnswers[idx] || "",
        correct_answer: q.correct_answer || "",
        is_correct: updatedAnswers[idx] === q.correct_answer,
        topic: q.topic || "general",
        explanation: q.explanation || "",
      }));
      apiFetch("/quiz/complete", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          difficulty: quizDifficulty,
          score: finalScore,
          total: quizResult.length,
          results,
        }),
      }).catch(() => {
        // Quiz session save is best-effort
      });
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedAnswer(null);
  };

  const handleGeneratePlan = async () => {
    if (!user || !planGoal || !planDate) return;
    setLoading(true);
    try {
      const data = await apiFetch("/plan/generate", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          goal: planGoal,
          target_date: planDate,
          daily_hours: planHours,
        }),
      });
      setPlanResult(data);
    } catch (err: any) {
      alert(`Plan error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGaps = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/gaps/report/${user.id}`);
      setGapsResult(data);
    } catch {
      setGapsResult({ ready: false, message: "Could not load gaps report. Complete more quiz sessions first." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user || !feedbackMessage.trim()) return;
    setLoading(true);
    setFeedbackStatus({ msg: "", type: null });
    try {
      await apiFetch("/feedback/submit", {
        method: "POST",
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          message: feedbackMessage,
          rating: feedbackRating,
        }),
      });
      setFeedbackStatus({ msg: t("feedback_success"), type: "success" });
      setFeedbackMessage("");
    } catch (err: any) {
      setFeedbackStatus({ msg: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeSubscription = async (method: "payme" | "click" | "stripe") => {
    if (!user) return;
    setPaymentMethod(method);
    setShowPaymentSelection(false);
    setLoading(true);
    try {
      const data = await apiFetch("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, plan: "premium", method }),
      });
      
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setShowPaymentModal(true);
      }
    } catch {
      // Payment checkout failed silently; user can retry
    } finally {
      setLoading(false);
    }
  };

  const confirmTestPayment = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // First, create a checkout session via backend
      const checkoutData = await apiFetch("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, plan: "premium", method: paymentMethod || "payme" }),
      });
      
      // Then confirm the payment (simulates successful payment in test mode)
      await apiFetch(`/payments/confirm?session_id=${checkoutData.session_id}&user_id=${user.id}`, {
        method: "POST",
      });
      
      setShowPaymentModal(false);
      fetchInitialData();
    } catch {
      alert("Payment confirmation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await apiFetch(`/payments/cancel/${user.id}`, {
        method: "POST",
      });
      fetchInitialData();
    } catch {
      // Payment checkout failed silently; user can retry
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const menuItems = [
    { id: "overview", label: t("overview"), icon: LayoutDashboard },
    { id: "files", label: t("dash_files"), icon: FileText },
    { id: "chat", label: t("dash_chat"), icon: MessageSquare },
    { id: "quiz", label: t("dash_quiz"), icon: GraduationCap },
    { id: "plans", label: t("dash_plan"), icon: Calendar },
    { id: "flashcards", label: t("dash_flashcards"), icon: Zap },
    { id: "gaps", label: t("dash_gaps"), icon: Brain },
    { id: "subscription", label: t("dash_subscription"), icon: CreditCard },
    { id: "feedback", label: t("dash_feedback"), icon: MessageCircle },
    { id: "telegram", label: t("dash_telegram"), icon: Send },
    { id: "settings", label: t("settings") || "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-transparent overflow-hidden text-slate-900 dark:text-slate-100 relative z-10">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col transition-all duration-300 z-30"
      >
        <div className="p-6 flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <BookOpen className="text-white h-5 w-5" />
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-xl whitespace-nowrap bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">{t("brand")}</span>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                activePanel === item.id
                  ? "bg-blue-50 dark:bg-blue-900/30 text-primary"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
              }`}
            >
              <item.icon
                className={`h-5 w-5 shrink-0 ${
                  activePanel === item.id ? "text-primary" : "group-hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              />
              {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              {activePanel === item.id && isSidebarOpen && (
                <motion.div
                  layoutId="active"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="px-6 py-4">
          <LanguageSwitcher />
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isSidebarOpen && <span className="font-medium">{t("dash_logout")}</span>}
          </button>
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 h-6 w-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shadow-sm z-50 hover:bg-slate-50"
        >
          {isSidebarOpen ? <X className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold capitalize tracking-tight">
            {menuItems.find((i) => i.id === activePanel)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user?.name || "User"}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="h-10 w-10 bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {activePanel === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Top Stats Grid */}
                <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: t("dash_files"), value: stats.files, icon: FileText, color: "bg-blue-500/10 text-blue-500" },
                    { label: t("streak_label"), value: `${stats.streak} Days`, icon: CheckCircle2, color: "bg-green-500/10 text-green-500" },
                    { label: "Sessions", value: quizStats?.sessions_completed || 0, icon: GraduationCap, color: "bg-orange-500/10 text-orange-500" },
                    { label: "Avg Score", value: `${quizStats?.average_score || 0}%`, icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-500" },
                    { label: "Questions", value: quizStats?.total_questions || 0, icon: Award, color: "bg-pink-500/10 text-pink-500" },
                    { label: t("dash_telegram"), value: stats.tgLinked ? t("tg_linked") : t("tg_not_linked"), icon: Send, color: "bg-purple-500/10 text-purple-500" },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 group hover:border-primary/50 transition-all duration-300"
                    >
                      <div className={`h-10 w-10 ${stat.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
                      <p className="text-xl font-bold mt-1">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Score Trend Chart */}
                {quizStats?.score_trend?.length > 0 && (
                  <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                    <h3 className="font-bold text-sm mb-4">Knowledge Score Trend</h3>
                    <div className="flex items-end gap-2 h-32">
                      {quizStats.score_trend.map((s: any, i: number) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-500">{s.score_pct}%</span>
                          <div
                            className="w-full bg-gradient-to-t from-primary to-blue-400 rounded-t-md transition-all"
                            style={{ height: `${Math.max(s.score_pct, 8)}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topics Covered */}
                {quizStats?.topics_covered?.length > 0 && (
                  <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                    <h3 className="font-bold text-sm mb-3">Topics Covered</h3>
                    <div className="flex flex-wrap gap-2">
                      {quizStats.topics_covered.map((topic: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full capitalize">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activePanel === "files" && (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">{t("dash_upload")}</h3>
                  <p className="text-slate-500 mb-6">{t("upload_hint")}</p>
                  
                  <div className="max-w-md mx-auto mb-6">
                    <label className="block text-left text-sm font-medium mb-1">{t("topic_label")}</label>
                    <input 
                      type="text" 
                      value={uploadTopic}
                      onChange={(e) => setUploadTopic(e.target.value)}
                      placeholder={t("topic_placeholder")}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary mb-4"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold hover:bg-slate-200 transition-all inline-block"
                    >
                      {selectedFile ? selectedFile.name : "Select File"}
                    </label>

                    <input
                      type="file"
                      id="camera-upload"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="camera-upload"
                      className="cursor-pointer px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold hover:bg-slate-200 transition-all inline-block flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </label>
                  </div>

                  {selectedFile && (
                    <button
                      onClick={handleFileUpload}
                      disabled={loading}
                      className="px-10 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 transition-all"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      ) : (
                        t("upload_btn")
                      )}
                    </button>
                  )}
                  {uploadStatus.msg && (
                    <div
                      className={`mt-4 flex items-center justify-center gap-2 text-sm font-medium ${
                        uploadStatus.type === "success"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {uploadStatus.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {uploadStatus.msg}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold mb-2">Paste Content</h3>
                  <p className="text-slate-500 mb-4 text-sm">Add notes or text directly without uploading a file.</p>
                  <div className="space-y-4 max-w-2xl">
                    <input
                      type="text"
                      value={pasteTitle}
                      onChange={(e) => setPasteTitle(e.target.value)}
                      placeholder="Title (e.g. Chapter 3 Notes)"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
                    />
                    <textarea
                      value={pasteContent}
                      onChange={(e) => setPasteContent(e.target.value)}
                      rows={6}
                      placeholder="Paste your study material here..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <button
                      onClick={handleTextUpload}
                      disabled={loading || !pasteContent.trim()}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Save Pasted Content"}
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold">{t("dash_files")}</h3>
                    <span className="text-sm text-slate-500">
                      {files.length} {t("dash_files")}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {files.length > 0 ? (
                      files.map((file, i) => (
                        <div
                          key={i}
                          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{typeof file === 'string' ? file : file.filename}</p>
                              {file.topic && <p className="text-[10px] text-slate-500 uppercase tracking-wider">{file.topic}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {file.chunks && (
                              <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500">
                                {file.chunks} chunks
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteFile(typeof file === 'string' ? file : file.filename)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              title="Delete file"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-slate-500">
                        {t("no_files")}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activePanel === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-[calc(100vh-200px)] flex flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                      <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="h-10 w-10 text-primary" />
                      </div>
                      <p className="font-medium text-lg">{t("ask_placeholder")}</p>
                      <p className="text-sm text-slate-500 max-w-xs mt-2">Chat with your materials using our advanced AI companion.</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl relative group ${
                          msg.role === "user"
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{t("citations_label")}</p>
                            <div className="flex flex-wrap gap-1">
                              {msg.citations.map((cite, j) => (
                                <span key={j} className="text-[10px] bg-white/50 dark:bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500">
                                  {cite}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {msg.role === "ai" && (
                          <div className="absolute -right-10 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                                alert("Copied!");
                              }}
                              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Copy to clipboard"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const utterance = new SpeechSynthesisUtterance(msg.content);
                                window.speechSynthesis.speak(utterance);
                              }}
                              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Listen"
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/30">
                  <div className="relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={t("ask_placeholder")}
                      className="w-full pl-6 pr-24 py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner"
                    />
                    <div className="absolute right-2 top-2 flex gap-2">
                      <button
                        onClick={startListening}
                        className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                          isListening
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                        }`}
                        title="Voice Input"
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleSendMessage}
                        className="h-10 w-10 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activePanel === "quiz" && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {quizResult.length === 0 || answeredQuestions.length === quizResult.length ? (
                  <>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 grid sm:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t("difficulty")}
                        </label>
                        <select
                          value={quizDifficulty}
                          onChange={(e) => setQuizDifficulty(e.target.value)}
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                        >
                          <option value="easy">{t("easy")}</option>
                          <option value="medium">{t("medium")}</option>
                          <option value="hard">{t("hard")}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t("num_questions")}
                        </label>
                        <input
                          type="number"
                          value={quizCount}
                          onChange={(e) => setQuizCount(parseInt(e.target.value))}
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                        />
                      </div>
                      <button
                        onClick={handleGenerateQuiz}
                        disabled={loading}
                        className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          t("generate_quiz")
                        )}
                      </button>
                    </div>
                    {answeredQuestions.length === quizResult.length && (
                      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">
                          {t("your_score")}: {score}/{quizResult.length}
                        </h3>
                        <p className="text-slate-500 mb-6">
                          {Math.round((score / quizResult.length) * 100)}%
                        </p>
                        <button
                          onClick={handleGenerateQuiz}
                          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-600 transition-all"
                        >
                          {t("restart_quiz")}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-500">
                          {t("dash_quiz")}: {currentQuestionIndex + 1}/{quizResult.length}
                        </span>
                        <span className="text-sm font-bold text-primary">
                          {t("your_score")}: {score}/{answeredQuestions.length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(answeredQuestions.length / quizResult.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-6">
                      Q{currentQuestionIndex + 1}: {quizResult[currentQuestionIndex].question}
                    </h3>

                    {/* MCQ Question - Show option buttons */}
                    {quizResult[currentQuestionIndex].options && quizResult[currentQuestionIndex].options.length > 0 && (
                      <div className="grid gap-3 mb-6">
                        {quizResult[currentQuestionIndex].options.map(
                          (opt: string, j: number) => (
                            <button
                              key={j}
                              onClick={() => !answeredQuestions.includes(currentQuestionIndex) && setSelectedAnswer(opt)}
                              disabled={answeredQuestions.includes(currentQuestionIndex)}
                              className={`p-4 rounded-xl border text-left transition-all ${
                                selectedAnswer === opt
                                  ? "border-primary bg-blue-50 dark:bg-blue-900/30"
                                  : answeredQuestions.includes(currentQuestionIndex) && opt === quizResult[currentQuestionIndex].correct_answer
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                                  : answeredQuestions.includes(currentQuestionIndex) && selectedAnswer === opt && opt !== quizResult[currentQuestionIndex].correct_answer
                                  ? "border-red-500 bg-red-50 dark:bg-red-900/30"
                                  : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {/* Short Answer Question - Show text input */}
                    {(!quizResult[currentQuestionIndex].options || quizResult[currentQuestionIndex].options.length === 0) &&
                      quizResult[currentQuestionIndex].type !== "open_ended" && (
                      <div className="mb-6">
                        <input
                          type="text"
                          value={selectedAnswer || ""}
                          onChange={(e) => setSelectedAnswer(e.target.value)}
                          disabled={answeredQuestions.includes(currentQuestionIndex)}
                          placeholder="Type your answer..."
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                        />
                      </div>
                    )}

                    {/* Open-ended Question - Show textarea */}
                    {quizResult[currentQuestionIndex].type === "open_ended" && (
                      <div className="mb-6">
                        <textarea
                          value={selectedAnswer || ""}
                          onChange={(e) => setSelectedAnswer(e.target.value)}
                          disabled={answeredQuestions.includes(currentQuestionIndex)}
                          placeholder="Explain your answer..."
                          rows={4}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-60"
                        />
                      </div>
                    )}

                    {/* Answer Section */}
                    {!answeredQuestions.includes(currentQuestionIndex) ? (
                      <button
                        onClick={handleCheckAnswer}
                        disabled={!selectedAnswer && quizResult[currentQuestionIndex].type === "mcq"}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all"
                      >
                        {t("check_answer")}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-xl ${
                          selectedAnswer === quizResult[currentQuestionIndex].correct_answer
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        }`}>
                          <p className={`font-bold mb-1 ${
                            selectedAnswer === quizResult[currentQuestionIndex].correct_answer
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}>
                            {selectedAnswer === quizResult[currentQuestionIndex].correct_answer
                              ? t("correct")
                              : t("incorrect")}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Your answer:</span> {selectedAnswer || "—"}
                          </p>
                          {selectedAnswer !== quizResult[currentQuestionIndex].correct_answer && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                              <span className="font-medium">Correct answer:</span> {quizResult[currentQuestionIndex].correct_answer}
                            </p>
                          )}
                          {quizResult[currentQuestionIndex].explanation && (
                            <p className="text-sm text-slate-500 mt-2 italic">
                              {quizResult[currentQuestionIndex].explanation}
                            </p>
                          )}
                        </div>

                        {/* Next question or Finish button */}
                        {currentQuestionIndex < quizResult.length - 1 ? (
                          <button
                            onClick={handleNextQuestion}
                            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-600 transition-all"
                          >
                            {t("next_question")}
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <h3 className="text-xl font-bold">
                              {t("your_score")}: {score}/{quizResult.length} ({Math.round((score / quizResult.length) * 100)}%)
                            </h3>
                            <button
                              onClick={handleGenerateQuiz}
                              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-600 transition-all"
                            >
                              {t("restart_quiz")}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activePanel === "plans" && (
              <motion.div
                key="plans"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t("goal")}</label>
                      <input
                        type="text"
                        value={planGoal}
                        onChange={(e) => setPlanGoal(e.target.value)}
                        placeholder="e.g. Master Python Decorators"
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("target_date")}
                      </label>
                      <input
                        type="date"
                        value={planDate}
                        onChange={(e) => setPlanDate(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">
                        {t("daily_hours")}
                      </label>
                      <input
                        type="number"
                        value={planHours}
                        onChange={(e) => setPlanHours(parseFloat(e.target.value))}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                      />
                    </div>
                    <button
                      onClick={handleGeneratePlan}
                      disabled={loading || !planGoal || !planDate}
                      className="mt-7 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        t("generate_plan")
                      )}
                    </button>
                  </div>
                </div>

                {planResult && (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h3 className="text-xl font-bold mb-2">{planResult.summary}</h3>
                    <p className="text-sm text-slate-500 mb-8">
                      {t("target_date")}: {planResult.target_date}
                    </p>

                    <div className="space-y-8">
                      {planResult.weekly_breakdown?.map((week: any, i: number) => (
                        <div key={i} className="relative pl-8 border-l-2 border-blue-500/20">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary" />
                          <h4 className="font-bold text-lg mb-4 text-primary">
                            {t("week_label")} {week.week}: {week.focus}
                          </h4>
                          <div className="grid gap-4">
                            {week.days?.map((day: any, j: number) => (
                              <div
                                key={j}
                                className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                              >
                                <p className="font-bold text-sm mb-1">
                                  {t("day_label")} {day.day} — {day.topic}
                                </p>
                                <p className="text-xs text-slate-500 italic">
                                  {day.material}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activePanel === "flashcards" && (
              <motion.div
                key="flashcards"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {flashcards.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                    <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Zap className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">{t("dash_flashcards")}</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">{t("flashcards_hint")}</p>
                    <button
                      onClick={handleGenerateFlashcards}
                      disabled={loading}
                      className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 mx-auto"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("generate_flashcards")}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-8">
                    <div className="w-full max-w-sm h-80 perspective-1000">
                      <motion.div
                        animate={{ rotateY: isCardFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                        className="relative w-full h-full cursor-pointer preserve-3d"
                      >
                        {/* Front */}
                        <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 shadow-xl flex flex-col items-center justify-center p-8 text-center">
                          <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-4">{t("flashcard_front")}</span>
                          <p className="text-xl font-bold leading-tight">{flashcards[currentCardIndex].front}</p>
                        </div>
                        {/* Back */}
                        <div 
                          className="absolute inset-0 backface-hidden bg-primary rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-8 text-center text-white"
                          style={{ transform: "rotateY(180deg)" }}
                        >
                          <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-60 mb-4">{t("flashcard_back")}</span>
                          <p className="text-xl font-bold leading-tight">{flashcards[currentCardIndex].back}</p>
                        </div>
                      </motion.div>
                    </div>

                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => {
                          setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                          setIsCardFlipped(false);
                        }}
                        className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
                      >
                        <ChevronRight className="h-6 w-6 rotate-180" />
                      </button>
                      <div className="text-sm font-black text-slate-400">
                        {currentCardIndex + 1} / {flashcards.length}
                      </div>
                      <button
                        onClick={() => {
                          setCurrentCardIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
                          setIsCardFlipped(false);
                        }}
                        className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </div>

                    <button
                      onClick={handleGenerateFlashcards}
                      className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t("generate_flashcards")}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activePanel === "gaps" && (
              <motion.div
                key="gaps"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                  <Brain className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">{t("gaps_title")}</h3>
                  <p className="text-slate-500 mb-6">{t("gaps_hint")}</p>
                  <button
                    onClick={handleGenerateGaps}
                    disabled={loading}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      t("generate_gaps")
                    )}
                  </button>
                </div>
                {gapsResult && (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {typeof gapsResult === "string" ? (
                      <pre className="whitespace-pre-wrap text-sm">{gapsResult}</pre>
                    ) : (
                      <div className="space-y-6">
                        {gapsResult.summary && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                              {gapsResult.summary}
                            </p>
                          </div>
                        )}
                        
                        <div className="grid sm:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-bold mb-4 flex items-center gap-2 text-green-500">
                              <CheckCircle2 className="h-4 w-4" /> {t("gaps_mastered")}
                            </h4>
                            <ul className="space-y-2">
                              {(gapsResult.strengths || gapsResult.mastered || [])?.map((topic: string, i: number) => (
                                <li key={i} className="text-sm p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                  {topic}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-bold mb-4 flex items-center gap-2 text-red-500">
                              <AlertCircle className="h-4 w-4" /> {t("gaps_to_improve")}
                            </h4>
                            <ul className="space-y-2">
                              {(gapsResult.gaps || gapsResult.to_improve || [])?.map((topic: string, i: number) => (
                                <li key={i} className="text-sm p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                  {topic}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {(gapsResult.recommended_sections || gapsResult.revisit_materials) && (
                          <div>
                            <h4 className="font-bold mb-4">{t("gaps_revisit")}</h4>
                            <div className="grid gap-3">
                              {(gapsResult.recommended_sections || gapsResult.revisit_materials || []).map((item: any, i: number) => (
                                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                  <div>
                                    <p className="font-bold text-sm">{item.reason || item.topic}</p>
                                    <p className="text-xs text-slate-500">{item.material}</p>
                                  </div>
                                  <button
                                    onClick={() => handleRevisitMaterial(item.material || item.filename || String(item))}
                                    className="text-primary hover:underline text-sm font-medium"
                                  >
                                    {t("revisit_btn")} →
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activePanel === "subscription" && (
              <motion.div
                key="subscription"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-12 -mt-12 -mr-12 bg-primary/10 rounded-full blur-3xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-14 w-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        <CreditCard className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">{t("subscription_title")}</h3>
                        <p className="text-sm text-slate-500">
                          {t("subscription_plan")}:{" "}
                          <span className={subscriptionStatus?.is_premium ? "text-purple-500 font-bold" : "font-semibold"}>
                            {subscriptionStatus?.is_premium
                              ? t("subscription_premium")
                              : t("subscription_free")}
                          </span>
                        </p>
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-xl">
                      {t("subscription_hint")}
                    </p>

                    {subscriptionStatus && (
                      <div className="grid sm:grid-cols-3 gap-4 mb-8">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <p className="text-xs text-slate-500">Quizzes today</p>
                          <p className="font-bold">{subscriptionStatus.quiz_today} / {subscriptionStatus.quiz_limit}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <p className="text-xs text-slate-500">Uploads</p>
                          <p className="font-bold">{subscriptionStatus.uploads_count} / {subscriptionStatus.uploads_limit}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <p className="text-xs text-slate-500">Chats today</p>
                          <p className="font-bold">{subscriptionStatus.chat_today} / {subscriptionStatus.chat_limit}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-8">
                      {!subscriptionStatus?.is_premium ? (
                        <div className="space-y-6">
                          <button
                            onClick={() => setShowPaymentSelection(true)}
                            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/25 flex items-center gap-3"
                          >
                            <Zap className="h-5 w-5 fill-white" />
                            {t("subscription_upgrade")}
                          </button>

                          <div className="space-y-4">
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Supported payment methods</p>
                            <div className="flex flex-wrap gap-6 items-center">
                              {/* Payme */}
                              <div className="flex items-center gap-2 group cursor-default">
                                <div className="h-8 w-8 bg-[#00c2ed] rounded-lg flex items-center justify-center shadow-md shadow-[#00c2ed]/20 group-hover:scale-110 transition-transform">
                                  <span className="text-white font-black text-xs">P</span>
                                </div>
                                <span className="text-sm font-black tracking-tighter text-slate-400 group-hover:text-[#00c2ed] transition-colors">Payme</span>
                              </div>
                              {/* Click */}
                              <div className="flex items-center gap-2 group cursor-default">
                                <div className="h-8 w-8 bg-[#00a6ff] rounded-lg flex items-center justify-center shadow-md shadow-[#00a6ff]/20 group-hover:scale-110 transition-transform text-white font-bold text-[10px]">
                                  CLICK
                                </div>
                                <span className="text-sm font-black tracking-tighter text-slate-400 group-hover:text-[#00a6ff] transition-colors">Click</span>
                              </div>
                              {/* Stripe */}
                              <div className="flex items-center gap-2 group cursor-default">
                                <div className="h-8 w-8 bg-[#635bff] rounded-lg flex items-center justify-center shadow-md shadow-[#635bff]/20 group-hover:scale-110 transition-transform text-white font-bold text-[10px]">
                                  S
                                </div>
                                <span className="text-sm font-black tracking-tighter text-slate-400 group-hover:text-[#635bff] transition-colors">Stripe</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleCancelSubscription}
                          disabled={loading}
                          className="px-6 py-3 border-2 border-red-500/20 text-red-500 rounded-xl font-bold hover:bg-red-500/5 transition-all disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                          ) : (
                            t("subscription_cancel")
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activePanel === "feedback" && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t("feedback_title")}</h3>
                      <p className="text-sm text-slate-500">{t("feedback_hint")}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("feedback_rating")}
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setFeedbackRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-8 w-8 transition-all ${
                                star <= feedbackRating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("feedback_message")}
                      </label>
                      <textarea
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        rows={6}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                      />
                    </div>
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={loading || !feedbackMessage.trim()}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        t("feedback_submit")
                      )}
                    </button>
                    {feedbackStatus.msg && (
                      <div
                        className={`mt-4 flex items-center gap-2 text-sm font-medium ${
                          feedbackStatus.type === "success"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {feedbackStatus.type === "success" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        {feedbackStatus.msg}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activePanel === "telegram" && (
              <motion.div
                key="telegram"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl"
              >
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-primary">
                      <Send className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t("dash_telegram")}</h3>
                      <p
                        className={`text-sm font-medium ${
                          stats.tgLinked ? "text-green-500" : "text-slate-500"
                        }`}
                      >
                        {stats.tgLinked ? t("tg_linked") : t("tg_not_linked")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {t("tg_hint")}
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-500">
                          {t("email")}
                        </span>
                        <span className="font-mono text-sm">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-500">
                          {t("streak_label")}
                        </span>
                        <span className="font-bold text-green-500">
                          {stats.streak} Days
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <label className="block text-sm font-medium text-slate-500 mb-2">
                          Daily Reminder Time
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="time"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                          />
                          <button
                            onClick={handleSaveReminder}
                            disabled={loading}
                            className="px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                        {reminderStatus.msg && (
                          <p className={`mt-2 text-sm ${reminderStatus.type === "success" ? "text-green-500" : "text-red-500"}`}>
                            {reminderStatus.msg}
                          </p>
                        )}
                      </div>
                    </div>

                    {!stats.tgLinked && (
                      <a
                        href="https://t.me/ai_incubator_bot"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-4 bg-[#0088cc] text-white rounded-xl font-bold hover:bg-[#0077b5] transition-all flex items-center justify-center gap-2"
                      >
                        <Send className="h-5 w-5" />
                        Open Telegram Bot
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activePanel === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Learning Settings</h3>
                      <p className="text-sm text-slate-500">Set your learning goal and target date</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">Learning Goal</label>
                      <textarea
                        value={settingsGoal}
                        onChange={(e) => setSettingsGoal(e.target.value)}
                        placeholder="e.g. Master Python for data science, learn conversational English..."
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary resize-none h-28"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Target Date</label>
                      <input
                        type="date"
                        value={settingsTargetDate}
                        onChange={(e) => setSettingsTargetDate(e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <button
                      onClick={handleSaveSettings}
                      disabled={loading}
                      className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 transition-all"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Save Settings"}
                    </button>
                    {settingsStatus.msg && (
                      <div className={`flex items-center gap-2 text-sm font-medium ${settingsStatus.type === "success" ? "text-green-500" : "text-red-500"}`}>
                        {settingsStatus.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {settingsStatus.msg}
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold mb-4">Account Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-sm text-slate-500">Name</span>
                      <span className="text-sm font-bold">{user?.name}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-sm text-slate-500">Email</span>
                      <span className="text-sm font-bold">{user?.email}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-sm text-slate-500">Plan</span>
                      <span className={`text-sm font-bold ${subscriptionStatus?.is_premium ? "text-primary" : "text-slate-500"}`}>
                        {subscriptionStatus?.is_premium ? "Premium" : "Free"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Payment Selection Modal */}
      <AnimatePresence>
        {showPaymentSelection && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentSelection(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8"
            >
              <h3 className="text-2xl font-black mb-2 tracking-tight">Select Payment</h3>
              <p className="text-slate-500 text-sm mb-8">Choose your preferred payment method</p>
              
              <div className="grid gap-3">
                {[
                  { id: "payme", label: "Payme", color: "bg-[#00c2ed]", text: "P", desc: "Local payment (UZS)" },
                  { id: "click", label: "Click", color: "bg-[#00a6ff]", text: "C", desc: "Local payment (UZS)" },
                  { id: "stripe", label: "Stripe", color: "bg-[#635bff]", text: "S", desc: "International (USD)" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleUpgradeSubscription(m.id as any)}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className={`h-12 w-12 ${m.color} rounded-xl flex items-center justify-center shadow-lg shadow-black/10 text-white font-black text-xl group-hover:scale-110 transition-transform`}>
                      {m.text}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{m.label}</p>
                      <p className="text-xs text-slate-500">{m.desc}</p>
                    </div>
                    <ChevronRight className="ml-auto h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowPaymentSelection(false)}
                className="w-full mt-6 py-3 text-slate-500 font-medium text-sm hover:text-slate-700 dark:hover:text-slate-300"
              >
                Back to Dashboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Simulation Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className={`${
                paymentMethod === 'payme' ? "bg-[#00c2ed]" : 
                paymentMethod === 'click' ? "bg-[#00a6ff]" : "bg-[#635bff]"
              } p-10 flex flex-col items-center justify-center text-white relative`}>
                <div className="bg-white p-5 rounded-3xl mb-4 shadow-xl">
                  <div className={`${
                    paymentMethod === 'payme' ? "text-[#00c2ed]" : 
                    paymentMethod === 'click' ? "text-[#00a6ff]" : "text-[#635bff]"
                  } font-black text-4xl tracking-tighter uppercase`}>
                    {paymentMethod}
                  </div>
                </div>
                <h3 className="text-2xl font-black tracking-tight capitalize">{paymentMethod} Checkout</h3>
                <p className="opacity-80 text-sm font-medium mt-1">Simulation — No real money charged</p>
              </div>
              
              <div className="p-10 space-y-8">
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Service</span>
                    <span className="font-bold text-slate-900 dark:text-white">Ilm AI Premium</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Frequency</span>
                    <span className="font-bold text-slate-900 dark:text-white">Monthly</span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-black text-lg">Total</span>
                    <span className={`text-3xl font-black ${
                      paymentMethod === 'payme' ? "text-[#00c2ed]" : 
                      paymentMethod === 'click' ? "text-[#00a6ff]" : "text-[#635bff]"
                    }`}>
                      {paymentMethod === 'stripe' ? "$2.99" : "29,000 UZS"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={confirmTestPayment}
                    disabled={loading}
                    className={`w-full py-5 ${
                      paymentMethod === 'payme' ? "bg-[#00c2ed] shadow-[#00c2ed]/20" : 
                      paymentMethod === 'click' ? "bg-[#00a6ff] shadow-[#00a6ff]/20" : "bg-[#635bff] shadow-[#635bff]/20"
                    } text-white rounded-[1.25rem] font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl flex items-center justify-center gap-3`}
                  >
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Complete Transaction"}
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full py-2 text-slate-400 font-bold text-sm hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Cancel and return
                  </button>
                </div>

                <div className="flex justify-center items-center gap-3 opacity-20 grayscale">
                  <Shield className="h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-widest font-black">Securely encrypted by {paymentMethod}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
