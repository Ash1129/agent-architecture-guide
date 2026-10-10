import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import { m, useReducedMotion } from "motion/react";
import { useState, type FormEvent } from "react";
import workspaceImage from "../assets/workspace.jpg";
import { BrandMark, BrandWord } from "../components/Brand";
import { AI_ENABLED } from "../lib/features";
import { MAX_TASK_TITLE } from "../lib/interview";
import { MAX_PROCESS_DESCRIPTION } from "../lib/process";

// The public starting point ("blueprint studio"). Two ways in: describe the
// problem in your own words and press Build (the AI answers what the
// description settles and asks only the rest), or take the short survey when
// you're not sure where to start. Styles live in src/studio.css under .start-page.

/** With AI, anything from a sentence to a whole process (split into jobs when it holds several); without, the text is the survey's first answer, a short title. */
const MAX_LENGTH = AI_ENABLED ? MAX_PROCESS_DESCRIPTION : MAX_TASK_TITLE;

export function Landing({
  introPlaying = false,
  onTask,
  onSurvey,
  onExample,
}: {
  /** The first-open intro is on screen; the heading stays hidden until the intro's word lands on it. */
  introPlaying?: boolean;
  /** Start from the person's own description of the problem. */
  onTask: (task: string) => void;
  /** Start the survey from its first question. */
  onSurvey: () => void;
  /** Open a finished example result. */
  onExample: () => void;
}) {
  const reduce = useReducedMotion();
  const [problem, setProblem] = useState("");
  const ready = problem.trim().length > 0;
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (ready) onTask(problem.replace(/\s+/g, " ").trim());
  };
  // Under the first-open intro the page is already in place, so the intro's word can land exactly on the heading.
  const [underIntro] = useState(introPlaying);
  const rise = (delay: number) =>
    reduce || underIntro ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <div className="studio start-page">
      <header className="start-header">
        <a href="#/" className="start-brand" aria-label="Blueprint, home">
          <BrandMark className="h-[26px] w-auto" />
        </a>
        <button type="button" className="studio-quiet" onClick={onExample}>
          Explore an example
          <ArrowRight size={16} aria-hidden />
        </button>
      </header>

      <main id="main" className="start-main">
        {/* Hidden under the intro until its word lands here; it's the same drawing, so the hand-over doesn't show. */}
        <div style={{ opacity: introPlaying ? 0 : 1 }}>
          <m.h1 {...rise(0.05)} aria-label="Blueprint.">
            <BrandWord />
          </m.h1>
        </div>
        <m.p {...rise(0.1)} className="start-subtitle">
          Tell us what’s holding your business back.
          <br />
          Let’s find a better way forward.
        </m.p>

        <m.form {...rise(0.15)} className="problem-form" onSubmit={submit}>
          <div className="problem-field">
            <MagnifyingGlass size={20} aria-hidden />
            <textarea
              aria-label="Your business problem"
              placeholder="What business problem would you like to solve?"
              rows={1}
              maxLength={MAX_LENGTH}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              onKeyDown={(e) => {
                // Enter builds; Shift+Enter adds a line.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          </div>
          <div className="start-actions">
            <button type="submit" className="start-build" disabled={!ready}>
              Build
              <ArrowRight size={17} aria-hidden />
            </button>
          </div>
        </m.form>

        <m.p {...rise(0.2)} className="survey-hint">
          Not sure where to start?{" "}
          <button type="button" className="studio-quiet" onClick={onSurvey}>
            Define your problem with a short survey
            <ArrowRight size={16} aria-hidden />
          </button>
        </m.p>
      </main>

      <footer className="start-footer">
        <div className="start-footer-note">
          <img src={workspaceImage} alt="" width={36} height={36} />
          <span>
            Start with the problem.
            <br />
            <strong>Not the technology.</strong>
          </span>
        </div>
        <span>Thoughtfully designed. Built around you.</span>
      </footer>
    </div>
  );
}
