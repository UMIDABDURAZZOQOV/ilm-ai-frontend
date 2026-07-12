"use client";

import React from "react";

// Renders SAT question text with proper math typography — exponents as real
// superscripts (x² not x^2), subscripts (a₁), square roots (√), fractions and
// the common operators (×, ÷, ≤, ≥, ≠, °, π, …). Bluebook shows real math, so
// the plain-text "x^2 / sqrt(x) / <=" that the question bank stores is upgraded
// to that at render time — no LaTeX engine needed for SAT-level notation.

// Inline symbol replacements (applied to every text run).
const SYMBOLS: [RegExp, string][] = [
  [/\bsqrt\s*/g, "√"],
  [/<=/g, "≤"],
  [/>=/g, "≥"],
  [/!=/g, "≠"],
  [/\+\/-/g, "±"],
  [/\bpi\b/g, "π"],
  [/\btheta\b/g, "θ"],
  [/\bdegrees?\b/g, "°"],
  [/\bdeg\b/g, "°"],
  [/\*/g, "×"],
  [/(\d)\s*\/\s*(\d)/g, "$1⁄$2"], // simple numeric fractions: 3/4 -> 3⁄4
];

function applySymbols(s: string): string {
  let out = s;
  for (const [re, rep] of SYMBOLS) out = out.replace(re, rep);
  return out;
}

// Split a string into runs, turning ^{...}/^n into <sup> and _{...}/_n into <sub>.
// Everything else passes through applySymbols.
function renderRuns(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Matches ^{...} | ^word | _{...} | _word  (word = letters/digits/-/. run)
  const re = /(\^|_)(\{[^}]*\}|[A-Za-z0-9.\-]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(applySymbols(text.slice(last, m.index)));
    }
    const raw = m[2].startsWith("{") ? m[2].slice(1, -1) : m[2];
    const inner = applySymbols(raw);
    if (m[1] === "^") {
      nodes.push(
        <sup key={`${keyBase}-s${i}`} className="text-[0.72em] leading-none">
          {inner}
        </sup>
      );
    } else {
      nodes.push(
        <sub key={`${keyBase}-b${i}`} className="text-[0.72em] leading-none">
          {inner}
        </sub>
      );
    }
    last = re.lastIndex;
    i++;
  }
  if (last < text.length) nodes.push(applySymbols(text.slice(last)));
  return nodes;
}

export function MathText({
  children,
  className,
}: {
  children: string | null | undefined;
  className?: string;
}) {
  const text = children ?? "";
  // Preserve line breaks the source may contain.
  const lines = text.split("\n");
  return (
    <span className={className}>
      {lines.map((line, li) => (
        <React.Fragment key={li}>
          {li > 0 && <br />}
          {renderRuns(line, `l${li}`)}
        </React.Fragment>
      ))}
    </span>
  );
}

export default MathText;
