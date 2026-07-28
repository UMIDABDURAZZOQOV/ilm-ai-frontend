import { apiFetch } from "./api";

export interface TopicStat {
  topic: string;
  accuracy: number;
  attempts: number;
}

export interface Insights {
  has_data: boolean;
  materials: { files: string[]; count: number; topics: string[] };
  quiz: { sessions: number; questions: number; overall_pct: number; trend: number; recent_scores: number[] };
  strong_topics: TopicStat[];
  weak_topics: TopicStat[];
}

export async function getInsights(userId: number): Promise<Insights> {
  return apiFetch(`/insights/${userId}`);
}
