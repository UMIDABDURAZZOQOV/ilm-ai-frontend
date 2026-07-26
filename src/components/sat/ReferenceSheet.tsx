"use client";

import { useRef, useState, useCallback } from "react";
import { X, Move, Minus } from "lucide-react";

/**
 * The Digital SAT Math reference sheet, drawn as a floating panel like the calculator.
 * These are the standard reference formulas every SAT prints — the geometry facts and
 * their figures — so a student never has to recall them. Figures are our own SVG; the
 * formulas are standard mathematics. Nothing is omitted: all twelve figure-formulas
 * and the three arc/angle facts are here, matching the official sheet's order.
 */

// One figure card: an SVG diagram over its formula(s).
function Card({ children, formula }: { children: React.ReactNode; formula: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div className="h-24 flex items-center justify-center">{children}</div>
      <div className="text-[15px] text-slate-800 dark:text-slate-100 font-serif text-center leading-tight">
        {formula}
      </div>
    </div>
  );
}

// Small helpers for formula notation.
const Sup = ({ children }: { children: React.ReactNode }) => <sup className="text-[0.7em]">{children}</sup>;
const Frac = ({ n, d }: { n: React.ReactNode; d: React.ReactNode }) => (
  <span className="inline-flex flex-col items-center align-middle mx-0.5 text-[0.8em] leading-none">
    <span className="px-1">{n}</span>
    <span className="border-t border-current px-1 pt-0.5">{d}</span>
  </span>
);

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.4 } as const;
const label = { fontSize: 11, fontStyle: "italic", fill: "currentColor" } as const;

export default function ReferenceSheet({ onClose }: { onClose: () => void }) {
  const [minimized, setMinimized] = useState(false);
  const startPos = () => (typeof window === "undefined" ? { x: 40, y: 96 } : { x: 40, y: 96 });
  const [pos, setPos] = useState(startPos);
  const [size, setSize] = useState({ w: 460, h: 560 });

  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const onDragStart = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({
      x: Math.min(window.innerWidth - 120, Math.max(-size.w + 140, e.clientX - drag.current.dx)),
      y: Math.min(window.innerHeight - 48, Math.max(8, e.clientY - drag.current.dy)),
    });
  }, [size.w]);
  const onDragEnd = () => (drag.current = null);

  const rez = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const onRezStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    rez.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onRezMove = (e: React.PointerEvent) => {
    if (!rez.current) return;
    setSize({
      w: Math.max(320, rez.current.w + (e.clientX - rez.current.x)),
      h: Math.max(280, rez.current.h + (e.clientY - rez.current.y)),
    });
  };
  const onRezEnd = () => (rez.current = null);

  return (
    <div
      className="fixed z-[70] rounded-xl shadow-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex flex-col text-slate-700 dark:text-slate-200"
      style={{ left: pos.x, top: pos.y, width: size.w, height: minimized ? "auto" : size.h }}
      role="dialog"
      aria-label="Reference sheet"
    >
      <div
        className="h-10 shrink-0 flex items-center gap-2 px-3 bg-slate-100 dark:bg-slate-800 cursor-move select-none touch-none"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
      >
        <Move className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-sm font-bold flex-1">Reference Sheet</span>
        <button onClick={() => setMinimized((m) => !m)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Minimize">
          <Minus className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      {!minimized && (
        <div className="relative flex-1 min-h-0">
          <div className="absolute inset-0 overflow-y-auto px-6 py-2">
            <div className="grid grid-cols-2 gap-x-6 divide-slate-100">
              {/* Circle */}
              <Card formula={<><span>A = πr<Sup>2</Sup></span><br /><span>C = 2πr</span></>}>
                <svg width="90" height="80" viewBox="0 0 90 80">
                  <circle cx="45" cy="40" r="30" {...S} />
                  <circle cx="45" cy="40" r="1.6" fill="currentColor" />
                  <line x1="45" y1="40" x2="75" y2="40" {...S} />
                  <text x="57" y="35" style={label}>r</text>
                </svg>
              </Card>

              {/* Rectangle */}
              <Card formula={<span>A = ℓw</span>}>
                <svg width="110" height="70" viewBox="0 0 110 70">
                  <rect x="15" y="18" width="80" height="38" {...S} />
                  <text x="52" y="14" style={label}>ℓ</text>
                  <text x="99" y="40" style={label}>w</text>
                </svg>
              </Card>

              {/* Triangle */}
              <Card formula={<span>A = <Frac n="1" d="2" />bh</span>}>
                <svg width="100" height="80" viewBox="0 0 100 80">
                  <path d="M15 62 L85 62 L58 18 Z" {...S} />
                  <line x1="58" y1="18" x2="58" y2="62" {...S} strokeDasharray="3 3" />
                  <rect x="52" y="56" width="6" height="6" {...S} strokeWidth={1} />
                  <text x="62" y="44" style={label}>h</text>
                  <text x="46" y="74" style={label}>b</text>
                </svg>
              </Card>

              {/* Right triangle (Pythagorean) */}
              <Card formula={<span>c<Sup>2</Sup> = a<Sup>2</Sup> + b<Sup>2</Sup></span>}>
                <svg width="100" height="80" viewBox="0 0 100 80">
                  <path d="M20 62 L80 62 L80 18 Z" {...S} />
                  <rect x="74" y="56" width="6" height="6" {...S} strokeWidth={1} />
                  <text x="44" y="74" style={label}>a</text>
                  <text x="85" y="44" style={label}>b</text>
                  <text x="44" y="36" style={label}>c</text>
                </svg>
              </Card>

              {/* 30-60-90 */}
              <Card formula={<span className="text-[13px]">Special right triangles</span>}>
                <svg width="110" height="80" viewBox="0 0 110 80">
                  <path d="M20 62 L92 62 L92 20 Z" {...S} />
                  <rect x="86" y="56" width="6" height="6" {...S} strokeWidth={1} />
                  <text x="30" y="58" style={label}>30°</text>
                  <text x="78" y="34" style={label}>60°</text>
                  <text x="48" y="74" style={label}>x√3</text>
                  <text x="95" y="44" style={label}>x</text>
                  <text x="48" y="36" style={label}>2x</text>
                </svg>
              </Card>

              {/* 45-45-90 */}
              <Card formula={<span className="text-[13px]">Special right triangles</span>}>
                <svg width="110" height="80" viewBox="0 0 110 80">
                  <path d="M20 62 L92 62 L92 20 Z" {...S} />
                  <rect x="86" y="56" width="6" height="6" {...S} strokeWidth={1} />
                  <text x="28" y="58" style={label}>45°</text>
                  <text x="72" y="34" style={label}>45°</text>
                  <text x="48" y="74" style={label}>s</text>
                  <text x="95" y="44" style={label}>s</text>
                  <text x="44" y="36" style={label}>s√2</text>
                </svg>
              </Card>

              {/* Rectangular box */}
              <Card formula={<span>V = ℓwh</span>}>
                <svg width="110" height="80" viewBox="0 0 110 80">
                  <path d="M20 32 L70 32 L70 66 L20 66 Z" {...S} />
                  <path d="M20 32 L38 18 L88 18 L70 32" {...S} />
                  <path d="M70 66 L88 52 L88 18" {...S} />
                  <line x1="20" y1="66" x2="20" y2="66" {...S} />
                  <text x="42" y="76" style={label}>ℓ</text>
                  <text x="74" y="52" style={label}>w</text>
                  <text x="12" y="52" style={label}>h</text>
                </svg>
              </Card>

              {/* Cylinder */}
              <Card formula={<span>V = πr<Sup>2</Sup>h</span>}>
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <ellipse cx="45" cy="20" rx="26" ry="9" {...S} />
                  <path d="M19 20 L19 70" {...S} />
                  <path d="M71 20 L71 70" {...S} />
                  <path d="M19 70 A26 9 0 0 0 71 70" {...S} />
                  <line x1="45" y1="20" x2="71" y2="20" {...S} strokeDasharray="3 3" />
                  <text x="55" y="17" style={label}>r</text>
                  <text x="75" y="48" style={label}>h</text>
                </svg>
              </Card>

              {/* Sphere */}
              <Card formula={<span>V = <Frac n="4" d="3" />πr<Sup>3</Sup></span>}>
                <svg width="90" height="80" viewBox="0 0 90 80">
                  <circle cx="45" cy="40" r="30" {...S} />
                  <ellipse cx="45" cy="40" rx="30" ry="10" {...S} strokeDasharray="3 3" />
                  <line x1="45" y1="40" x2="75" y2="40" {...S} />
                  <text x="57" y="35" style={label}>r</text>
                </svg>
              </Card>

              {/* Cone */}
              <Card formula={<span>V = <Frac n="1" d="3" />πr<Sup>2</Sup>h</span>}>
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <path d="M45 12 L19 68 A26 9 0 0 0 71 68 Z" {...S} />
                  <ellipse cx="45" cy="68" rx="26" ry="9" {...S} strokeDasharray="3 3" />
                  <line x1="45" y1="68" x2="71" y2="68" {...S} />
                  <line x1="45" y1="12" x2="45" y2="68" {...S} strokeDasharray="3 3" />
                  <text x="55" y="66" style={label}>r</text>
                  <text x="34" y="46" style={label}>h</text>
                </svg>
              </Card>

              {/* Pyramid */}
              <Card formula={<span>V = <Frac n="1" d="3" />ℓwh</span>}>
                <svg width="110" height="90" viewBox="0 0 110 90">
                  <path d="M20 66 L70 66 L88 52 L38 52 Z" {...S} />
                  <path d="M20 66 L54 14 L88 52" {...S} />
                  <path d="M38 52 L54 14 L70 66" {...S} strokeDasharray="3 3" />
                  <line x1="54" y1="14" x2="54" y2="59" {...S} strokeDasharray="3 3" />
                  <text x="56" y="44" style={label}>h</text>
                  <text x="40" y="78" style={label}>ℓ</text>
                  <text x="80" y="66" style={label}>w</text>
                </svg>
              </Card>
            </div>

            {/* The three facts */}
            <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3 text-[13.5px] leading-snug pb-2">
              <p>The number of degrees of arc in a circle is 360.</p>
              <p>The number of radians of arc in a circle is 2π.</p>
              <p>The sum of the measures in degrees of the angles of a triangle is 180.</p>
            </div>
          </div>

          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize touch-none"
            onPointerDown={onRezStart}
            onPointerMove={onRezMove}
            onPointerUp={onRezEnd}
          >
            <svg viewBox="0 0 10 10" className="w-full h-full text-slate-400">
              <path d="M9 1 L9 9 L1 9" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
