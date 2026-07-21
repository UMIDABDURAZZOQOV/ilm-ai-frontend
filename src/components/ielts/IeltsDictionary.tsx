"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, Star, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Sense {
  part_of_speech: string | null;
  definition: string;
  example?: string | null;
  synonyms?: string[];
}

interface DefineResponse {
  word: string;
  found: boolean;
  phonetic?: string | null;
  senses: Sense[];
}

interface IeltsExample {
  sentence: string;
  source: string;
}

type Tab = "definition" | "examples";

/**
 * IELTS Dictionary: search a word, read its senses and examples, see where it
 * appears in our own IELTS passages, and star it into "My Starred Words".
 */
export default function IeltsDictionary({ userId }: { userId: number }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("definition");
  const [entry, setEntry] = useState<DefineResponse | null>(null);
  const [examples, setExamples] = useState<IeltsExample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [starred, setStarred] = useState<string[]>([]);

  const loadStarred = useCallback(async () => {
    try {
      const data = await apiFetch(`/vocab/${userId}/starred`);
      setStarred((data.words || []).map((w: { word: string }) => w.word));
    } catch {
      setStarred([]);
    }
  }, [userId]);

  useEffect(() => {
    loadStarred();
  }, [loadStarred]);

  async function search(term?: string) {
    const w = (term ?? query).trim();
    if (!w) return;
    setQuery(w);
    setLoading(true);
    setError("");
    try {
      const [def, ex] = await Promise.all([
        apiFetch(`/vocab/define?word=${encodeURIComponent(w)}`),
        apiFetch(`/vocab/examples?word=${encodeURIComponent(w)}`).catch(() => ({ examples: [] })),
      ]);
      setEntry(def);
      setExamples(ex.examples || []);
      if (!def.found) setError(`No dictionary entry found for “${w}”.`);
    } catch {
      setError("Lookup failed. Please try again.");
      setEntry(null);
      setExamples([]);
    } finally {
      setLoading(false);
    }
  }

  const isStarred = entry ? starred.includes(entry.word.toLowerCase()) : false;

  async function toggleStar() {
    if (!entry) return;
    const w = entry.word.toLowerCase();
    try {
      if (isStarred) {
        await apiFetch(`/vocab/starred?user_id=${userId}&word=${encodeURIComponent(w)}`, { method: "DELETE" });
        setStarred((s) => s.filter((x) => x !== w));
      } else {
        await apiFetch("/vocab/starred", {
          method: "POST",
          body: JSON.stringify({ user_id: userId, word: w }),
        });
        setStarred((s) => [w, ...s]);
      }
    } catch {
      /* non-fatal */
    }
  }

  async function unstar(w: string) {
    try {
      await apiFetch(`/vocab/starred?user_id=${userId}&word=${encodeURIComponent(w)}`, { method: "DELETE" });
      setStarred((s) => s.filter((x) => x !== w));
    } catch {
      /* non-fatal */
    }
  }

  // group senses by part of speech order, keeping the API's ordering
  return (
    <div className="grid md:grid-cols-[1.4fr_1fr] gap-8">
      {/* left: search + entry */}
      <div>
        <div className="flex gap-2 mb-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="IELTS Dictionary"
            className="flex-1 rounded-lg border-2 border-slate-900 dark:border-neutral-600 bg-transparent px-4 py-2.5"
          />
          <button
            onClick={() => search()}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-slate-900 text-white font-bold disabled:opacity-60 inline-flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {entry && (
          <>
            <div className="flex gap-6 border-b border-slate-200 dark:border-neutral-800 mb-5">
              {(["definition", "examples"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-2 -mb-px font-semibold ${
                    tab === t
                      ? "border-b-2 border-slate-900 dark:border-white"
                      : "text-slate-400"
                  }`}
                >
                  {t === "definition" ? "Definition & Examples" : "Examples Only"}
                </button>
              ))}
            </div>

            {tab === "definition" ? (
              <div>
                <h3 className="text-blue-800 dark:text-blue-300 font-bold mb-3">
                  Definition of &lsquo;{entry.word}&rsquo; in Dictionary
                </h3>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-black text-red-800 dark:text-red-400">{entry.word}</span>
                  {entry.phonetic && <span className="text-slate-500">{entry.phonetic}</span>}
                  <button
                    onClick={toggleStar}
                    title={isStarred ? "Remove from My Starred" : "Add to My Starred"}
                    className="ml-auto p-1.5"
                  >
                    <Star
                      className={`w-6 h-6 ${isStarred ? "fill-amber-400 text-amber-400" : "text-slate-400"}`}
                    />
                  </button>
                </div>

                <ol className="space-y-5">
                  {entry.senses.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-semibold text-slate-500">{i + 1}.</span>
                      <div className="flex-1">
                        {s.part_of_speech && (
                          <span className="italic font-semibold mr-2">{s.part_of_speech}</span>
                        )}
                        <span>{s.definition}</span>
                        {s.example && (
                          <ul className="list-disc pl-6 mt-1.5">
                            <li className="text-emerald-700 dark:text-emerald-400">{s.example}</li>
                          </ul>
                        )}
                        {!!s.synonyms?.length && (
                          <p className="text-xs text-slate-500 mt-1">
                            Synonyms: {s.synonyms.join(", ")}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div>
                <h3 className="text-blue-800 dark:text-blue-300 font-bold mb-3">Examples in IELTS</h3>
                {examples.length ? (
                  <ol className="space-y-4">
                    {examples.map((ex, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-semibold text-slate-500">{i + 1}.</span>
                        <div>
                          <p>{ex.sentence}</p>
                          <p className="text-sm text-emerald-700 dark:text-emerald-400">{ex.source}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-slate-500 text-sm">
                    This word hasn&apos;t appeared in our IELTS passages yet.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {error && !loading && <p className="text-sm text-slate-500 mt-4">{error}</p>}
      </div>

      {/* right: My Starred */}
      <div>
        <div className="border-b border-slate-200 dark:border-neutral-800 mb-4">
          <span className="inline-block pb-2 -mb-px border-b-2 border-slate-900 dark:border-white font-semibold">
            My Starred
          </span>
        </div>

        {starred.length ? (
          <ul className="space-y-2">
            {starred.map((w) => (
              <li
                key={w}
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-neutral-800 px-3 py-2"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                <button onClick={() => search(w)} className="flex-1 text-left font-medium hover:underline">
                  {w}
                </button>
                <button onClick={() => unstar(w)} title="Remove" className="p-1 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 py-12 text-center text-slate-500">
            No starred words yet
          </div>
        )}
      </div>
    </div>
  );
}
