"use client";

/**
 * Shimmer skeleton primitives — a calmer, more premium loading state than a bare
 * spinner. Pure CSS (the shimmer keyframes live in globals.css as `.ilm-shimmer`).
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`ilm-shimmer rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70 ${className}`} />;
}

/** A stack of card skeletons for list/grid loading. */
export function SkeletonCards({ count = 6, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800">
          <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
