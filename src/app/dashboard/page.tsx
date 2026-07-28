"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ChevronDown,
  BookText,
  Building2,
  Star,
  Copy,
  Volume2,
  Mic,
  Camera,
  Zap,
  Shield,
  RotateCcw,
  Trash2,
  Target,
  TrendingUp,
  Award,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Trophy,
} from "lucide-react";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import AssistantDashboard from "./assistant/AssistantDashboard";
import ReviewDashboard from "./review/ReviewDashboard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

const PRESET_AVATARS = [
  "/avatars/avatar-1.svg",
  "/avatars/avatar-2.svg",
  "/avatars/avatar-3.svg",
  "/avatars/avatar-4.svg",
  "/avatars/avatar-5.svg",
  "/avatars/avatar-6.svg",
  "/avatars/avatar-7.svg",
  "/avatars/avatar-8.svg",
];

// Downscale any picked image to a small square JPEG data URI so it fits in the
// user's profile record and stays light to ship on every auth response.
function fileToAvatarDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const size = 128;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        // Cover-crop to a centered square.
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Smooth SVG area/line chart for the score-trend series — replaces the old
// bar-height hack with something that reads like a real analytics chart.
function ScoreTrendChart({ points }: { points: { score_pct: number }[] }) {
  const width = 600;
  const height = 140;
  const padY = 16;
  const n = points.length;
  const stepX = n > 1 ? width / (n - 1) : width;
  const coords = points.map((p, i) => {
    const x = n > 1 ? i * stepX : width / 2;
    const y = padY + (1 - Math.max(0, Math.min(100, p.score_pct)) / 100) * (height - padY * 2);
    return [x, y] as const;
  });
  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1][0]},${height} L${coords[0][0]},${height} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" preserveAspectRatio="none">
        <defs>
          <linearGradient id="scoreTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={width}
            y1={padY + f * (height - padY * 2)}
            y2={padY + f * (height - padY * 2)}
            stroke="currentColor"
            strokeDasharray="4 5"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth={1}
          />
        ))}
        <path d={areaPath} fill="url(#scoreTrendFill)" />
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4} className="fill-white dark:fill-slate-900" stroke="#6366f1" strokeWidth={2.5} />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {points.map((p, i) => (
          <span key={i} className="text-[10px] font-bold text-slate-400 flex-1 text-center first:text-left last:text-right">
            {p.score_pct}%
          </span>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user, login, logout, isLoading: authLoading } = useAuth();
  const { t, lang } = useI18n();
  const { themeMode, setThemeMode } = useTheme();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Deep-link a panel via ?panel=… so the AI companion (and any other link) can
  // send the learner straight to Quiz / Materials / Flashcards / Review / Gaps.
  useEffect(() => {
    const panel = new URLSearchParams(window.location.search).get("panel");
    const allowed = ["overview", "quiz", "files", "flashcards", "chat", "assistant", "plans", "gaps", "review", "telegram", "settings", "subscription"];
    if (panel && allowed.includes(panel)) setActivePanel(panel);
  }, []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [platformMenuOpen, setPlatformMenuOpen] = useState(false);

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
      alert(t("assistant_speech_unsupported"));
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
  const [paymentMethod, setPaymentMethod] = useState<"payme" | "click" | null>(null);
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);

  // Flashcards State
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Quiz Stats State
  const [quizStats, setQuizStats] = useState<any>(null);

  // Today's Plan State
  const [todayPlan, setTodayPlan] = useState<any>(null);

  // Settings State
  const [settingsGoal, setSettingsGoal] = useState("");
  const [settingsTargetDate, setSettingsTargetDate] = useState("");
  const [settingsStatus, setSettingsStatus] = useState<{ msg: string; type: "success" | "error" | null }>({ msg: "", type: null });

  // Profile (name + avatar) editing
  const [settingsFirstName, setSettingsFirstName] = useState("");
  const [settingsLastName, setSettingsLastName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ msg: string; type: "success" | "error" | null }>({ msg: "", type: null });

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
        const planData = await apiFetch(`/plan/${user?.id}/today`);
        setTodayPlan(planData);
      } catch {
        setTodayPlan(null);
      }

      try {
        const profile = await apiFetch(`/auth/profile/${user?.id}`);
        setSettingsGoal(profile.learning_goal || "");
        setSettingsTargetDate(profile.target_date || "");
        {
          const full = (profile.name || user?.name || "").trim();
          const parts = full.split(/\s+/);
          setSettingsFirstName(parts[0] || "");
          setSettingsLastName(parts.slice(1).join(" "));
        }
        setAvatar(profile.profile_picture || "");
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
      alert(t("free_tier_file_limit"));
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
      alert(t("free_tier_file_limit"));
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
      setReminderStatus({ msg: t("reminder_save_success"), type: "success" });
    } catch {
      setReminderStatus({ msg: t("reminder_save_error"), type: "error" });
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
      alert(t("file_delete_error_prefix") + " " + err.message);
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
      setSettingsStatus({ msg: t("settings_save_success"), type: "success" });
    } catch (err: any) {
      setSettingsStatus({ msg: t("settings_save_error"), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileStatus({ msg: t("avatar_invalid"), type: "error" });
      return;
    }
    try {
      const dataUri = await fileToAvatarDataUri(file);
      setAvatar(dataUri);
      setProfileStatus({ msg: "", type: null });
    } catch {
      setProfileStatus({ msg: t("avatar_invalid"), type: "error" });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const name = `${settingsFirstName.trim()} ${settingsLastName.trim()}`.trim();
    if (!name) {
      setProfileStatus({ msg: t("profile_name_required"), type: "error" });
      return;
    }
    setSavingProfile(true);
    setProfileStatus({ msg: "", type: null });
    try {
      await apiFetch("/auth/update-profile", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, name, avatar }),
      });
      // Refresh the local session so the sidebar/header update immediately.
      login({ ...user, name, profile_picture: avatar || undefined });
      setProfileStatus({ msg: t("settings_save_success"), type: "success" });
    } catch {
      setProfileStatus({ msg: t("settings_save_error"), type: "error" });
    } finally {
      setSavingProfile(false);
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
      alert(t("quiz_limit_reached").replace("{limit}", String(subscriptionStatus?.quiz_limit)));
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
        alert(t("quiz_no_questions"));
      }
      setQuizResult(data.questions || []);
    } catch (err: any) {
      alert(`${t("quiz_error_prefix")} ${err.message}`);
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
      alert(t("flashcards_gen_error"));
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
      alert(`${t("plan_error_prefix")} ${err.message}`);
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

  const handleUpgradeSubscription = async (method: "payme" | "click") => {
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
      alert(t("payment_confirm_error"));
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
    { id: "overview", label: t("overview"), icon: LayoutDashboard, section: "main" },
    { id: "files", label: t("dash_files"), icon: FileText, section: "learn" },
    { id: "chat", label: t("dash_chat"), icon: MessageSquare, section: "learn" },
    { id: "assistant", label: t("dash_assistant") || "AI Yordamchi", icon: Sparkles, section: "learn" },
    { id: "quiz", label: t("dash_quiz"), icon: GraduationCap, section: "learn" },
    { id: "plans", label: t("dash_plan"), icon: Calendar, section: "learn" },
    { id: "flashcards", label: t("dash_flashcards"), icon: Zap, section: "learn" },
    { id: "gaps", label: t("dash_gaps"), icon: Brain, section: "learn" },
    { id: "review", label: t("dash_review") || "Takrorlash", icon: RotateCcw, section: "learn" },
    // Subscription hidden during beta — everything is free for now.
    { id: "feedback", label: t("dash_feedback"), icon: MessageCircle, section: "account" },
    { id: "telegram", label: t("dash_telegram"), icon: Send, section: "account" },
    { id: "settings", label: t("settings") || "Settings", icon: Settings, section: "account" },
  ];
  const sectionLabels: Record<string, string> = {
    main: lang === "uz" ? "Asosiy" : lang === "ru" ? "Главное" : "Main",
    learn: lang === "uz" ? "O'quv vositalari" : lang === "ru" ? "Обучение" : "Learning",
    account: lang === "uz" ? "Hisob" : lang === "ru" ? "Аккаунт" : "Account",
  };

  return (
    <div className="flex h-screen bg-transparent overflow-hidden text-slate-900 dark:text-slate-100 relative z-10">
      {/* Mobile backdrop — tap to close the drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — off-canvas drawer on mobile, in-flow collapsible rail on desktop.
          Always-dark surface (independent of the light/dark toggle) for a premium,
          consistent "app shell" feel — matches the SAT/IELTS platform's dark accents. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] transform transition-transform duration-300 md:relative md:translate-x-0 md:transition-[width] ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${isSidebarOpen ? "md:w-[280px]" : "md:w-20"} bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 flex flex-col shadow-2xl shadow-black/20`}
      >
        <div className="p-6 flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 ring-1 ring-white/10">
            <img src="/logo-icon.png" alt="Ilm AI" className="h-full w-full object-cover" />
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-xl whitespace-nowrap bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{t("brand")}</span>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {menuItems.map((item, i) => (
            <div key={item.id}>
              {isSidebarOpen && (i === 0 || item.section !== menuItems[i - 1].section) && (
                <p className="px-4 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">
                  {sectionLabels[item.section]}
                </p>
              )}
              <button
                onClick={() => { setActivePanel(item.id); setIsMobileMenuOpen(false); }}
                className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
                  activePanel === item.id
                    ? "text-white"
                    : "hover:bg-white/5 text-slate-400 hover:text-slate-100"
                }`}
              >
                {activePanel === item.id && (
                  <motion.div
                    layoutId="active-nav-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/30"
                  />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0 relative z-10" />
                {isSidebarOpen && <span className="font-medium text-[13.5px] whitespace-nowrap relative z-10">{item.label}</span>}
              </button>
            </div>
          ))}
        </nav>

        {isSidebarOpen && (
          <button
            onClick={() => setActivePanel("subscription")}
            className="mx-4 mb-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/[0.07] transition-all text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold text-white">
                {subscriptionStatus?.is_premium
                  ? t("subscription_premium")
                  : lang === "uz" ? "Premium'ga o'ting" : lang === "ru" ? "Перейти на Premium" : "Go Premium"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              {subscriptionStatus?.is_premium
                ? t("subscription_hint")
                : lang === "uz" ? "Cheklovsiz kvizlar, yuklamalar va tahlillar" : lang === "ru" ? "Безлимитные тесты, файлы и аналитика" : "Unlimited quizzes, uploads & analytics"}
            </p>
          </button>
        )}

        {isSidebarOpen && (
          <div className="px-4 pb-3 dark">
            <LanguageSwitcher />
          </div>
        )}

        <div className="p-3 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {isSidebarOpen && <span className="font-medium text-[13.5px]">{t("dash_logout")}</span>}
          </button>
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 h-6 w-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full items-center justify-center shadow-sm z-50 hover:bg-slate-50 hidden md:flex"
        >
          {isSidebarOpen ? <X className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative min-w-0">
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/70 pt-6 pb-5 px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => { setIsMobileMenuOpen(true); setIsSidebarOpen(true); }}
              className="md:hidden shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{lang === "uz" ? "Xush kelibsiz" : lang === "ru" ? "Добро пожаловать" : "Welcome back"}</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {menuItems.find((i) => i.id === activePanel)?.label}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {/* Platform switcher — pick SAT / IELTS / College App directly */}
            <div className="relative">
              <button
                onClick={() => setPlatformMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-bold shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
              >
                <Trophy className="h-4 w-4" />
                <span className="hidden xs:inline">{t("dash_courses") || "Kurslar"}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${platformMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {platformMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPlatformMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 z-50 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                    {[
                      { href: "/sat", label: "SAT", sub: "Digital SAT prep", icon: GraduationCap, color: "text-blue-600" },
                      { href: "/sat/ielts", label: "IELTS", sub: "All four skills", icon: BookText, color: "text-violet-600" },
                      { href: "/sat/college", label: "College App", sub: "6,000+ universities", icon: Building2, color: "text-teal-600" },
                      { href: "/skills", label: "Fanlar", sub: "Ona tili, Tarix va boshqalar", icon: Trophy, color: "text-emerald-600" },
                      { href: "/course", label: "Materialdan kurs", sub: "Yuklagan materialingizdan kurs", icon: Sparkles, color: "text-violet-600" },
                    ].map((p) => (
                      <Link
                        key={p.href}
                        href={p.href}
                        onClick={() => setPlatformMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <p.icon className={`h-5 w-5 shrink-0 ${p.color}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{p.label}</p>
                          <p className="text-xs text-slate-400">{p.sub}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 ml-auto text-slate-300" />
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setActivePanel("settings")}
              className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="h-9 w-9 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md overflow-hidden ring-2 ring-white dark:ring-slate-900">
                {user?.profile_picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profile_picture} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || "U"
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{user?.name || "User"}</p>
                <p className="text-xs text-slate-400 leading-tight">{user?.email}</p>
              </div>
            </button>
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
                className="space-y-6 mt-4"
              >
                {/* Hero greeting strip */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 sm:p-7 text-white shadow-xl shadow-slate-900/10">
                  <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/30 blur-3xl" />
                  <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
                  <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400 font-medium">
                        {lang === "uz" ? "Xush kelibsiz" : lang === "ru" ? "Добро пожаловать" : "Welcome back"}
                      </p>
                      <h3 className="text-2xl font-bold mt-0.5">{user?.name?.split(" ")[0] || t("brand")} 👋</h3>
                    </div>
                    {stats.streak > 0 && (
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/10">
                        <span className="text-xl">🔥</span>
                        <div>
                          <p className="text-lg font-bold leading-none">{stats.streak} {t("days_suffix")}</p>
                          <p className="text-[11px] text-slate-400 leading-none mt-1">{t("streak_label")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Stats Grid */}
                <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: t("dash_files"), value: stats.files, icon: FileText, color: "from-blue-500 to-blue-400", tint: "bg-blue-500/10 text-blue-500" },
                    { label: t("streak_label"), value: `${stats.streak} ${t("days_suffix")}`, icon: CheckCircle2, color: "from-green-500 to-emerald-400", tint: "bg-green-500/10 text-green-500" },
                    { label: t("stat_sessions"), value: quizStats?.sessions_completed || 0, icon: GraduationCap, color: "from-orange-500 to-amber-400", tint: "bg-orange-500/10 text-orange-500" },
                    { label: t("stat_avg_score"), value: `${quizStats?.average_score || 0}%`, icon: TrendingUp, color: "from-emerald-500 to-teal-400", tint: "bg-emerald-500/10 text-emerald-500" },
                    { label: t("stat_questions"), value: quizStats?.total_questions || 0, icon: Award, color: "from-pink-500 to-rose-400", tint: "bg-pink-500/10 text-pink-500" },
                    { label: t("dash_telegram"), value: stats.tgLinked ? t("tg_linked") : t("tg_not_linked"), icon: Send, color: "from-purple-500 to-violet-400", tint: "bg-purple-500/10 text-purple-500" },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-800 group hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <div className={`h-10 w-10 ${stat.tint} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
                      <p className="text-xl font-bold mt-1 tracking-tight">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Today's Plan */}
                {todayPlan && todayPlan.status === "today" && todayPlan.day && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/20 dark:border-primary/30 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center"><Calendar className="h-3.5 w-3.5" /></span>
                        {t("plan_today_title")}
                      </h3>
                      <span className="text-[11px] font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                        {t("day_label")} {todayPlan.days_elapsed + 1}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{todayPlan.day.topic}</p>
                    {Array.isArray(todayPlan.day.tasks) &&
                      todayPlan.day.tasks.slice(0, 3).map((task: string, i: number) => (
                        <p key={i} className="text-sm text-slate-500 mb-1">
                          • {task}
                        </p>
                      ))}
                    <p className="text-xs text-slate-400 mt-3 font-semibold">
                      ⏱ {todayPlan.day.duration_minutes} {t("plan_today_minutes")}
                    </p>
                  </div>
                )}
                {todayPlan && todayPlan.status === "no_plan" && (
                  <button
                    onClick={() => setActivePanel("plans")}
                    className="w-full text-left bg-white dark:bg-slate-900 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-primary/[0.02] transition-all"
                  >
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
                      {t("plan_no_plan_title")}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{t("plan_no_plan_cta")}</p>
                  </button>
                )}
                {todayPlan && todayPlan.status === "finished" && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-green-500/30 text-center shadow-sm">
                    <p className="font-bold text-sm text-green-600 dark:text-green-400">
                      {t("plan_finished")}
                    </p>
                  </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Score Trend Chart */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 min-h-[200px] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" /> {t("chart_title")}
                      </h3>
                      {quizStats?.score_trend && quizStats.score_trend.length > 1 && (() => {
                        const trend = quizStats.score_trend;
                        const delta = trend[trend.length - 1].score_pct - trend[0].score_pct;
                        const up = delta >= 0;
                        return (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${up ? "text-emerald-600 bg-emerald-500/10" : "text-red-500 bg-red-500/10"}`}>
                            {up ? "▲" : "▼"} {Math.abs(Math.round(delta))}%
                          </span>
                        );
                      })()}
                    </div>
                    {quizStats?.score_trend && quizStats.score_trend.length > 0 ? (
                      <ScoreTrendChart points={quizStats.score_trend} />
                    ) : (
                      <div className="flex items-center justify-center h-32 text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        {t("chart_empty")}
                      </div>
                    )}
                  </div>

                  {/* Topics Covered */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-500" /> {t("topics_covered_title")}
                    </h3>
                    {quizStats?.topics_covered && quizStats.topics_covered.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {quizStats.topics_covered.map((topic: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full capitalize">
                            {topic}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm">
                        {t("topics_covered_empty")}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activePanel === "files" && (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 mt-4"
              >
                <div className="grid lg:grid-cols-2 gap-6 items-start">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-colors text-center">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-1.5">{t("dash_upload")}</h3>
                    <p className="text-slate-500 text-sm mb-6">{t("upload_hint")}</p>

                    <div className="max-w-md mx-auto mb-5 text-left">
                      <label className="block text-sm font-medium mb-1.5">{t("topic_label")}</label>
                      <input
                        type="text"
                        value={uploadTopic}
                        onChange={(e) => setUploadTopic(e.target.value)}
                        placeholder={t("topic_placeholder")}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all inline-flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4 text-slate-400" />
                        {selectedFile ? selectedFile.name : t("select_file")}
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
                        className="cursor-pointer px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all inline-flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4 text-slate-400" />
                        {t("take_photo")}
                      </label>
                    </div>

                    {selectedFile && (
                      <button
                        onClick={handleFileUpload}
                        disabled={loading}
                        className="px-10 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
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

                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 h-full">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-11 w-11 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold leading-tight">{t("paste_content_title")}</h3>
                        <p className="text-slate-500 text-xs">{t("paste_content_desc")}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={pasteTitle}
                        onChange={(e) => setPasteTitle(e.target.value)}
                        placeholder={t("paste_title_placeholder")}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
                      />
                      <textarea
                        value={pasteContent}
                        onChange={(e) => setPasteContent(e.target.value)}
                        rows={6}
                        placeholder={t("paste_content_placeholder")}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                      <button
                        onClick={handleTextUpload}
                        disabled={loading || !pasteContent.trim()}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all"
                      >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : t("save_pasted_content")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" /> {t("dash_files")}
                    </h3>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                      {files.length} {t("files_count_label")}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {files && files.length > 0 ? (
                      files.map((file, i) => (
                        <div
                          key={i}
                          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 shrink-0 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{typeof file === 'string' ? file : file.filename}</p>
                              {file.topic && <p className="text-[10px] text-slate-500 uppercase tracking-wider">{file.topic}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {file.chunks && (
                              <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500">
                                {file.chunks} {t("chunks_label")}
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteFile(typeof file === 'string' ? file : file.filename)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              title={t("delete_file_title")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-slate-500 text-sm">
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
                className="mt-4 h-[calc(100vh-200px)] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="h-20 w-20 bg-gradient-to-br from-primary/15 to-secondary/15 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="h-10 w-10 text-primary" />
                      </div>
                      <p className="font-bold text-lg">{t("ask_placeholder")}</p>
                      <p className="text-sm text-slate-500 max-w-xs mt-2">{t("chat_empty_desc")}</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex items-end gap-2 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl relative group shadow-sm ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-primary to-secondary text-white rounded-br-md"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
                                alert(t("copied_msg"));
                              }}
                              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title={t("copy_clipboard_title")}
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                // Stop any ongoing speech
                                window.speechSynthesis.cancel();
                                const utterance = new SpeechSynthesisUtterance(msg.content);
                                // Pick best available voice
                                const voices = window.speechSynthesis.getVoices();
                                const preferred = voices.find(v =>
                                  v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
                                ) || voices.find(v => v.lang.startsWith("en"))
                                  || voices.find(v => v.lang.startsWith("ru"))
                                  || voices[0];
                                if (preferred) utterance.voice = preferred;
                                utterance.rate = 0.95;
                                utterance.pitch = 1.05;
                                utterance.volume = 1;
                                window.speechSynthesis.speak(utterance);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                              title={t("listen_title")}
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
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                  <div className="relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={t("ask_placeholder")}
                      className="w-full pl-6 pr-24 py-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                    <div className="absolute right-2 top-2 flex gap-2">
                      <button
                        onClick={startListening}
                        className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                          isListening
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }`}
                        title={t("voice_input_title")}
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleSendMessage}
                        className="h-10 w-10 bg-gradient-to-br from-primary to-secondary text-white rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
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
                className="space-y-6 mt-4"
              >
                {!quizResult || quizResult.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-11 w-11 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{t("dash_quiz")}</h3>
                        <p className="text-xs text-slate-500">{t("upload_hint")}</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t("difficulty")}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["easy", "medium", "hard"] as const).map((d) => (
                            <button
                              key={d}
                              onClick={() => setQuizDifficulty(d)}
                              className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                quizDifficulty === d
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/40"
                              }`}
                            >
                              {t(d)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t("num_questions")}
                        </label>
                        <input
                          type="number"
                          value={quizCount}
                          onChange={(e) => setQuizCount(parseInt(e.target.value))}
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary h-[42px]"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> {t("generate_quiz")}
                        </>
                      )}
                    </button>
                  </div>
                ) : answeredQuestions.length === quizResult.length ? (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                    {(() => {
                      const pct = Math.round((score / quizResult.length) * 100);
                      const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
                      const r = 54;
                      const c = 2 * Math.PI * r;
                      return (
                        <svg viewBox="0 0 140 140" className="h-36 w-36 mx-auto mb-2 -rotate-90">
                          <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
                          <circle
                            cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
                            style={{ transition: "stroke-dashoffset 0.8s ease" }}
                          />
                          <text x="70" y="76" textAnchor="middle" className="rotate-90 origin-center fill-slate-900 dark:fill-white font-black" style={{ fontSize: 28, transform: "rotate(90deg)", transformOrigin: "70px 70px" }}>
                            {pct}%
                          </text>
                        </svg>
                      );
                    })()}
                    <h3 className="text-2xl font-bold mb-1">
                      {t("your_score")}: {score}/{quizResult.length}
                    </h3>
                    <p className="text-slate-500 mb-6 text-sm">{t("dash_quiz")} {t("chart_title")}</p>
                    <button
                      onClick={handleGenerateQuiz}
                      className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:opacity-90 transition-all inline-flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" /> {t("restart_quiz")}
                    </button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {t("dash_quiz")} {currentQuestionIndex + 1}/{quizResult.length}
                        </span>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                          {t("your_score")}: {score}/{answeredQuestions.length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(answeredQuestions.length / quizResult.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-6 leading-snug">
                      {quizResult[currentQuestionIndex].question}
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
                              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                                selectedAnswer === opt
                                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                                  : answeredQuestions.includes(currentQuestionIndex) && opt === quizResult[currentQuestionIndex].correct_answer
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                                  : answeredQuestions.includes(currentQuestionIndex) && selectedAnswer === opt && opt !== quizResult[currentQuestionIndex].correct_answer
                                  ? "border-red-500 bg-red-50 dark:bg-red-900/30"
                                  : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-primary/40"
                              }`}
                            >
                              <span className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black ${
                                selectedAnswer === opt ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                              }`}>
                                {String.fromCharCode(65 + j)}
                              </span>
                              <span className="flex-1">{opt}</span>
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
                          placeholder={t("type_answer_placeholder")}
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
                          placeholder={t("explain_answer_placeholder")}
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
                        className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
                      >
                        {t("check_answer")}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-xl border flex gap-3 ${
                          selectedAnswer === quizResult[currentQuestionIndex].correct_answer
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        }`}>
                          {selectedAnswer === quizResult[currentQuestionIndex].correct_answer ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          )}
                          <div>
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
                              <span className="font-medium">{t("your_answer_label")}</span> {selectedAnswer || "—"}
                            </p>
                            {selectedAnswer !== quizResult[currentQuestionIndex].correct_answer && (
                              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                <span className="font-medium">{t("correct_answer_label")}</span> {quizResult[currentQuestionIndex].correct_answer}
                              </p>
                            )}
                            {quizResult[currentQuestionIndex].explanation && (
                              <p className="text-sm text-slate-500 mt-2 italic">
                                {quizResult[currentQuestionIndex].explanation}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Next question or Finish button */}
                        {currentQuestionIndex < quizResult.length - 1 ? (
                          <button
                            onClick={handleNextQuestion}
                            className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20"
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
                              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:opacity-90 transition-all"
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
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{t("dash_plan")}</h3>
                      <p className="text-xs text-slate-500">{t("plan_no_plan_cta")}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t("goal")}</label>
                      <input
                        type="text"
                        value={planGoal}
                        onChange={(e) => setPlanGoal(e.target.value)}
                        placeholder={t("goal_input_placeholder")}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
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
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">
                        {t("daily_hours")}
                      </label>
                      <input
                        type="number"
                        value={planHours}
                        onChange={(e) => setPlanHours(parseFloat(e.target.value))}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <button
                      onClick={handleGeneratePlan}
                      disabled={loading || !planGoal || !planDate}
                      className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
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
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-8">
                      <h3 className="text-xl font-bold">{planResult.summary}</h3>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                        {t("target_date")}: {planResult.target_date}
                      </span>
                    </div>

                    <div className="space-y-8">
                      {planResult.weekly_breakdown?.map((week: any, i: number) => (
                        <div key={i} className="relative pl-8 border-l-2 border-primary/20">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-gradient-to-br from-primary to-secondary ring-4 ring-white dark:ring-slate-900" />
                          <h4 className="font-bold text-lg mb-4 text-primary">
                            {t("week_label")} {week.week}: {week.focus}
                          </h4>
                          <div className="grid gap-4">
                            {week.days?.map((day: any, j: number) => (
                              <div
                                key={j}
                                className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/40 transition-colors"
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
                      className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 mx-auto"
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
                          className="absolute inset-0 backface-hidden bg-gradient-to-br from-primary to-secondary rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-8 text-center text-white"
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
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                  <div className="h-16 w-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-8 w-8 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{t("gaps_title")}</h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">{t("gaps_hint")}</p>
                  <button
                    onClick={handleGenerateGaps}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      t("generate_gaps")
                    )}
                  </button>
                </div>
                {gapsResult && (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    {!gapsResult.ready ? (
                      <div className="text-center py-4">
                        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                          <AlertCircle className="h-7 w-7 text-amber-500" />
                        </div>
                        <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
                          {t("gaps_not_ready_title")}
                        </p>
                        <p className="text-sm text-slate-500">
                          {gapsResult.message || t("gaps_not_ready_default")}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          {t("gaps_sessions_completed")}: {gapsResult.sessions_completed ?? 0} {t("gaps_of_required")}
                        </p>
                        <button
                          onClick={() => setActivePanel("quiz")}
                          className="mt-4 px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                        >
                          {t("gaps_go_to_quiz")}
                        </button>
                      </div>
                    ) : typeof gapsResult === "string" ? (
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
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <p className="text-xs text-slate-500">{t("quizzes_today")}</p>
                          <p className="font-bold">{subscriptionStatus.quiz_today} / {subscriptionStatus.quiz_limit}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <p className="text-xs text-slate-500">{t("uploads_label")}</p>
                          <p className="font-bold">{subscriptionStatus.uploads_count} / {subscriptionStatus.uploads_limit}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <p className="text-xs text-slate-500">{t("chats_today")}</p>
                          <p className="font-bold">{subscriptionStatus.chat_today} / {subscriptionStatus.chat_limit}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Plan comparison */}
                <div className="grid sm:grid-cols-2 gap-6 items-stretch">
                  {/* Free */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t("subscription_free")}</p>
                    <p className="text-4xl font-black mb-1">$0<span className="text-base font-medium text-slate-400">/mo</span></p>
                    <p className="text-sm text-slate-500 mb-6">{t("subscription_hint")}</p>
                    <ul className="space-y-3 mb-8 flex-1">
                      {[t("quizzes_today"), t("uploads_label"), t("chats_today")].map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-slate-400 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      disabled
                      className="w-full py-3 rounded-xl font-bold border-2 border-slate-200 dark:border-slate-700 text-slate-400 cursor-default"
                    >
                      {!subscriptionStatus?.is_premium ? t("subscription_free") + " ✓" : t("subscription_free")}
                    </button>
                  </div>

                  {/* Premium */}
                  <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950 text-white rounded-3xl border border-purple-500/30 p-8 flex flex-col shadow-xl shadow-purple-500/10 overflow-hidden">
                    <div className="absolute -top-10 -right-10 h-40 w-40 bg-purple-500/20 rounded-full blur-3xl" />
                    <span className="absolute top-6 right-6 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-500 to-pink-500 px-2.5 py-1 rounded-full">
                      {t("subscription_upgrade")}
                    </span>
                    <p className="text-xs font-black uppercase tracking-widest text-purple-300 mb-2 relative">{t("subscription_premium")}</p>
                    <p className="text-4xl font-black mb-1 relative">25,000 <span className="text-base font-medium text-slate-400">UZS/mo</span></p>
                    <p className="text-sm text-slate-400 mb-6 relative">{t("subscription_hint")}</p>
                    <ul className="space-y-3 mb-8 flex-1 relative">
                      {[t("quizzes_today"), t("uploads_label"), t("chats_today"), t("supported_payment_methods")].map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-sm text-slate-200">
                          <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" /> {lang === "uz" ? "Cheklovsiz" : lang === "ru" ? "Безлимит" : "Unlimited"} {f}
                        </li>
                      ))}
                    </ul>
                    <div className="relative space-y-4">
                      {!subscriptionStatus?.is_premium ? (
                        <button
                          onClick={() => setShowPaymentSelection(true)}
                          className="w-full group relative px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                        >
                          <Zap className="h-5 w-5 fill-white" />
                          {t("subscription_upgrade")}
                        </button>
                      ) : (
                        <button
                          onClick={handleCancelSubscription}
                          disabled={loading}
                          className="w-full px-6 py-3.5 border-2 border-red-400/30 text-red-300 rounded-xl font-bold hover:bg-red-500/10 transition-all disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : t("subscription_cancel")}
                        </button>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 bg-[#00c2ed] rounded-md flex items-center justify-center">
                            <span className="text-white font-black text-[9px]">P</span>
                          </div>
                          <span className="text-xs font-bold text-slate-400">Payme</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 bg-[#00a6ff] rounded-md flex items-center justify-center text-white font-bold text-[7px]">CLICK</div>
                          <span className="text-xs font-bold text-slate-400">Click</span>
                        </div>
                      </div>
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
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t("feedback_title")}</h3>
                      <p className="text-sm text-slate-500">{t("feedback_hint")}</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("feedback_rating")}
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setFeedbackRating(star)}
                            className="focus:outline-none hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-8 w-8 transition-all ${
                                star <= feedbackRating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-slate-300 dark:text-slate-700"
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
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={loading || !feedbackMessage.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
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

            {activePanel === "assistant" && (
              <motion.div key="assistant" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AssistantDashboard user={user} onNavigate={setActivePanel} />
              </motion.div>
            )}

            {activePanel === "review" && (
              <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ReviewDashboard user={user} onNavigate={setActivePanel} />
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
                    <div className="flex-1 flex items-center justify-between gap-3 flex-wrap">
                      <h3 className="text-xl font-bold">{t("dash_telegram")}</h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          stats.tgLinked ? "text-green-600 bg-green-500/10" : "text-slate-500 bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        {stats.tgLinked ? t("tg_linked") : t("tg_not_linked")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-3">
                        {t("tg_hint")}
                      </p>
                      {!stats.tgLinked && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300 space-y-1">
                          <p className="font-semibold">{t("tg_how_to_link")}</p>
                          <p>{t("tg_step_open_bot").replace("{bot}", "")}<strong>@ILM_AI_HELPER_bot</strong></p>
                          <p>{t("tg_step_send")} <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">/link</code></p>
                          <p>{t("tg_step_credentials")}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-500 shrink-0">
                          {t("email")}
                        </span>
                        <span className="font-mono text-sm break-all sm:text-right">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-500">
                          {t("streak_label")}
                        </span>
                        <span className="font-bold text-green-500">
                          {stats.streak} {t("days_suffix")}
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <label className="block text-sm font-medium text-slate-500 mb-1">
                          {t("tg_reminder_time")}
                        </label>
                        <p className="text-xs text-slate-400 mb-2">{t("tg_reminder_tz")}</p>
                        {!stats.tgLinked && (
                          <p className="text-xs text-amber-500 mb-2">
                            {t("tg_reminder_link_first")}
                          </p>
                        )}
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
                            className="px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm"
                          >
                            {t("tg_save")}
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
                        href="https://t.me/ILM_AI_HELPER_bot"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-4 bg-[#0088cc] text-white rounded-xl font-bold hover:bg-[#0077b5] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0088cc]/20"
                      >
                        <Send className="h-5 w-5" />
                        {t("tg_open_bot_button")}
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
                className="max-w-2xl space-y-6 mt-4"
              >
                {/* Profile: name + avatar */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                      <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t("profile_title")}</h3>
                      <p className="text-sm text-slate-500">{t("profile_subtitle")}</p>
                    </div>
                  </div>

                  {/* Current avatar + upload/remove */}
                  <div className="flex items-center gap-5 mb-6">
                    <div className="h-20 w-20 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-black ring-2 ring-slate-200 dark:ring-slate-700">
                      {avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        (settingsFirstName || user?.name || "U").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <Upload className="h-4 w-4" />
                        {t("avatar_upload")}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      </label>
                      {avatar && (
                        <button
                          onClick={() => setAvatar("")}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("avatar_remove")}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preset avatars */}
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{t("avatar_presets")}</p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {PRESET_AVATARS.map((src) => (
                      <button
                        key={src}
                        onClick={() => setAvatar(src)}
                        className={`h-12 w-12 rounded-xl overflow-hidden transition-all ${
                          avatar === src ? "ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105" : "hover:scale-105 opacity-90 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="preset avatar" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>

                  {/* Name — separate first and last name */}
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t("profile_first_name")}</label>
                      <input
                        type="text"
                        value={settingsFirstName}
                        onChange={(e) => setSettingsFirstName(e.target.value)}
                        placeholder={t("profile_first_name")}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t("profile_last_name")}</label>
                      <input
                        type="text"
                        value={settingsLastName}
                        onChange={(e) => setSettingsLastName(e.target.value)}
                        placeholder={t("profile_last_name")}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
                  >
                    {savingProfile ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : t("profile_save")}
                  </button>
                  {profileStatus.msg && (
                    <div className={`flex items-center gap-2 text-sm font-medium mt-3 ${profileStatus.type === "success" ? "text-green-500" : "text-red-500"}`}>
                      {profileStatus.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {profileStatus.msg}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t("settings_learning_title")}</h3>
                      <p className="text-sm text-slate-500">{t("settings_learning_subtitle")}</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t("goal")}</label>
                      <textarea
                        value={settingsGoal}
                        onChange={(e) => setSettingsGoal(e.target.value)}
                        placeholder={t("goal_placeholder")}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary resize-none h-28"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t("target_date")}</label>
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
                      className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : t("save_settings")}
                    </button>
                    {settingsStatus.msg && (
                      <div className={`flex items-center gap-2 text-sm font-medium ${settingsStatus.type === "success" ? "text-green-500" : "text-red-500"}`}>
                        {settingsStatus.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {settingsStatus.msg}
                      </div>
                    )}
                  </div>
                </div>

                {/* Appearance */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                      <Sun className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t("appearance_title")}</h3>
                      <p className="text-sm text-slate-500">{t("appearance_subtitle")}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { mode: "light" as ThemeMode, label: t("theme_light"), icon: Sun },
                        { mode: "dark" as ThemeMode, label: t("theme_dark"), icon: Moon },
                        { mode: "system" as ThemeMode, label: t("theme_system"), icon: Monitor },
                      ]
                    ).map((opt) => (
                      <button
                        key={opt.mode}
                        onClick={() => setThemeMode(opt.mode)}
                        className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                          themeMode === opt.mode
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/50"
                        }`}
                      >
                        <opt.icon className="h-5 w-5" />
                        <span className="text-xs font-semibold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold mb-4">{t("account_info_title")}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-sm text-slate-500">{t("account_name")}</span>
                      <span className="text-sm font-bold">{user?.name}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-sm text-slate-500 shrink-0">{t("account_email")}</span>
                      <span className="text-sm font-bold break-all sm:text-right">{user?.email}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-sm text-slate-500">{t("account_plan")}</span>
                      <span className={`text-sm font-bold ${subscriptionStatus?.is_premium ? "text-primary" : "text-slate-500"}`}>
                        {subscriptionStatus?.is_premium ? t("subscription_premium") : t("subscription_free")}
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
              <h3 className="text-2xl font-black mb-2 tracking-tight">{t("select_payment_title")}</h3>
              <p className="text-slate-500 text-sm mb-8">{t("select_payment_subtitle")}</p>

              <div className="grid gap-3">
                {[
                  { id: "payme", label: "Payme", color: "bg-[#00c2ed]", text: "P", desc: t("payment_local_desc") },
                  { id: "click", label: "Click", color: "bg-[#00a6ff]", text: "C", desc: t("payment_local_desc") },
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
                {lang === "uz" ? "Boshqaruv paneliga qaytish" : lang === "ru" ? "Вернуться на панель" : "Back to Dashboard"}
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
                paymentMethod === 'payme' ? "bg-[#00c2ed]" : "bg-[#00a6ff]"
              } p-10 flex flex-col items-center justify-center text-white relative`}>
                <div className="bg-white p-5 rounded-3xl mb-4 shadow-xl">
                  <div className={`${
                    paymentMethod === 'payme' ? "text-[#00c2ed]" : "text-[#00a6ff]"
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
                    <span className="text-slate-500 font-medium">{t("payment_service")}</span>
                    <span className="font-bold text-slate-900 dark:text-white">Ilm AI Premium</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">{t("payment_frequency")}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{t("payment_monthly")}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-black text-lg">{t("payment_total")}</span>
                    <span className={`text-3xl font-black ${
                      paymentMethod === 'payme' ? "text-[#00c2ed]" : "text-[#00a6ff]"
                    }`}>
                      {"25,000 UZS"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={confirmTestPayment}
                    disabled={loading}
                    className={`w-full py-5 ${
                      paymentMethod === 'payme' ? "bg-[#00c2ed] shadow-[#00c2ed]/20" : "bg-[#00a6ff] shadow-[#00a6ff]/20"
                    } text-white rounded-[1.25rem] font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl flex items-center justify-center gap-3`}
                  >
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t("payment_complete_btn")}
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full py-2 text-slate-400 font-bold text-sm hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {lang === "uz" ? "Bekor qilish" : lang === "ru" ? "Отменить" : "Cancel and return"}
                  </button>
                </div>

                <div className="flex justify-center items-center gap-3 opacity-20 grayscale">
                  <Shield className="h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-widest font-black">
                    {lang === "uz" ? `${paymentMethod} orqali xavfsiz shifrlangan` : lang === "ru" ? `Безопасно зашифровано через ${paymentMethod}` : `Securely encrypted by ${paymentMethod}`}
                  </span>
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
