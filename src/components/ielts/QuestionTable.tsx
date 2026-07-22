"use client";

/**
 * A table exactly as the paper prints it, with the answer box in the cell that holds
 * the gap.
 *
 * The parser marks a gap `[[7]]` inside the cell text (see scripts/ielts_tables.py),
 * because the number and its dot leader are printed inside the cell and nowhere else —
 * rendering the questions as a list underneath would lose which column each belongs to,
 * which is most of what a table question is asking.
 */
export default function QuestionTable({
  grid,
  answers,
  onAnswer,
}: {
  /** Rows of cells; the first row is the header. */
  grid: string[][];
  answers: Record<number, string>;
  onAnswer: (number: number, value: string) => void;
}) {
  if (!grid.length) return null;
  const [header, ...body] = grid;

  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {header.map((cell, i) => (
              <th
                key={i}
                className="border border-slate-300 dark:border-neutral-700 px-3 py-2 font-bold text-center align-top"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td
                  key={c}
                  className="border border-slate-300 dark:border-neutral-700 px-3 py-2 align-top leading-7"
                >
                  <Cell text={cell} answers={answers} onAnswer={onAnswer} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Splits on `[[n]]` and drops an input where each marker was. */
function Cell({
  text,
  answers,
  onAnswer,
}: {
  text: string;
  answers: Record<number, string>;
  onAnswer: (number: number, value: string) => void;
}) {
  const parts = text.split(/(\[\[\d{1,2}\]\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = /^\[\[(\d{1,2})\]\]$/.exec(part);
        if (!m) return <span key={i}>{part}</span>;
        const n = Number(m[1]);
        return (
          <span key={i} className="inline-flex items-baseline gap-1 mx-0.5">
            <span className="text-[11px] font-bold text-slate-500 tabular-nums">{n}</span>
            <input
              value={answers[n] ?? ""}
              onChange={(e) => onAnswer(n, e.target.value)}
              aria-label={`Question ${n}`}
              className="w-28 border border-slate-300 dark:border-neutral-600 rounded px-1.5 py-0.5 bg-transparent focus:border-emerald-500 outline-none"
            />
          </span>
        );
      })}
    </>
  );
}
