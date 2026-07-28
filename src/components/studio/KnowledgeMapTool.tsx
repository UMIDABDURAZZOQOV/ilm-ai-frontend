"use client";

import { useMemo, useState } from "react";
import { Network, Loader2 } from "lucide-react";
import { knowledgeMap, type MapNode, type MapEdge } from "@/lib/studioApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

const GROUP_COLORS = ["#8B5CF6", "#0EA5E9", "#10B981", "#F59E0B", "#F43F5E", "#6366F1", "#14B8A6", "#EC4899"];

export default function KnowledgeMapTool({ lang, userId }: { lang: string; userId: number }) {
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<{ nodes: MapNode[]; edges: MapEdge[] } | null>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState<string | null>(null);

  async function build() {
    setBusy(true);
    setError("");
    setActive(null);
    try {
      const r = await knowledgeMap(userId, lang);
      setData({ nodes: r.nodes, edges: r.edges });
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      setError(err?.detail === "no_materials" || err?.status === 400 ? "no_materials" : "failed");
    } finally {
      setBusy(false);
    }
  }

  // Radial layout: place nodes evenly on a circle; colour by group.
  const layout = useMemo(() => {
    if (!data) return null;
    const R = 155;
    const cx = 200;
    const cy = 200;
    const groups = Array.from(new Set(data.nodes.map((n) => n.group || "")));
    const pos: Record<string, { x: number; y: number; color: string }> = {};
    data.nodes.forEach((n, i) => {
      const ang = (i / data.nodes.length) * Math.PI * 2 - Math.PI / 2;
      const gi = Math.max(0, groups.indexOf(n.group || ""));
      pos[n.id] = { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang), color: GROUP_COLORS[gi % GROUP_COLORS.length] };
    });
    return pos;
  }, [data]);

  const neighbors = useMemo(() => {
    if (!data || !active) return new Set<string>();
    const s = new Set<string>();
    data.edges.forEach((e) => {
      if (e.from === active) s.add(e.to);
      if (e.to === active) s.add(e.from);
    });
    return s;
  }, [data, active]);

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">{tr(lang, "Bilim xaritasi", "Карта знаний", "Knowledge map")}</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {tr(lang, "Materialingizdagi tushunchalar va ular qanday bog'langani.", "Концепции материала и их связи.", "The concepts in your material and how they connect.")}
      </p>

      {!data ? (
        <button onClick={build} disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
          {busy ? tr(lang, "Chizilyapti...", "Строится...", "Building...") : tr(lang, "Xarita yaratish", "Создать карту", "Build map")}
        </button>
      ) : (
        <div>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
            <svg viewBox="0 0 400 400" className="w-full h-auto min-w-[340px]">
              {layout &&
                data.edges.map((e, i) => {
                  const a = layout[e.from];
                  const b = layout[e.to];
                  if (!a || !b) return null;
                  const dim = active && e.from !== active && e.to !== active;
                  return (
                    <line
                      key={i}
                      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke={dim ? "#cbd5e133" : "#94a3b8"}
                      strokeWidth={active && (e.from === active || e.to === active) ? 2 : 1}
                    />
                  );
                })}
              {layout &&
                data.nodes.map((n) => {
                  const p = layout[n.id];
                  if (!p) return null;
                  const dim = active && n.id !== active && !neighbors.has(n.id);
                  return (
                    <g
                      key={n.id}
                      onClick={() => setActive((cur) => (cur === n.id ? null : n.id))}
                      style={{ cursor: "pointer", opacity: dim ? 0.3 : 1 }}
                    >
                      <circle cx={p.x} cy={p.y} r={n.id === active ? 8 : 6} fill={p.color} />
                      <text
                        x={p.x}
                        y={p.y - 10}
                        textAnchor="middle"
                        className="fill-neutral-700 dark:fill-neutral-200"
                        style={{ fontSize: 9, fontWeight: 700 }}
                      >
                        {n.label.length > 18 ? n.label.slice(0, 17) + "…" : n.label}
                      </text>
                    </g>
                  );
                })}
            </svg>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            {tr(lang, "Bog'lanishlarni ko'rish uchun tugunni bosing.", "Нажмите на узел, чтобы увидеть связи.", "Tap a node to highlight its connections.")}
          </p>
          <button onClick={build} disabled={busy} className="mt-3 text-sm font-bold text-sky-500 hover:text-sky-600 disabled:opacity-50">
            {tr(lang, "Qayta yaratish", "Пересоздать", "Rebuild")}
          </button>
        </div>
      )}

      {error === "no_materials" && <p className="text-sm text-amber-600 mt-3">{tr(lang, "Avval material yuklang.", "Сначала загрузите материал.", "Upload material first.")}</p>}
      {error === "failed" && <p className="text-sm text-red-500 mt-3">{tr(lang, "Bo'lmadi — qayta urinib ko'ring.", "Не удалось — попробуйте снова.", "Couldn't build it — try again.")}</p>}
    </div>
  );
}
