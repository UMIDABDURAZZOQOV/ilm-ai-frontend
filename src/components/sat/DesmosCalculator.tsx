"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Move, Minus, ExternalLink, ChevronDown } from "lucide-react";

/**
 * The full Desmos calculator, embedded the way the Digital SAT (and OnePrep) does it:
 * a floating panel a student opens over a Math question and drags out of the way, with
 * a Graphing / Scientific toggle, a Pop Out to a full window, and drag / resize /
 * minimize / close. Only ever mounted on Math questions (see SessionPage).
 *
 * Desmos ships both a graphing- and a scientific-calculator JS API; we load it once
 * from their CDN and let their own widgets own the panel body, so both are the real
 * thing — every tool, keypad and setting — not a reimplementation. The API key is
 * Desmos's published demo key by default; override with NEXT_PUBLIC_DESMOS_API_KEY.
 */

const API_KEY =
  process.env.NEXT_PUBLIC_DESMOS_API_KEY || "dcb31709b452b1cf9dc26972add0fda6";
const SCRIPT_SRC = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${API_KEY}`;

type Mode = "graphing" | "scientific";

// One load per page: a second <script> re-defines window.Desmos and orphans live graphs.
let scriptPromise: Promise<void> | null = null;
function loadDesmos(): Promise<void> {
  if (typeof window !== "undefined" && (window as any).Desmos) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Desmos failed to load"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

function makeCalculator(Desmos: any, mode: Mode, el: HTMLElement) {
  return mode === "scientific"
    ? Desmos.ScientificCalculator(el)
    : Desmos.GraphingCalculator(el, {
        keypad: true,
        expressions: true,
        settingsMenu: true,
        zoomButtons: true,
        border: false,
      });
}

export default function DesmosCalculator({ onClose }: { onClose: () => void }) {
  const graphRef = useRef<HTMLDivElement | null>(null);
  const calcRef = useRef<any>(null);
  const [error, setError] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [mode, setMode] = useState<Mode>("graphing");
  const [menuOpen, setMenuOpen] = useState(false);

  const startPos = () => {
    if (typeof window === "undefined") return { x: 80, y: 96 };
    return { x: Math.max(16, Math.min(120, window.innerWidth - 540)), y: 96 };
  };
  const [pos, setPos] = useState(startPos);
  const [size, setSize] = useState({ w: 500, h: 520 });

  // (Re)build the widget whenever the mode changes or the script first loads.
  useEffect(() => {
    let cancelled = false;
    loadDesmos()
      .then(() => {
        if (cancelled || !graphRef.current) return;
        if (calcRef.current) {
          calcRef.current.destroy();
          calcRef.current = null;
        }
        calcRef.current = makeCalculator((window as any).Desmos, mode, graphRef.current);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
      if (calcRef.current) {
        calcRef.current.destroy();
        calcRef.current = null;
      }
    };
  }, [mode]);

  // Desmos measures its container on creation, so tell it when the panel changes size.
  useEffect(() => {
    calcRef.current?.resize();
  }, [size, minimized]);

  // ── Pop Out: a full-window copy of the current calculator ────────────────
  const popOut = () => {
    const w = window.open("", "desmos_popout", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Calculator</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>html,body{margin:0;height:100%}#c{position:absolute;inset:0}</style>
      <script src="${SCRIPT_SRC}"></script></head>
      <body><div id="c"></div><script>
        (function boot(){
          if(!window.Desmos){return setTimeout(boot,60);}
          ${mode === "scientific"
            ? "Desmos.ScientificCalculator(document.getElementById('c'));"
            : "Desmos.GraphingCalculator(document.getElementById('c'),{keypad:true,settingsMenu:true,zoomButtons:true});"}
        })();
      <\/script></body></html>`);
    w.document.close();
  };

  // ── dragging the panel by its title bar ──────────────────────────────────
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

  // ── resizing from the bottom-right corner ────────────────────────────────
  const rez = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const onRezStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    rez.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onRezMove = (e: React.PointerEvent) => {
    if (!rez.current) return;
    setSize({
      w: Math.max(340, rez.current.w + (e.clientX - rez.current.x)),
      h: Math.max(280, rez.current.h + (e.clientY - rez.current.y)),
    });
  };
  const onRezEnd = () => (rez.current = null);

  return (
    <div
      className="fixed z-[70] rounded-xl shadow-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex flex-col"
      style={{ left: pos.x, top: pos.y, width: size.w, height: minimized ? "auto" : size.h }}
      role="dialog"
      aria-label="Calculator"
    >
      {/* title bar — also the drag handle */}
      <div
        className="h-10 shrink-0 flex items-center gap-2 px-3 bg-slate-100 dark:bg-slate-800 cursor-move select-none touch-none"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
      >
        <Move className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Calculator</span>

        {/* Graphing / Scientific toggle */}
        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            {mode === "graphing" ? "Graphing" : "Scientific"}
            <ChevronDown className="h-3 w-3" />
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-full mt-1 w-32 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1 z-10">
              {(["graphing", "scientific"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    mode === m ? "font-bold text-emerald-600 dark:text-emerald-400" : ""
                  }`}
                >
                  {m === "graphing" ? "Graphing" : "Scientific"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <button
          onClick={popOut}
          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
          title="Open in a separate window"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Pop Out
        </button>
        <button
          onClick={() => setMinimized((m) => !m)}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          aria-label={minimized ? "Expand" : "Minimize"}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          aria-label="Close calculator"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!minimized && (
        <div className="relative flex-1 min-h-0">
          {error ? (
            <div className="h-full grid place-items-center p-6 text-center text-sm text-slate-500">
              The calculator could not load. Check your connection and reopen it.
            </div>
          ) : (
            // Keyed so React swaps the mount node when the mode changes.
            <div key={mode} ref={graphRef} className="absolute inset-0" />
          )}
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
