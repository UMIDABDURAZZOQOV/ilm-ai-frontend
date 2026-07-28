import { apiFetch } from "./api";
import type { PracticeQuestion } from "./skillTreeApi";

export interface CourseLesson {
  title: string;
  summary: string;
}

export interface CourseChapter {
  title: string;
  lessons: CourseLesson[];
}

export interface Course {
  title: string;
  chapters: CourseChapter[];
  sources: string[];
}

export type CourseProgress = Record<string, { completed: boolean; score: number }>;

export interface CourseResponse {
  course: Course | null;
  progress: CourseProgress;
}

/** Build a structured course from the learner's uploaded materials. */
export async function generateCourse(userId: number, language: string): Promise<Course> {
  return apiFetch("/course/generate", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, language }),
  });
}

export async function getCourse(userId: number): Promise<CourseResponse> {
  return apiFetch(`/course/${userId}`);
}

/** On-demand questions for one lesson, grounded in the learner's material. */
export async function getLessonQuestions(data: {
  userId: number;
  chapterTitle: string;
  lessonTitle: string;
  lessonSummary: string;
  language: string;
}): Promise<{ questions: PracticeQuestion[] }> {
  const raw = await apiFetch("/course/lesson-questions", {
    method: "POST",
    body: JSON.stringify({
      user_id: data.userId,
      chapter_title: data.chapterTitle,
      lesson_title: data.lessonTitle,
      lesson_summary: data.lessonSummary,
      language: data.language,
    }),
  });
  // The backend returns bare {question, options, correct_answer, explanation};
  // give each a synthetic id so it fits the shared PracticeQuestion runner.
  const questions: PracticeQuestion[] = (raw.questions || []).map(
    (q: { question: string; options: string[]; correct_answer: string; explanation?: string }, i: number) => ({
      id: i + 1,
      question_text: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? null,
    })
  );
  return { questions };
}

export async function completeCourseLesson(userId: number, lessonKey: string, score: number): Promise<{ progress: CourseProgress }> {
  return apiFetch("/course/lesson-complete", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, lesson_key: lessonKey, score }),
  });
}
