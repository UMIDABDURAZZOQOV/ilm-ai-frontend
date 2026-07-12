"use client";

import { useState } from "react";
import { collegeLogo, collegeInitials, type College } from "@/lib/colleges";

// Shows the university's real logo (from its own domain favicon); falls back to
// its initials on a teal tile if the image can't load.
export function CollegeLogo({ college, className = "" }: { college: College; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = collegeLogo(college);

  if (failed || !src) {
    return (
      <div className={`bg-gradient-to-br from-[#0d3b4f] to-[#0a2e3e] text-white flex items-center justify-center font-black ${className}`}>
        {collegeInitials(college.name)}
      </div>
    );
  }
  return (
    <div className={`bg-white flex items-center justify-center overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={college.name} className="h-3/4 w-3/4 object-contain" onError={() => setFailed(true)} loading="lazy" />
    </div>
  );
}
