"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { studyCacheKey } from "@/lib/ownedStudyCache";

type Answers = Record<number, string>;
interface Snapshot { key: string | null; answers: Answers }

export function useOwnedStudyAnswers(resource: string, ownerId: number | null | undefined, enabled = true) {
  const key = enabled ? studyCacheKey(ownerId, resource) : null;
  const currentKey = useRef(key);
  currentKey.current = key;
  const [snapshot, setSnapshot] = useState<Snapshot>({ key: null, answers: {} });
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    let answers: Answers = {};
    try {
      const raw = localStorage.getItem(key);
      if (raw && raw.length <= 500000) {
        const parsed = JSON.parse(raw);
        if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
          for (const [n, value] of Object.entries(parsed)) {
            if (/^\d+$/.test(n) && typeof value === "string") answers[Number(n)] = value;
          }
        }
      }
    } catch { /* Invalid/unavailable cache is not a failed study session. */ }
    setSnapshot({ key, answers });
    setSavedAt(null);
  }, [key]);

  useEffect(() => {
    if (!key || snapshot.key !== key) return;
    try {
      localStorage.setItem(key, JSON.stringify(snapshot.answers));
      setSavedAt(new Date().toLocaleString());
    } catch { /* Keep the in-memory answer if persistence is unavailable. */ }
  }, [key, snapshot]);

  const setAnswers = useCallback((update: SetStateAction<Answers>) => {
    // An async callback from account A must not overwrite account B's state.
    if (currentKey.current !== key) return;
    setSnapshot(previous => {
      const current = previous.key === key ? previous.answers : {};
      return { key, answers: typeof update === "function" ? update(current) : update };
    });
  }, [key]);

  return {
    answers: snapshot.key === key ? snapshot.answers : {},
    setAnswers,
    savedAt: snapshot.key === key ? savedAt : null,
    ready: snapshot.key === key,
  };
}
