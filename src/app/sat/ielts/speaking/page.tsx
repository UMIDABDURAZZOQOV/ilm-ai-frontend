"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mic } from "lucide-react";
import { getSpeaking, submitSpeaking, type IeltsSpeaking } from "@/lib/ieltsApi";
import { bookTitle, groupByTest, parseCambridgeTitle } from "@/lib/cambridge";
import SpeakingExam, { type SpeakingPart, type SpeakingFeedback } from "@/components/ielts/SpeakingExam";
import FullScreenExam from "@/components/ielts/FullScreenExam";
import { useAuth } from "@/hooks/useAuth";

/** The grader returns "6.5 - Fluency…"; the band is the leading number. */
function leadingBand(s: string | null): number | undefined {
  const m = s && /(\d(?:\.\d)?)/.exec(s);
  return m ? Number(m[1]) : undefined;
}

/** Blob → bare base64 (no data: prefix), for the JSON body. */
function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

const PART_INTRO: Record<number, string> = {
  1: "The examiner asks you about yourself, your home, work or studies and other familiar topics.",
  2: "You will have to talk about the topic for 1 to 2 minutes. You have 1 minute to think about what you are going to say. You can make some notes to help you if you wish.",
  3: "Discussion topics — the examiner asks broader questions related to the Part 2 topic.",
};

export default function IeltsSpeakingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [parts, setParts] = useState<IeltsSpeaking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<IeltsSpeaking[] | null>(null);
  const [activePart, setActivePart] = useState(0);

  useEffect(() => {
    getSpeaking()
      .then(setParts)
      .catch(() => setError("Could not load the speaking topics."));
  }, []);

  // Opened from the IELTS home as ?test=3 — show that test only, so a skill page
  // reached from a test card is that test's paper rather than the whole catalogue.
  const params = useSearchParams();
  const testFilter = Number(params.get("test")) || null;
  // Two books now ship a "Test 1", so the test number alone no longer identifies a
  // paper: opening Cambridge 20 Test 1 listed Cambridge 21's Test 1 beside it, and the
  // "one match, open it straight away" shortcut stopped firing because there were two.
  const bookFilter = Number(params.get("book")) || null;

  const books = useMemo(
    () => groupByTest(parts ?? [], (p) => p.topic).filter(
      (g) => (!testFilter || g.test === testFilter) && (!bookFilter || g.book === bookFilter)),
    [parts, testFilter, bookFilter]
  );

  // Arriving from a test card means "sit this paper", so open it straight away.
  useEffect(() => {
    if (!testFilter || open || books.length !== 1) return;
    setOpen(books[0].items.map((x) => x.item));
  }, [testFilter, open, books]);

  if (open) {
    const current = open[activePart];
    const ref = parseCambridgeTitle(current.topic);
    const part: SpeakingPart = {
      part: (current.part as 1 | 2 | 3) ?? 1,
      intro: PART_INTRO[current.part] ?? "",
      topic: ref?.title ?? current.topic,
      // Part 2 has no question list — the cue card is the prompt.
      questions: current.questions?.length
        ? current.questions
        : current.cue_card
        ? [current.cue_card]
        : [],
      prep_seconds: current.prep_seconds ?? undefined,
      speak_seconds: current.speak_seconds ?? undefined,
    };
    return (
      <FullScreenExam
        title={`Speaking — Test ${ref?.test ?? ""}`}
        subtitle={ref ? `Cambridge ${ref.book}` : null}
        onExit={() => (testFilter ? router.push("/sat/ielts") : setOpen(null))}
        bottom={
          // All three parts are one interview; the navigator moves between them.
          <div className="flex items-center justify-center gap-2 py-3">
            {open.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActivePart(i)}
                className={`w-10 py-2 rounded-lg font-bold text-sm border ${
                  i === activePart
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 dark:border-neutral-700"
                }`}
              >
                {p.part}
              </button>
            ))}
          </div>
        }
      >
        <div className="h-full overflow-y-auto p-4">
          <SpeakingExam
            key={current.id}
            part={part}
            onSubmit={async (audio: Blob, seconds: number): Promise<SpeakingFeedback> => {
              if (!user) throw new Error("Sign in to get a band score.");
              const res = await submitSpeaking({
                user_id: user.id,
                topic_id: current.id,
                audio_base64: await toBase64(audio),
                mime_type: audio.type || "audio/webm",
                duration_seconds: seconds,
              });
              return {
                band: res.band_score ?? 0,
                fluency: leadingBand(res.fluency),
                lexical: leadingBand(res.lexical),
                grammar: leadingBand(res.grammar),
                pronunciation: leadingBand(res.pronunciation),
                feedback: res.feedback ?? "",
                transcript: res.transcript ?? undefined,
              };
            }}
          />
        </div>
      </FullScreenExam>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Mic className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> IELTS Speaking
        </h1>
        <p className="text-slate-500 mt-1">
          The official Part 1–3 topics and cue cards, with a timer and a recorder so you can play
          your answer back.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!parts && !error && (
        <div className="grid place-items-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {parts && !books.length && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-neutral-700 p-10 text-center text-slate-500">
          No speaking topics have been loaded yet.
        </div>
      )}

      {books.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-black text-center text-red-700 dark:text-red-400">
            {bookTitle(books[0].book)} ✨
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {books.map((g) => (
              <div
                key={`${g.book}-${g.test}`}
                className="rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-200 dark:border-neutral-800 font-bold">
                  Test {g.test}
                </div>
                <div className="p-3 space-y-1">
                  {g.items.map(({ ref, item }) => (
                    <button
                      key={item.id}
                      onClick={() => { setOpen(g.items.map((x) => x.item)); setActivePart(g.items.findIndex((x) => x.item.id === item.id)); }}
                      className="w-full text-left rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="text-sm font-semibold leading-snug">
                        Part {ref.index}. {ref.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.questions?.length
                          ? `${item.questions.length} questions`
                          : "Cue card"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
