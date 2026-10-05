import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { GLOSSARY } from "../lib/catalog";
import { SOURCES } from "../lib/sources";
import { href } from "../lib/router";
import type { Basis, Why } from "../lib/rules";

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-5 py-3 text-[15px] font-medium text-accent-ink transition-[transform,opacity] duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
  secondary:
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-line-strong bg-transparent px-5 py-3 text-[15px] font-medium text-ink transition-[transform,background-color] duration-200 hover:bg-surface-2 active:scale-[0.98]",
  primarySmall:
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-ink transition-[transform,opacity] duration-200 hover:opacity-90 active:scale-[0.98]",
  danger:
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-accent bg-accent-soft px-3.5 py-2 text-[14px] font-medium text-ink transition-[transform,background-color] duration-200 active:scale-[0.98]",
  quiet:
    "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-medium text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-ink",
  small:
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line-strong px-3.5 py-2 text-[14px] font-medium text-ink transition-[transform,background-color] duration-200 hover:bg-surface-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
};

/** An unfamiliar term with a plain-English explanation on demand. */
export function Term({ id, children }: { id: keyof typeof GLOSSARY; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const popId = useId();
  const term = GLOSSARY[id];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen((o) => !o)}
        className="cursor-help rounded-sm underline decoration-line-strong decoration-dotted decoration-[1.5px] underline-offset-4 hover:decoration-accent"
      >
        {children ?? term.term.toLowerCase()}
      </button>
      {open && (
        <span
          id={popId}
          role="note"
          className="shadow-soft absolute left-0 top-full z-30 mt-2 block w-[min(20rem,80vw)] rounded-2xl border border-line bg-surface p-4 text-left text-[14px] font-normal leading-relaxed tracking-normal text-ink"
        >
          <span className="mb-1 block font-semibold">{term.term}</span>
          {term.plain}
        </span>
      )}
    </span>
  );
}

export function BasisLabel({ basis }: { basis: Basis }) {
  if (basis.kind === "design") {
    return (
      <a href={href({ name: "how", section: "design-choices" })} className="text-muted underline-offset-4 hover:underline">
        Design choice for this guide
      </a>
    );
  }
  return (
    <span className="text-muted">
      From:{" "}
      {basis.sources.map((s, i) => (
        <span key={s}>
          {i > 0 && "; "}
          <a href={href({ name: "how", section: "sources" })} className="underline-offset-4 hover:text-ink hover:underline">
            {SOURCES[s].short}
          </a>
        </span>
      ))}
    </span>
  );
}

/** The reasoning behind a recommendation, tied back to the user's answers and the rule's basis. */
export function WhyList({ items, className = "" }: { items: Why[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={`space-y-3 ${className}`}>
      {items.map((w, i) => (
        <li key={`${w.ruleId}-${i}`} className="grid grid-cols-[auto_1fr] gap-x-3">
          <span aria-hidden className="mt-[9px] h-px w-3 bg-line-strong" />
          <div>
            <p className="text-[15px] leading-relaxed text-ink">{w.text}</p>
            <p className="mt-0.5 text-[13px] leading-snug">
              <span className="font-mono text-[12px] text-muted">Rule {w.ruleId}</span>
              <span className="text-muted"> / </span>
              <BasisLabel basis={w.basis} />
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
