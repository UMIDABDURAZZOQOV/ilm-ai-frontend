"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * A reading guide: a movable clear band across a dimmed page, so the eye stays on one
 * line at a time. Drag the band up and down; the height is adjustable from its edge.
 * Closed from its own handle or from the toolbar toggle in SessionPage.
 */
export default function LineReader({ onClose }: { onClose: () => void }) {
  const [y, setY] = useState(() => (typeof window === "undefined" ? 240 : window.innerHeight / 2 - 24));
  const [h, setH] = useState(48);
  const drag = useRef<{ dy: number } | null>(null);
  const rez = useRef<{ y: number; h: number } | null>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (drag.current) {
        setY(Math.max(0, Math.min(window.innerHeight - h, e.clientY - drag.current.dy)));
      } else if (rez.current) {
        setH(Math.max(24, Math.min(200, rez.current.h + (e.clientY - rez.current.y))));
      }
    };
    const up = () => { drag.current = null; rez.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [h]);

  return (
    <div className="fixed inset-0 z-[65] pointer-events-none">
      {/* dim above and below the clear band */}
      <div className="absolute inset-x-0 top-0 bg-black/45" style={{ height: y }} />
      <div className="absolute inset-x-0 bottom-0 bg-black/45" style={{ top: y + h }} />

      {/* the clear band with its handles */}
      <div
        className="absolute inset-x-0 pointer-events-auto"
        style={{ top: y, height: h }}
      >
        <div className="h-full border-y-2 border-sky-400/80 relative">
          {/* drag handle */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-3 h-6 px-3 flex items-center gap-2 rounded-full bg-sky-500 text-white text-[11px] font-bold shadow cursor-move touch-none"
            onPointerDown={(e) => { drag.current = { dy: e.clientY - y }; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
          >
            Reading guide
            <button onClick={onClose} className="pointer-events-auto" aria-label="Close reading guide">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* resize handle (bottom edge) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-10 h-3 rounded-full bg-sky-400/80 cursor-ns-resize touch-none"
            onPointerDown={(e) => { rez.current = { y: e.clientY, h }; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
          />
        </div>
      </div>
    </div>
  );
}
