"use client";

import React from "react";

// Renders SAT question text with proper math typography. Handles both the plain
// "x^2 / sqrt(x)" style and the LaTeX the bank sometimes stores ($...$, \(...\),
// \frac{a}{b}, \sqrt{x}, ^{...}, \times, \le …) — exponents become real
// superscripts (x²), roots use √, and the LaTeX delimiters/commands are removed
// so no raw "$" or "\(" leaks into the UI. No LaTeX engine needed for this level.

// LaTeX command → unicode, applied to the whole string first.
function preprocessLatex(s: string): string {
  let out = s;
  // \frac{a}{b} -> (a)/(b);  \sqrt{x} -> √(x);  \text{x} -> x
  out = out.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)");
  out = out.replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)");
  out = out.replace(/\\sqrt\b/g, "√");
  out = out.replace(/\\text\s*\{([^{}]*)\}/g, "$1");
  // named operators / symbols
  const cmd: [RegExp, string][] = [
    [/\\times\b/g, "×"], [/\\cdot\b/g, "·"], [/\\div\b/g, "÷"],
    [/\\leq\b/g, "≤"], [/\\le\b/g, "≤"], [/\\geq\b/g, "≥"], [/\\ge\b/g, "≥"],
    [/\\neq\b/g, "≠"], [/\\ne\b/g, "≠"], [/\\pm\b/g, "±"], [/\\mp\b/g, "∓"],
    [/\\pi\b/g, "π"], [/\\theta\b/g, "θ"], [/\\alpha\b/g, "α"], [/\\beta\b/g, "β"],
    [/\\infty\b/g, "∞"], [/\\approx\b/g, "≈"], [/\\angle\b/g, "∠"],
    [/\\cdots\b/g, "⋯"], [/\\ldots\b/g, "…"], [/\\circ\b/g, "°"], [/\\degree\b/g, "°"],
    [/\\left\b/g, ""], [/\\right\b/g, ""], [/\\,/g, " "], [/\\!/g, ""], [/\\;/g, " "],
  ];
  for (const [re, rep] of cmd) out = out.replace(re, rep);
  // strip inline-math delimiters
  out = out.replace(/\\\(|\\\)|\\\[|\\\]/g, "");
  out = out.replace(/\$\$?/g, "");
  return out;
}

// Plain-text symbol niceties (no LaTeX).
const SYMBOLS: [RegExp, string][] = [
  [/\bsqrt\s*/g, "√"],
  [/<=/g, "≤"],
  [/>=/g, "≥"],
  [/!=/g, "≠"],
  [/\+\/-/g, "±"],
  [/\bpi\b/g, "π"],
  [/\btheta\b/g, "θ"],
  [/\bdegrees?\b/g, "°"],
  [/(\d)\s*\/\s*(\d)/g, "$1⁄$2"], // simple numeric fractions: 3/4 -> 3⁄4
];
// NOTE: we deliberately do NOT convert "*" to "×" — it collides with markdown
// bold/italic (**...**, *...*) and mangles AI-tutor prose.

function applySymbols(s: string): string {
  let out = s;
  for (const [re, rep] of SYMBOLS) out = out.replace(re, rep);
  return out;
}

// Split a string into runs, turning ^{...}/^n into <sup> and _{...}/_n into <sub>.
function renderRuns(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\^|_)(\{[^}]*\}|[A-Za-z0-9.\-+]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(applySymbols(text.slice(last, m.index)));
    const raw = m[2].startsWith("{") ? m[2].slice(1, -1) : m[2];
    const inner = applySymbols(raw);
    if (m[1] === "^") {
      nodes.push(<sup key={`${keyBase}-s${i}`} className="text-[0.72em] leading-none">{inner}</sup>);
    } else {
      nodes.push(<sub key={`${keyBase}-b${i}`} className="text-[0.72em] leading-none">{inner}</sub>);
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
  const text = preprocessLatex(children ?? "");
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
