import { apiFetch } from "./api";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LessonStatus = "locked" | "unlocked" | "completed";

export interface SkillSubject {
  id: number;
  slug: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  icon: string | null;
  color: string | null;
}

export interface SkillTreeLesson {
  id: number;
  slug: string;
  title_uz: string;
  title_ru: string;
  title_en: string;
  order_index: number;
  xp_reward: number;
  status: LessonStatus;
  stars: number;
  best_score_pct: number | null;
}

/** Checkpoint exam at the end of a unit. Passing it unlocks the next unit. */
export interface UnitExamInfo {
  /** "none" = unit has no lessons (never gates) */
  status: "none" | "locked" | "unlocked" | "passed";
  passed: boolean;
  best_score_pct: number | null;
  attempts: number;
}

export interface SkillTreeUnit {
  id: number;
  slug: string;
  title_uz: string;
  title_ru: string;
  title_en: string;
  order_index: number;
  lessons: SkillTreeLesson[];
  exam?: UnitExamInfo;
}

export interface GamificationSummary {
  xp_total: number;
  streak_days: number;
  today_xp?: number;
  daily_goal_xp?: number;
}

export interface SkillTreeResponse {
  subject: SkillSubject;
  units: SkillTreeUnit[];
  user: GamificationSummary;
}

export interface LessonQuestion {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  order_index: number;
}

/** Duolingo-style teaching card shown before the questions. */
export interface TheoryCard {
  title: string;
  body: string;
  example?: string | null;
}

export interface LessonStartResponse {
  attempt_id: number;
  theory: TheoryCard[];
  questions: LessonQuestion[];
}

export interface LessonResultItem {
  question_id: number;
  user_answer: string;
  is_correct: boolean;
}

export interface LessonCompleteResponse {
  /** False when the learner scored below `pass_threshold_pct` — the lesson is NOT
   *  marked completed and the next node stays locked, so they should study and retry. */
  passed: boolean;
  pass_threshold_pct: number;
  stars: number;
  score: number;
  total: number;
  xp_awarded: number;
  xp_total: number;
  streak_days: number;
  newly_unlocked_lesson_ids: number[];
}

// ─── Functions ──────────────────────────────────────────────────────────────

export async function getSubjects(): Promise<SkillSubject[]> {
  return apiFetch("/skills/subjects");
}

export async function getSkillTree(userId: number, subjectSlug: string): Promise<SkillTreeResponse> {
  return apiFetch(`/skills/${userId}/tree?subject=${subjectSlug}`);
}

export async function getGamificationSummary(userId: number): Promise<GamificationSummary> {
  return apiFetch(`/skills/${userId}/summary`);
}

export interface SubjectProgress {
  slug: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  icon: string;
  color: string;
  total_lessons: number;
  attempted: number;
  completed: number;
  mastery_pct: number;
  progress_pct: number;
  weak_units: { title_uz: string; avg_pct: number }[];
}

export async function getProgress(userId: number): Promise<{ subjects: SubjectProgress[] }> {
  return apiFetch(`/skills/${userId}/progress`);
}

export interface SubjectExamQuestion extends PracticeQuestion {
  unit_id: number;
  unit_title: string;
}

export async function getSubjectExam(
  userId: number,
  subjectSlug: string
): Promise<{ questions: SubjectExamQuestion[]; subject_name: string; duration_seconds: number }> {
  return apiFetch(`/skills/${userId}/subject-exam?subject=${subjectSlug}`);
}

export interface SubjectExamResult {
  score: number;
  total: number;
  score_pct: number;
  passed: boolean;
  xp_awarded: number;
  xp_total: number;
  streak_days: number;
  weak_units: { title_uz: string; pct: number }[];
}

export interface PronunciationPhrase {
  text: string;
  uz: string;
}

export async function getPronunciationPhrases(
  userId: number,
  subjectSlug: string
): Promise<{ phrases: PronunciationPhrase[]; language: string }> {
  return apiFetch(`/skills/${userId}/pronunciation?subject=${subjectSlug}`);
}

export async function scorePronunciation(data: {
  user_id: number;
  subject: string;
  target_text: string;
  audio_base64: string;
  mime_type: string;
}): Promise<{ heard: string; score: number; tip: string }> {
  return apiFetch(`/skills/pronunciation/score`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function completeSubjectExam(
  userId: number,
  subject: string,
  score: number,
  total: number,
  perUnit: Record<string, [number, number]>
): Promise<SubjectExamResult> {
  return apiFetch(`/skills/subject-exam/complete`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, subject, score, total, per_unit: perUnit }),
  });
}

export async function startLesson(lessonId: number, userId: number): Promise<LessonStartResponse> {
  return apiFetch(`/skills/lessons/${lessonId}/start`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function completeLesson(
  lessonId: number,
  data: { user_id: number; attempt_id: number; results: LessonResultItem[] }
): Promise<LessonCompleteResponse> {
  return apiFetch(`/skills/lessons/${lessonId}/complete`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Engagement features (leaderboard, mistakes, daily, achievements, lightning) ───

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  name: string;
  profile_picture: string | null;
  weekly_xp: number;
  is_me: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  own_rank: number | null;
  total_participants: number;
}

export async function getWeeklyLeaderboard(): Promise<LeaderboardResponse> {
  return apiFetch("/skills/leaderboard/weekly");
}

export interface PracticeQuestion {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
  wrong_count?: number;
}

export interface PracticeResultItem {
  question_id: number;
  is_correct: boolean;
}

export async function getMistakes(userId: number): Promise<{ questions: PracticeQuestion[]; count: number }> {
  return apiFetch(`/skills/${userId}/mistakes`);
}

export async function completeMistakes(
  userId: number,
  results: PracticeResultItem[]
): Promise<{ resolved: number; remaining: number; xp_awarded: number; xp_total: number; streak_days: number }> {
  return apiFetch("/skills/mistakes/complete", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, results }),
  });
}

export interface DailyChallengeResponse {
  completed: boolean;
  score?: number;
  total?: number;
  xp_awarded?: number;
  questions: PracticeQuestion[];
}

export async function getDailyChallenge(userId: number): Promise<DailyChallengeResponse> {
  return apiFetch(`/skills/${userId}/daily-challenge`);
}

export async function completeDailyChallenge(
  userId: number,
  results: PracticeResultItem[]
): Promise<{ score: number; total: number; xp_awarded: number; xp_total: number; streak_days: number; already_completed: boolean }> {
  return apiFetch("/skills/daily-challenge/complete", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, results }),
  });
}

export interface Achievement {
  id: string;
  group: string;
  target: number;
  progress: number;
  earned: boolean;
}

export async function getAchievements(userId: number): Promise<{ achievements: Achievement[] }> {
  return apiFetch(`/skills/${userId}/achievements`);
}

export async function getLightningRound(userId: number): Promise<{ questions: PracticeQuestion[] }> {
  return apiFetch(`/skills/${userId}/lightning`);
}

export async function completeLightning(
  userId: number,
  score: number,
  total: number
): Promise<{ xp_awarded: number; xp_total: number; streak_days: number }> {
  return apiFetch("/skills/lightning/complete", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, score, total }),
  });
}

// ─── League, referral, profile, marathon ──────────────────────────────────────

export interface LeagueTier {
  id: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  min_xp: number;
  color: string;
}

export interface LeagueResponse {
  league: LeagueTier;
  weekly_xp: number;
  next_league: LeagueTier | null;
  xp_to_next: number;
  all_tiers: LeagueTier[];
}

export async function getLeague(userId: number): Promise<LeagueResponse> {
  return apiFetch(`/skills/${userId}/league`);
}

export interface ReferralResponse {
  code: string;
  invited_count: number;
  bonus_per_invite: number;
  bonus_earned: number;
}

export async function getReferral(userId: number): Promise<ReferralResponse> {
  return apiFetch(`/skills/${userId}/referral`);
}

export async function applyReferral(
  userId: number,
  code: string
): Promise<{ bonus_xp: number; xp_total: number; inviter_name: string }> {
  return apiFetch("/skills/referral/apply", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, code }),
  });
}

export interface SubjectProgress {
  slug: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  color: string | null;
  completed: number;
  total: number;
  stars: number;
  pct: number;
}

export interface ProfileResponse {
  name: string;
  profile_picture: string | null;
  xp_total: number;
  streak_days: number;
  lessons_completed: number;
  subjects: SubjectProgress[];
  strongest: SubjectProgress | null;
  weakest: SubjectProgress | null;
  activity: Record<string, number>;
  league: LeagueTier;
}

export async function getProfile(userId: number): Promise<ProfileResponse> {
  return apiFetch(`/skills/${userId}/profile`);
}

export async function getMarathon(userId: number, subjectSlug: string): Promise<{ questions: PracticeQuestion[]; subject_name: string }> {
  return apiFetch(`/skills/${userId}/marathon?subject=${subjectSlug}`);
}

export async function completeMarathon(
  userId: number,
  score: number,
  total: number
): Promise<{ score: number; total: number; xp_awarded: number; xp_total: number; streak_days: number }> {
  return apiFetch("/skills/marathon/complete", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, score, total }),
  });
}

// ─── Mock exam + score prediction (Sinov imtihoni) ─────────────────────────────

export interface MockPrediction {
  predicted_pct: number;
  predicted_grade: string;
  confidence: "low" | "medium" | "high";
  based_on_exams: number;
  used_mastery: boolean;
}

export interface MockAttempt {
  id: number;
  percentage: number | null;
  grade: string | null;
  score: number | null;
  total: number | null;
  completed_at: string | null;
}

export interface MockOverview {
  subject_slug: string;
  subject_name_uz: string;
  subject_name_ru: string;
  subject_name_en: string;
  color: string | null;
  available_questions: number;
  size: number;
  duration_seconds: number;
  best: { percentage: number; grade: string } | null;
  attempts: MockAttempt[];
  prediction: MockPrediction | null;
}

export interface MockExamQuestion {
  id: number;
  question_text: string;
  options: string[];
}

export interface MockStartResponse {
  exam_id: number;
  subject_name_uz: string;
  duration_seconds: number;
  questions: MockExamQuestion[];
}

export interface MockReviewItem {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  user_answer: string;
  is_correct: boolean;
}

export interface MockResult {
  exam_id: number;
  score: number;
  total: number;
  percentage: number | null;
  grade: string;
  certificate: boolean;
  predicted_grade: string;
  predicted_pct: number;
  prediction: MockPrediction | null;
  xp_awarded: number;
  xp_total: number;
  review: MockReviewItem[];
}

export async function getMockOverview(userId: number, subjectSlug: string): Promise<MockOverview> {
  return apiFetch(`/skills/${userId}/mock-exam?subject=${subjectSlug}`);
}

export async function startMockExam(userId: number, subjectSlug: string): Promise<MockStartResponse> {
  return apiFetch("/skills/mock-exam/start", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, subject: subjectSlug }),
  });
}

export async function completeMockExam(
  userId: number,
  examId: number,
  answers: { question_id: number; user_answer: string | null }[]
): Promise<MockResult> {
  return apiFetch(`/skills/mock-exam/${examId}/complete`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, answers }),
  });
}

// ─── Teacher / class mode (Sinf rejimi) ────────────────────────────────────────

export interface ClassBrief {
  id: number;
  name: string;
  subject_slug: string | null;
  join_code: string;
  member_count: number;
  created_at: string | null;
}

export interface EnrolledClass {
  id: number;
  name: string;
  subject_slug: string | null;
  teacher_name: string;
}

export interface StudentRow {
  user_id: number;
  name: string;
  profile_picture: string | null;
  xp_total: number;
  weekly_xp: number;
  streak_days: number;
  lessons_completed: number;
  last_active: string | null;
  active_today: boolean;
}

export interface ClassAssignment {
  id: number;
  title: string;
  subject_slug: string | null;
  lesson_id: number | null;
  due_date: string | null;
}

export interface ClassDetail {
  id: number;
  name: string;
  subject_slug: string | null;
  join_code: string;
  roster: StudentRow[];
  assignments: ClassAssignment[];
}

export async function getMyClasses(): Promise<{ teaching: ClassBrief[]; enrolled: EnrolledClass[] }> {
  return apiFetch("/classes/mine");
}

export async function createClass(name: string, subjectSlug: string | null): Promise<ClassBrief> {
  return apiFetch("/classes", {
    method: "POST",
    body: JSON.stringify({ name, subject_slug: subjectSlug }),
  });
}

export async function joinClass(code: string): Promise<{ joined: boolean; class_id: number; name: string; already: boolean }> {
  return apiFetch("/classes/join", { method: "POST", body: JSON.stringify({ code }) });
}

export async function leaveClass(classId: number): Promise<{ left: boolean }> {
  return apiFetch("/classes/leave", { method: "POST", body: JSON.stringify({ class_id: classId }) });
}

export async function getClassDetail(classId: number): Promise<ClassDetail> {
  return apiFetch(`/classes/${classId}`);
}

export async function createAssignment(
  classId: number,
  data: { title: string; subject_slug?: string | null; lesson_id?: number | null; due_date?: string | null }
): Promise<{ id: number; title: string }> {
  return apiFetch(`/classes/${classId}/assign`, { method: "POST", body: JSON.stringify(data) });
}

export async function deleteAssignment(classId: number, assignmentId: number): Promise<{ deleted: boolean }> {
  return apiFetch(`/classes/${classId}/assignments/${assignmentId}`, { method: "DELETE" });
}

export async function removeMember(classId: number, studentId: number): Promise<{ removed: boolean }> {
  return apiFetch(`/classes/${classId}/members/${studentId}`, { method: "DELETE" });
}

export async function archiveClass(classId: number): Promise<{ archived: boolean }> {
  return apiFetch(`/classes/${classId}`, { method: "DELETE" });
}

// ─── Parent dashboard (Ota-ona paneli) ─────────────────────────────────────────

export interface ChildDetail {
  user_id: number;
  name: string;
  profile_picture: string | null;
  xp_total: number;
  weekly_xp: number;
  streak_days: number;
  lessons_completed: number;
  last_active: string | null;
  active_today: boolean;
  subjects: SubjectProgress[];
  strongest: SubjectProgress | null;
  weakest: SubjectProgress | null;
  activity: Record<string, number>;
}

export async function getFamilyCode(): Promise<{ code: string; linked_parents: { parent_id: number; name: string }[] }> {
  return apiFetch("/parent/my-code");
}

export async function linkChild(code: string): Promise<{ linked: boolean; child_id: number; child_name: string; already: boolean }> {
  return apiFetch("/parent/link", { method: "POST", body: JSON.stringify({ code }) });
}

export async function getChildren(): Promise<{ children: ChildDetail[] }> {
  return apiFetch("/parent/children");
}

export async function unlinkChild(childId: number): Promise<{ unlinked: boolean }> {
  return apiFetch("/parent/unlink", { method: "POST", body: JSON.stringify({ child_id: childId }) });
}

// ─── In-lesson AI tutor (AI repetitor) ─────────────────────────────────────────

export async function explainQuestion(data: {
  question_text: string;
  options?: string[] | null;
  correct_answer: string;
  user_answer?: string | null;
  lang: string;
}): Promise<{ explanation: string }> {
  return apiFetch("/skills/tutor/explain", { method: "POST", body: JSON.stringify(data) });
}

// ─── Placement test ─────────────────────────────────────────────────────────
// Offered when opening a subject, so the learner knows where they stand before
// starting the path. Languages are placed on CEFR, the other subjects on the
// Milliy Sertifikat 1-5 scale. The level comes from per-level mastery, not from a
// percentage — see services/placement.py on the backend.

export const LANGUAGE_SUBJECT_SLUGS = ["ingliz_tili", "koreys_tili", "fransuz_tili"];

export function isLanguageSubject(slug: string): boolean {
  return LANGUAGE_SUBJECT_SLUGS.includes(slug);
}

export interface LevelTestQuestion {
  id: number;
  /** The band this question was authored at — shown in the result breakdown. */
  level: string;
  skill?: string | null;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
}

export interface LevelBreakdownRow {
  level: string;
  label: string;
  correct: number;
  asked: number;
  pct: number;
  mastered: boolean;
}

export interface LevelInfo {
  level: string;
  label?: string;
  score: number;
  total: number;
  score_pct: number;
  taken_at?: string | null;
  breakdown?: LevelBreakdownRow[];
}

export interface LevelTestResponse {
  subject: { slug: string; name_uz: string; color?: string };
  scale: "cefr" | "milliy";
  levels: { level: string; label: string }[];
  current_level: LevelInfo | null;
  questions: LevelTestQuestion[];
}

export async function getLevelTest(userId: number, subjectSlug: string): Promise<LevelTestResponse> {
  return apiFetch(`/skills/${userId}/level-test?subject=${encodeURIComponent(subjectSlug)}`);
}

export async function completeLevelTest(data: {
  user_id: number;
  subject_slug: string;
  results: { question_id: number; is_correct: boolean }[];
}): Promise<LevelInfo> {
  return apiFetch("/skills/level-test/complete", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Unit checkpoint exam ───────────────────────────────────────────────────
// Taken at the end of a unit (bob) over every lesson in it; passing unlocks the
// next unit. Applies to every subject.

export interface UnitExamResponse {
  unit: { id: number; title_uz: string; title_ru: string; title_en: string };
  pass_threshold_pct: number;
  previous: { passed: boolean; best_score_pct: number | null; attempts: number } | null;
  questions: PracticeQuestion[];
}

export interface UnitExamResult {
  passed: boolean;
  pass_threshold_pct: number;
  score: number;
  total: number;
  score_pct: number;
  xp_awarded: number;
  xp_total: number;
  streak_days: number;
}

export async function getUnitExam(userId: number, unitId: number): Promise<UnitExamResponse> {
  return apiFetch(`/skills/${userId}/unit-exam?unit_id=${unitId}`);
}

export async function completeUnitExam(data: {
  user_id: number;
  unit_id: number;
  results: PracticeResultItem[];
}): Promise<UnitExamResult> {
  return apiFetch("/skills/unit-exam/complete", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
