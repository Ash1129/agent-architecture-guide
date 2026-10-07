import { m, AnimatePresence, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { BrandMark } from "./Brand";

// Shown the moment the survey is finished, over the result page. The result
// is already open underneath, so the AI design, the kit's text and any tool
// tailoring start at once; these few lines give them a head start while they
// are read. Each one dissolves in and out in turn, then the page shows through.
// Styles live in src/studio.css under .build-overlay.

// One line each: the longest is about 22 em in Instrument Serif, and .build-overlay-line sizes the type to fit.
const MESSAGES = [
  "Piecing together everything you've told us.",
  "Building your tools now. The Build tab opens once they're ready.",
  "Meanwhile, explore your system's architecture and workflow.",
];
/** How long each line stays fully on screen, in seconds. */
const HOLD = 2.1;
const IN = 0.7;
const OUT = 0.55;

export function BuildOverlay({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  // Each line moves on once it has been on screen long enough to read; after the last, the overlay fades away.
  useEffect(() => {
    if (leaving) return;
    const t = window.setTimeout(
      () => (index < MESSAGES.length - 1 ? setIndex(index + 1) : setLeaving(true)),
      (IN + HOLD) * 1000 + (index > 0 ? OUT * 1000 : 0),
    );
    return () => window.clearTimeout(t);
  }, [index, leaving]);

  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(onDone, 650);
    return () => window.clearTimeout(t);
  }, [leaving, onDone]);

  // Esc skips to the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLeaving(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const blur = reduce ? "blur(0px)" : "blur(8px)";
  return (
    <div className={`studio build-overlay${leaving ? " is-leaving" : ""}`} role="status" aria-live="polite">
      <BrandMark className="build-overlay-mark" />
      <div className="build-overlay-stage">
        <AnimatePresence mode="wait">
          {!leaving && (
            <m.p
              key={index}
              className="build-overlay-line"
              initial={{ opacity: 0, filter: blur, y: reduce ? 0 : 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: IN, ease: [0.16, 1, 0.3, 1] } }}
              exit={{ opacity: 0, filter: blur, y: reduce ? 0 : -6, transition: { duration: OUT, ease: [0.4, 0, 1, 1] } }}
            >
              {MESSAGES[index]}
            </m.p>
          )}
        </AnimatePresence>
        <span className="build-overlay-dots" aria-hidden>
          {MESSAGES.map((_, i) => (
            <i key={i} className={i <= index ? "is-on" : undefined} />
          ))}
        </span>
      </div>
      <button type="button" className="studio-quiet build-overlay-skip" onClick={() => setLeaving(true)}>
        Skip
      </button>
    </div>
  );
}
