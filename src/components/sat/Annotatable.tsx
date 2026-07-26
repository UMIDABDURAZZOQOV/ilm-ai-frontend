"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Highlighter, StickyNote, Trash2 } from "lucide-react";

/**
 * Bluebook-style highlighting and notes for a block of exam text.
 *
 * Select text inside the block and a small popover offers Highlight or Note; both
 * persist per question in localStorage and survive navigating away and back. The visual
 * highlight is drawn with the CSS Custom Highlight API, so the passage's own DOM — which
 * MathText fills with <sup>/<span> for maths — is never mutated and never breaks.
 * Annotations are stored as character offsets into the block's text and rebuilt into
 * DOM Ranges on every render, which keeps them stable across re-renders and resizes.
 */

interface Annotation {
  id: string;
  start: number;
  end: number;
  text: string;
  note?: string;
}

const supportsHighlight =
  typeof window !== "undefined" && "highlights" in CSS && typeof (window as any).Highlight === "function";

// Walk the text nodes of `root` and return the node+offset for a global character index.
function locate(root: Node, target: number): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let seen = 0;
  let node = walker.nextNode() as Text | null;
  while (node) {
    const len = node.data.length;
    if (target <= seen + len) return { node, offset: target - seen };
    seen += len;
    node = walker.nextNode() as Text | null;
  }
  return null;
}

// Character offset of a (node, offset) position within root's full text.
function offsetOf(root: Node, node: Node, offset: number): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let seen = 0;
  let n = walker.nextNode();
  while (n) {
    if (n === node) return seen + offset;
    seen += (n as Text).data.length;
    n = walker.nextNode();
  }
  return seen;
}

export default function Annotatable({
  storageKey,
  children,
  className,
}: {
  storageKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [anns, setAnns] = useState<Annotation[]>([]);
  const [popover, setPopover] = useState<{ x: number; y: number; start: number; end: number; text: string } | null>(null);
  const [noteFor, setNoteFor] = useState<Annotation | null>(null);
  const [draft, setDraft] = useState("");

  // Load / persist per question.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`annot-${storageKey}`);
      setAnns(raw ? JSON.parse(raw) : []);
    } catch {
      setAnns([]);
    }
    setPopover(null);
    setNoteFor(null);
  }, [storageKey]);

  const persist = useCallback((next: Annotation[]) => {
    setAnns(next);
    try {
      if (next.length) localStorage.setItem(`annot-${storageKey}`, JSON.stringify(next));
      else localStorage.removeItem(`annot-${storageKey}`);
    } catch {
      /* quota — annotations are a convenience */
    }
  }, [storageKey]);

  // Paint the highlights with the CSS Custom Highlight API after every change.
  useEffect(() => {
    if (!supportsHighlight || !ref.current) return;
    const ranges: Range[] = [];
    for (const a of anns) {
      const s = locate(ref.current, a.start);
      const e = locate(ref.current, a.end);
      if (!s || !e) continue;
      const r = document.createRange();
      r.setStart(s.node, s.offset);
      r.setEnd(e.node, e.offset);
      ranges.push(r);
    }
    const hl = new (window as any).Highlight(...ranges);
    (CSS as any).highlights.set(`sat-${storageKey}`, hl);
    return () => (CSS as any).highlights.delete(`sat-${storageKey}`);
  }, [anns, storageKey]);

  const onMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ref.current) return setPopover(null);
    const range = sel.getRangeAt(0);
    if (!ref.current.contains(range.commonAncestorContainer)) return;
    const start = offsetOf(ref.current, range.startContainer, range.startOffset);
    const end = offsetOf(ref.current, range.endContainer, range.endOffset);
    const text = sel.toString();
    if (end - start < 1 || !text.trim()) return setPopover(null);
    const rect = range.getBoundingClientRect();
    setPopover({ x: rect.left + rect.width / 2, y: rect.top - 8, start: Math.min(start, end), end: Math.max(start, end), text });
  };

  const addHighlight = () => {
    if (!popover) return;
    const a: Annotation = { id: crypto.randomUUID(), start: popover.start, end: popover.end, text: popover.text };
    persist([...anns, a]);
    setPopover(null);
    window.getSelection()?.removeAllRanges();
  };

  const startNote = () => {
    if (!popover) return;
    const a: Annotation = { id: crypto.randomUUID(), start: popover.start, end: popover.end, text: popover.text };
    persist([...anns, a]);
    setNoteFor(a);
    setDraft("");
    setPopover(null);
    window.getSelection()?.removeAllRanges();
  };

  const saveNote = () => {
    if (!noteFor) return;
    persist(anns.map((a) => (a.id === noteFor.id ? { ...a, note: draft.trim() || undefined } : a)));
    setNoteFor(null);
  };

  const remove = (id: string) => persist(anns.filter((a) => a.id !== id));

  const notes = anns.filter((a) => a.note);

  return (
    <>
      <style>{`::highlight(sat-${storageKey}){background:#fef08a;color:inherit}`}</style>
      <div ref={ref} className={className} onMouseUp={onMouseUp}>
        {children}
      </div>

      {/* selection popover */}
      {popover && (
        <div
          className="fixed z-[80] -translate-x-1/2 -translate-y-full flex items-center gap-1 rounded-lg bg-slate-900 text-white shadow-xl px-1 py-1"
          style={{ left: popover.x, top: popover.y }}
        >
          <button onClick={addHighlight} className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded hover:bg-slate-700">
            <Highlighter className="h-3.5 w-3.5" /> Highlight
          </button>
          <button onClick={startNote} className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded hover:bg-slate-700">
            <StickyNote className="h-3.5 w-3.5" /> Note
          </button>
        </div>
      )}

      {/* note editor */}
      {noteFor && (
        <div className="fixed inset-0 z-[85] grid place-items-center bg-black/30" onClick={() => setNoteFor(null)}>
          <div className="w-80 rounded-xl bg-white dark:bg-slate-900 p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs text-slate-500 mb-1">Note on:</p>
            <p className="text-sm font-serif mb-3 line-clamp-2 italic">“{noteFor.text}”</p>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a note…"
              className="w-full h-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent p-2 text-sm resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => { remove(noteFor.id); setNoteFor(null); }} className="text-xs font-semibold text-red-500 px-3 py-1.5">Delete</button>
              <button onClick={saveNote} className="text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg px-3 py-1.5">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* notes list under the passage */}
      {notes.length > 0 && (
        <div className="mt-4 space-y-2">
          {notes.map((a) => (
            <div key={a.id} className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 p-2.5 text-sm">
              <div className="flex items-start gap-2">
                <StickyNote className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-500 italic line-clamp-1">“{a.text}”</p>
                  <p className="whitespace-pre-wrap">{a.note}</p>
                </div>
                <button onClick={() => remove(a.id)} className="text-slate-400 hover:text-red-500" aria-label="Delete note">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
