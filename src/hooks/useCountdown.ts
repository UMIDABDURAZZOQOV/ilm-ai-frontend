"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * A countdown timer that stays accurate even when the browser tab is
 * backgrounded. Browsers throttle setInterval in inactive tabs, so a naive
 * decrementing counter drifts or freezes until the tab regains focus. This
 * hook tracks an absolute target timestamp and recomputes the remaining
 * seconds from Date.now() on every tick and whenever the tab becomes
 * visible again, so it always self-corrects to the real elapsed time.
 */
export function useCountdown() {
  const targetRef = useRef<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  const recompute = useCallback(() => {
    if (targetRef.current === null) {
      setRemaining(0);
      return;
    }
    const secondsLeft = Math.max(0, Math.ceil((targetRef.current - Date.now()) / 1000));
    setRemaining(secondsLeft);
    if (secondsLeft <= 0) targetRef.current = null;
  }, []);

  const start = useCallback(
    (seconds: number) => {
      targetRef.current = Date.now() + seconds * 1000;
      recompute();
    },
    [recompute]
  );

  useEffect(() => {
    const interval = setInterval(recompute, 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") recompute();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [recompute]);

  return { remaining, start };
}
