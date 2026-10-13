import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// A status line for while the AI works: a short phrase about what it's doing,
// shimmering, that dissolves into the next every couple of seconds, with the
// seconds so far. Styles live in src/studio.css under .thinking.

/** What the AI is doing while it reads a described problem. */
export const READING = ["Reading your description", "Finding the jobs in it", "Answering what it settles", "Wording the questions for you", "Cogitating"];

/** What the AI is doing while it adapts the questions to a task. */
export const ADAPTING = ["Rewording the questions in your terms", "Suggesting likely answers", "Cogitating"];

/** What the AI is doing while it makes the decision. */
export const DECIDING = [
  "Reading your answers",
  "Consulting the research",
  "Weighing cost against quality",
  "Comparing with the rules",
  "Cogitating",
  "Checking the limits",
  "Considering the alternatives",
  "Deliberating",
];

/** What the AI is doing while it drafts the design for a decision. */
export const DESIGNING = ["Sketching the steps", "Placing the safeguards", "Wiring the handoffs", "Drafting the design", "Cogitating", "Checking it against the rules"];

const EVERY_MS = 2600;

export function Thinking({ words, className = "" }: { words: string[]; className?: string }) {
  const reduce = useReducedMotion();
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);
  const elapsed = now - start;
  const word = words[Math.floor(elapsed / EVERY_MS) % words.length];
  const seconds = Math.floor(elapsed / 1000);

  return (
    <span className={`thinking ${className}`} role="status" aria-live="polite" aria-label={`${word}, ${seconds} seconds`}>
      <span className="thinking-mark" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span className="thinking-words" aria-hidden>
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={word}
            className="thinking-word"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.25 } }}
          >
            {word}…
          </m.span>
        </AnimatePresence>
      </span>
      {seconds > 0 && <span className="thinking-time" aria-hidden>{seconds}s</span>}
    </span>
  );
}
