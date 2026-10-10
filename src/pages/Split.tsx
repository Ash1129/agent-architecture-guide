import { ArrowDown, ArrowLeft, ArrowRight, CaretDown, Trash } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { type Split, removeJob } from "../lib/process";

// After a problem is described on the start page and the AI reads it as
// several jobs: the jobs, in the order work flows through them, and how they
// hand over. The owner can rename or drop jobs, or keep it all as one job.
// Each confirmed job is then asked about separately. Styles live in
// src/studio.css under .split-.

export function SplitReview({
  split,
  onConfirm,
  onKeepOne,
  onBack,
}: {
  split: Split;
  onConfirm: (split: Split) => void;
  onKeepOne: () => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(split);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus({ preventScroll: true }), []);
  const many = draft.jobs.length > 1;
  const handsOver = (i: number) => draft.handoffs.filter((h) => h.from === i);

  return (
    <main id="main" className="survey-main">
      <p className="section-kicker studio-caption">
        <span className="status-dot" aria-hidden />
        Here's what we understood
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="survey-title outline-none">
        {many ? `This is ${["", "one", "two", "three", "four"][draft.jobs.length]} jobs` : "This is one job"}
        <span className="title-period">.</span>
      </h1>
      <p className="survey-help">
        {many
          ? "They work differently, so each gets a system built for how it works, and they hand work to each other as shown. You'll answer a few questions about each, then see the whole system."
          : "With the other jobs removed, this is designed as a single task."}
      </p>

      <ol className="split-list" aria-label="The jobs">
        {draft.jobs.map((job, i) => (
          <li key={i}>
            <div className="split-job">
              <span className="split-number" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <label className="sr-only" htmlFor={`job-${i}`}>
                  Job {i + 1}
                </label>
                <input
                  id={`job-${i}`}
                  className="split-title"
                  value={job.title}
                  maxLength={120}
                  onChange={(e) => setDraft({ ...draft, jobs: draft.jobs.map((j, k) => (k === i ? { ...j, title: e.target.value } : j)) })}
                />
                <details className="split-details">
                  <summary>
                    What we'll design it from
                    <CaretDown size={13} aria-hidden />
                  </summary>
                  <p>{job.description}</p>
                </details>
              </div>
              {many && (
                <button type="button" className="studio-quiet shrink-0" onClick={() => setDraft(removeJob(draft, i))} aria-label={`Remove: ${job.title}`}>
                  <Trash size={15} aria-hidden />
                  Remove
                </button>
              )}
            </div>
            {handsOver(i).map((h) => (
              <p key={`${h.from}-${h.to}`} className="split-handoff">
                <ArrowDown size={15} aria-hidden />
                <span>
                  {h.to === i + 1 ? "Hands over" : `Hands over to job ${h.to + 1}`} through <strong>{h.via}</strong> when {h.when.charAt(0).toLowerCase() + h.when.slice(1).replace(/\.$/, "")}.
                </span>
              </p>
            ))}
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="studio-quiet">
          <ArrowLeft size={16} aria-hidden />
          Back
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {many && (
            <button type="button" onClick={onKeepOne} className="studio-quiet">
              Keep it as one job
            </button>
          )}
          <button
            type="button"
            className="start-build"
            disabled={draft.jobs.some((j) => j.title.trim().length < 3)}
            onClick={() => onConfirm({ ...draft, jobs: draft.jobs.map((j) => ({ ...j, title: j.title.replace(/\s+/g, " ").trim() })) })}
          >
            {many ? `Continue with ${draft.jobs.length} jobs` : "Continue"}
            <ArrowRight size={17} aria-hidden />
          </button>
        </div>
      </div>
    </main>
  );
}
