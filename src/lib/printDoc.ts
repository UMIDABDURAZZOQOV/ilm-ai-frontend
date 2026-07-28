// Open a clean, print-ready window for the given Markdown and trigger the browser
// print dialog — which every browser lets the user "Save as PDF" from. No PDF
// library needed (keeps the bundle lean and CSP-safe).

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  // bold, italics, inline code — applied after HTML-escaping.
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

// A deliberately small Markdown subset: headings, bullet/numbered lists, blank
// lines and paragraphs — enough for cheat sheets and lesson notes.
function mdToHtml(md: string): string {
  const lines = md.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;
  const closeList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+\.\s+(.*)$/);

    if (h) {
      closeList();
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
    } else if (bullet) {
      if (listType !== "ul") { closeList(); out.push("<ul>"); listType = "ul"; }
      out.push(`<li>${inline(bullet[1])}</li>`);
    } else if (numbered) {
      if (listType !== "ol") { closeList(); out.push("<ol>"); listType = "ol"; }
      out.push(`<li>${inline(numbered[1])}</li>`);
    } else if (!line.trim()) {
      closeList();
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join("\n");
}

export function printMarkdown(title: string, md: string) {
  const w = window.open("", "_blank", "width=820,height=1000");
  if (!w) return;
  const body = mdToHtml(md);
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #111; max-width: 720px; margin: 32px auto; padding: 0 24px; line-height: 1.5; }
      h1 { font-size: 22px; margin: 0 0 12px; } h2 { font-size: 17px; margin: 18px 0 6px; border-bottom: 1px solid #eee; padding-bottom: 3px; }
      h3, h4 { font-size: 14px; margin: 12px 0 4px; }
      p, li { font-size: 13px; } ul, ol { margin: 4px 0 10px 20px; } li { margin: 2px 0; }
      code { background: #f3f4f6; padding: 1px 4px; border-radius: 4px; font-size: 12px; }
      @media print { body { margin: 0; } }
    </style></head><body>${body}</body></html>`);
  w.document.close();
  w.focus();
  // Give the new document a tick to lay out before printing.
  setTimeout(() => w.print(), 300);
}
