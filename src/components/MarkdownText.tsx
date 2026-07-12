"use client";

import React from "react";
import { MathText } from "./MathText";

// Lightweight markdown renderer for AI answers (tutor / assistant). Handles the
// subset the model actually emits — headings, bold, italic, inline code, bullet
// lists and horizontal rules — so responses no longer show raw "**", "###" or
// "*" characters. Plain text runs still get math typography via MathText.
// (No markdown library is bundled, and a full engine would be overkill here.)

// Inline: **bold**, *italic*, `code`; everything else → MathText.
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(<MathText key={`${keyBase}-t${i}`}>{text.slice(last, m.index)}</MathText>);
    }
    if (m[2] !== undefined) {
      nodes.push(<strong key={`${keyBase}-b${i}`} className="font-bold">{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      nodes.push(<em key={`${keyBase}-i${i}`}>{m[3]}</em>);
    } else if (m[4] !== undefined) {
      nodes.push(<code key={`${keyBase}-c${i}`} className="px-1 py-0.5 rounded bg-black/5 text-[0.9em] font-mono">{m[4]}</code>);
    }
    last = re.lastIndex;
    i++;
  }
  if (last < text.length) {
    nodes.push(<MathText key={`${keyBase}-t${i}`}>{text.slice(last)}</MathText>);
  }
  return nodes;
}

export function MarkdownText({ children, className }: { children: string | null | undefined; className?: string }) {
  const src = (children ?? "").replace(/\r\n/g, "\n");
  const lines = src.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let bi = 0;

  const flushList = () => {
    if (list.length === 0) return;
    const items = list;
    blocks.push(
      <ul key={`ul${bi++}`} className="list-disc pl-5 space-y-1 my-1.5">
        {items.map((it, k) => <li key={k}>{renderInline(it, `li${bi}-${k}`)}</li>)}
      </ul>
    );
    list = [];
  };

  lines.forEach((raw, li) => {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (trimmed === "") { flushList(); return; }
    // Horizontal rule: --- or *** (2+ dashes / 3+ stars)
    if (/^([-–—]{2,}|\*{3,})$/.test(trimmed)) {
      flushList();
      blocks.push(<hr key={`hr${bi++}`} className="my-3 border-t border-black/10" />);
      return;
    }
    // Heading: #, ##, ###…
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      blocks.push(
        <p key={`h${bi++}`} className={level <= 2 ? "font-extrabold text-[1.05em] mt-2 mb-1" : "font-bold mt-2 mb-0.5"}>
          {renderInline(h[2], `h${li}`)}
        </p>
      );
      return;
    }
    // Bullet: "- " or "* " (but not "**")
    const b = trimmed.match(/^([-*])\s+(.*)$/);
    if (b && !(b[1] === "*" && trimmed.startsWith("**"))) {
      list.push(b[2]);
      return;
    }
    // Paragraph
    flushList();
    blocks.push(<p key={`p${bi++}`} className="my-1">{renderInline(line, `p${li}`)}</p>);
  });
  flushList();

  return <div className={className}>{blocks}</div>;
}

export default MarkdownText;
