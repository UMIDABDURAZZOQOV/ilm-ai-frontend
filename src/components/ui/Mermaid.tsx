"use client";

import { useEffect, useRef, useState } from "react";

let idSeq = 0;

/**
 * Renders Mermaid diagram source to inline SVG. Mermaid is client-only and heavy,
 * so it's dynamically imported on first use. Invalid syntax is caught and the raw
 * code shown instead, so a bad generation never blanks the screen.
 */
export default function Mermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "strict" });
        const id = `mmd-${++idSeq}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <pre className="text-xs whitespace-pre-wrap bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 overflow-x-auto text-neutral-600 dark:text-neutral-300">
        {code}
      </pre>
    );
  }
  return <div ref={ref} className="mermaid-render w-full overflow-x-auto flex justify-center [&_svg]:max-w-full [&_svg]:h-auto" />;
}
