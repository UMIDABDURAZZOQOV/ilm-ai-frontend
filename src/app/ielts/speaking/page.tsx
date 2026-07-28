"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Play, Pause, RotateCcw, ArrowLeft, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getSpeaking, submitSpeaking, getSpeakingSubmissions } from "@/lib/ieltsApi";
import type { IeltsSpeaking, IeltsSpeakingSubmission } from "@/lib/ieltsApi";
import { useAuth } from "@/hooks/useAuth";
import FocusTimerWidget from "@/components/ui/FocusTimerWidget";

export default function IeltsSpeakingPage() {
  const { user } = useAuth();
  const [speakings, setSpeakings] = useState<IeltsSpeaking[]>([]);
  const [currentTopic, setCurrentTopic] = useState<IeltsSpeaking | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<IeltsSpeakingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    getSpeaking().then((data) => {
      setSpeakings(data);
      setLoading(false);
    });
    if (user) {
      getSpeakingSubmissions(user.id).then((data) => {
        setSubmissions(data);
      });
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const loadTopic = (topic: IeltsSpeaking) => {
    setCurrentTopic(topic);
    setRecordingTime(0);
    setAudioUrl(null);
    audioChunksRef.current = [];
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioBlobRef.current = audioBlob;
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setRecordingTime(0);
    setAudioUrl(null);
    audioChunksRef.current = [];
  };

  const handleSubmit = async () => {
    if (!user || !currentTopic || !audioBlobRef.current) return;

    try {
      // The recording is graded by Gemini from the audio itself — send it base64-encoded.
      const blob = audioBlobRef.current;
      const audio_base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve(String(r.result).split(",")[1] ?? "");
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      const submission = await submitSpeaking({
        user_id: user.id,
        topic_id: currentTopic.id,
        audio_base64,
        mime_type: blob.type || "audio/webm",
        duration_seconds: recordingTime,
      });
      setSubmissions([submission, ...submissions]);
      setCurrentTopic(null);
      resetRecording();
    } catch (error) {
      console.error("Failed to submit recording:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!currentTopic) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/ielts" className="text-sm font-bold text-slate-500 hover:text-slate-700">
            ‹ Back to IELTS
          </Link>
          <h1 className="text-3xl font-bold flex-1">Speaking Practice</h1>
        </div>

        {/* Topic Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          {speakings.map((topic) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-pink-500 transition-colors"
              onClick={() => loadTopic(topic)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-pink-500">Part {topic.part}</span>
                <span className="text-xs text-slate-500 capitalize">{topic.difficulty}</span>
              </div>
              <h3 className="font-bold mb-1">{topic.topic}</h3>
              {topic.speak_seconds && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span>{Math.floor(topic.speak_seconds / 60)} min</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold mb-4">Recent Recordings</h3>
            <div className="space-y-3">
              {submissions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Topic {sub.topic_id}</span>
                    {sub.band_score ? (
                      <span className="text-2xl font-bold text-pink-500">{sub.band_score.toFixed(1)}</span>
                    ) : (
                      <span className="text-sm text-slate-500">Grading...</span>
                    )}
                  </div>
                  {sub.feedback && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{sub.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FocusTimerWidget />
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentTopic(null)}
          className="text-sm font-bold text-slate-500 hover:text-slate-700"
        >
          ‹ Back to topics
        </button>
        <h1 className="text-3xl font-bold flex-1">Part {currentTopic.part}: {currentTopic.topic}</h1>
        {currentTopic.speak_seconds && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span>{Math.floor(currentTopic.speak_seconds / 60)} min</span>
          </div>
        )}
      </div>

      {/* Topic Questions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mic className="h-5 w-5 text-pink-500" />
          <h2 className="font-bold">Topic</h2>
        </div>
        {currentTopic.cue_card ? (
          <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-4 mb-4">
            <p className="text-sm text-pink-700 dark:text-pink-300 mb-2">Cue Card:</p>
            <p className="whitespace-pre-line">{currentTopic.cue_card}</p>
          </div>
        ) : null}
        <ul className="space-y-2">
          {currentTopic.questions.map((question, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-bold flex items-center justify-center shrink-0 text-sm">
                {index + 1}
              </span>
              <span className="text-sm">{question}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recording Interface */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mic className="h-5 w-5 text-pink-500" />
          <h2 className="font-bold">Record Your Response</h2>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-pink-500">{formatTime(recordingTime)}</div>
          {currentTopic.speak_seconds && (
            <div className="text-sm text-slate-500 mt-1">
              Target: {formatTime(currentTopic.speak_seconds)}
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {!isRecording && !audioUrl && (
            <button
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center transition-colors"
            >
              <Mic className="h-8 w-8" />
            </button>
          )}
          
          {isRecording && (
            <button
              onClick={stopRecording}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
            >
              <MicOff className="h-8 w-8" />
            </button>
          )}

          {audioUrl && (
            <>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              </button>
              <button
                onClick={resetRecording}
                className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
              >
                <RotateCcw className="h-8 w-8" />
              </button>
            </>
          )}
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="mb-6">
            <audio
              ref={(audio) => {
                if (audio) {
                  if (isPlaying) audio.play();
                  else audio.pause();
                }
              }}
              src={audioUrl}
              controls
              className="w-full"
            />
          </div>
        )}

        {/* Submit Button */}
        {audioUrl && (
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Submit for AI Grading
          </button>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
        <h3 className="font-bold mb-3 text-blue-700 dark:text-blue-300">Tips for Success</h3>
        <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Speak clearly and at a natural pace</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Use a variety of vocabulary and grammatical structures</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Extend your answers with examples and explanations</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Stay on topic and address all parts of the question</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
