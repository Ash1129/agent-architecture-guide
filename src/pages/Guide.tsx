import { ArrowLeft, ArrowRight, CaretDown, Check, CircleNotch, Sparkle } from "@phosphor-icons/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { PlanState } from "../App";
import { TaskInput } from "../components/TaskInput";
import { AI_ENABLED } from "../lib/features";
import { type Detail, type DetailQuestion, adaptQuestion } from "../lib/interview";
import {
  type Answers,
  type Question,
  type QuestionId,
  QUESTION_BY_ID,
  activeQuestions,
  isComplete,
} from "../lib/questions";

type Props = {
  qid: QuestionId;
  answers: Answers;
  editing: boolean;
  direction: 1 | -1;
  /** The AI-adapted questions for this task, when AI is on. */
  plan?: PlanState;
  onUseStandard: () => void;
  onAnswer: (next: Answers, from: QuestionId) => void;
  onBack: (from: QuestionId) => void;
  onCancelEdit: () => void;
};

export function Guide({ qid, answers, editing, direction, plan, onUseStandard, onAnswer, onBack, onCancelEdit }: Props) {
  const reduce = useReducedMotion();
  const ready = plan?.status === "ready" ? plan.response : undefined;
  const q = adaptQuestion(QUESTION_BY_ID[qid], ready?.plan);
  // AI_ENABLED is fixed at build time, so the published build drops these screens entirely.
  const adapting = AI_ENABLED && plan?.status === "loading" && qid !== "task";
  // Until the second answer says whether AI is involved, assume the longer
  // path, so the count never jumps up partway through.
  const active = activeQuestions(answers.shape ? answers : { ...answers, shape: "judgement" });
  const index = Math.max(0, active.findIndex((x) => x.id === qid));
  const total = active.length;

  return (
    <main id="main" className="survey-main">
      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="section-kicker studio-caption !mb-0" aria-live="polite">
            <span className="status-dot" aria-hidden />
            Question {index + 1} of {total}
          </p>
          {editing ? (
            <button type="button" onClick={onCancelEdit} className="studio-quiet">
              Back to your result
            </button>
          ) : (
            <p className="text-[13px] text-muted">About {Math.max(1, Math.ceil(((total - index) * 12) / 60))} min left</p>
          )}
        </div>
        <div
          className="survey-bar"
          role="progressbar"
          aria-label="Progress through the guide"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          {active.map((x, i) => (
            <span
              key={x.id}
              className={i <= index ? "is-done" : undefined}
            />
          ))}
        </div>
      </div>

      {AI_ENABLED && qid !== "task" && <PlanNote plan={plan} />}
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <m.div
          key={adapting ? "adapting" : `${qid}:${ready ? "ai" : "std"}`}
          custom={direction}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 * direction }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -16 * direction }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {adapting ? (
            <Adapting task={plan!.task} onUseStandard={onUseStandard} />
          ) : (
            <QuestionView
              q={q}
              answers={answers}
              editing={editing}
              onSubmit={(next) => onAnswer(next, qid)}
              onBack={() => onBack(qid)}
              isFirst={index === 0}
            />
          )}
        </m.div>
      </AnimatePresence>
    </main>
  );
}

function Adapting({ task, onUseStandard }: { task: string; onUseStandard: () => void }) {
  const reduce = useReducedMotion();
  return (
    <div role="status" aria-live="polite">
      <p className="flex items-center gap-2 text-[15px] font-medium text-accent">
        <CircleNotch size={18} aria-hidden className={reduce ? "" : "animate-spin"} />
        Adapting the questions to your task
      </p>
      <h1 className="survey-title mt-4">{task}</h1>
      <p className="survey-help">
        The AI is rewording the questions in your terms and suggesting likely answers. You can change every one of them.
      </p>
      <button type="button" onClick={onUseStandard} className="studio-quiet !mt-8">
        Use the standard questions instead
      </button>
    </div>
  );
}

/** One quiet line saying where the questions came from. */
function PlanNote({ plan }: { plan?: PlanState }) {
  if (!plan || plan.status === "loading") return null;
  const r = plan.response;
  const text =
    plan.status === "standard"
      ? plan.note
        ? `Standard questions. ${plan.note}`
        : null
      : r?.source === "similar"
        ? `Adapted to your task, reusing the questions made for a very similar one ("${r.similarTo}").`
        : r?.source === "cache"
          ? "Adapted to your task (saved from an earlier run)."
          : "Adapted to your task by AI. Suggested answers are pre-selected; change any of them.";
  if (!text) return null;
  return (
    <p className="-mt-6 mb-8 flex items-start gap-1.5 text-[13px] leading-snug text-muted">
      <Sparkle size={14} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-accent" />
      {text}
    </p>
  );
}

function WhyWeAsk({ text }: { text: string }) {
  return (
    <details className="survey-why group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-medium text-ink [&::-webkit-details-marker]:hidden">
        Why we ask
        <CaretDown size={16} aria-hidden className="text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-muted">{text}</p>
    </details>
  );
}

function QuestionView({
  q,
  answers,
  editing,
  isFirst,
  onSubmit,
  onBack,
}: {
  q: Question & { suggested?: string | string[]; reason?: string };
  answers: Answers;
  editing: boolean;
  isFirst: boolean;
  onSubmit: (next: Answers) => void;
  onBack: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pointerPick = useRef(false);
  // An answer already given wins; otherwise the AI's suggestion starts selected.
  const current = answers[q.id] ?? q.suggested;
  const [single, setSingleState] = useState<string | undefined>(typeof current === "string" ? current : undefined);
  const [multi, setMultiState] = useState<string[]>(Array.isArray(current) ? current : []);
  // Mirrors of the selection that update synchronously, so a fast "pick then
  // Enter" never submits a stale value before React re-renders.
  const singleRef = useRef(single);
  const multiRef = useRef(multi);

  const setSingle = (v: string) => {
    singleRef.current = v;
    setSingleState(v);
  };
  const toggleMulti = (v: string) => {
    const prev = multiRef.current;
    const next = prev.includes(v)
      ? prev.filter((x) => x !== v)
      : v === q.exclusive
        ? [v]
        : [...prev.filter((x) => x !== q.exclusive), v];
    multiRef.current = next;
    setMultiState(next);
  };

  // Once answered, this view is on its way out (it may still be animating
  // away), so it must ignore any further input.
  const done = useRef(false);
  const nextAnswers = (v: unknown): Answers => ({ ...answers, [q.id]: v });
  const finish = (v: unknown) => {
    if (done.current) return;
    done.current = true;
    onSubmit(nextAnswers(v));
  };
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const v = q.kind === "multi" ? multiRef.current : singleRef.current;
    const ok = Array.isArray(v) ? v.length > 0 : !!v;
    if (ok) finish(v);
  };
  const submitRef = useRef(submit);
  submitRef.current = submit;
  const toggleRef = useRef({ setSingle, toggleMulti });
  toggleRef.current = { setSingle, toggleMulti };

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [q.id]);

  // Number keys pick the matching option, as shown on each card, and Enter
  // continues from anywhere on the page except buttons and links.
  useEffect(() => {
    if (q.kind === "text") return;
    const onKey = (e: KeyboardEvent) => {
      if (done.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" && (target as HTMLInputElement).type === "text") return;
      if (e.key === "Enter") {
        if (target.closest("button, a, summary, textarea")) return;
        e.preventDefault();
        submitRef.current();
        return;
      }
      const n = Number(e.key);
      const option = Number.isInteger(n) && n >= 1 ? q.options![n - 1] : undefined;
      if (!option) return;
      e.preventDefault();
      if (q.kind === "multi") toggleRef.current.toggleMulti(option.value);
      else toggleRef.current.setSingle(option.value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q]);

  const value = q.kind === "multi" ? multi : single;
  const answered = q.kind === "multi" ? multi.length > 0 : !!single;
  const finishing = editing && answered && isComplete(nextAnswers(value));

  const header = (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="survey-title outline-none">
        {q.title}
      </h1>
      {q.help && q.kind !== "text" && <p className="survey-help">{q.help}</p>}
      {q.suggested && q.reason && answers[q.id] === undefined && (
        <p className="mt-3 flex max-w-[60ch] items-start gap-1.5 text-[14.5px] leading-relaxed text-accent">
          <Sparkle size={15} weight="fill" aria-hidden className="mt-1 shrink-0" />
          <span>
            <span className="font-medium">Suggested:</span> {q.reason}
          </span>
        </p>
      )}
    </>
  );

  if (q.kind === "text") {
    return (
      <div>
        {header}
        <div className="mt-8">
          <TaskInput
            initial={typeof current === "string" ? current : ""}
            submitLabel={editing && isComplete(answers) ? "Save and see result" : "Continue"}
            onSubmit={(task) => onSubmit({ ...answers, task })}
          />
        </div>
        <button type="button" onClick={onBack} className="studio-quiet !mt-7">
          <ArrowLeft size={16} aria-hidden />
          {editing ? "Back to your result" : "Back to start"}
        </button>
        <WhyWeAsk text={q.why} />
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <fieldset>
        <legend className="mb-0 w-full">{header}</legend>
        <div className="mt-8 grid gap-3">
          {q.options!.map((o, i) => {
            const checked = q.kind === "multi" ? multi.includes(o.value) : single === o.value;
            return (
              <label
                key={o.value}
                onPointerDown={() => (pointerPick.current = true)}
                data-checked={checked || undefined}
                className="survey-option group"
              >
                <input
                  type={q.kind === "multi" ? "checkbox" : "radio"}
                  name={q.id}
                  value={o.value}
                  checked={checked}
                  className="sr-only"
                  autoFocus={false}
                  onChange={() => {
                    if (done.current) return;
                    if (q.kind === "multi") {
                      toggleMulti(o.value);
                      return;
                    }
                    setSingle(o.value);
                    // Mouse and touch picks move on automatically; keyboard users
                    // arrow through options freely and press Enter to continue.
                    if (pointerPick.current) {
                      window.setTimeout(() => finish(singleRef.current), 260);
                    }
                    pointerPick.current = false;
                  }}
                />
                <span
                  aria-hidden
                  className={`survey-mark ${q.kind === "multi" ? "rounded-[5px]" : "rounded-full"}`}
                >
                  {checked && (q.kind === "multi" ? <Check size={13} weight="bold" /> : <span className="h-2 w-2 rounded-full bg-accent-ink" />)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[16px] font-medium leading-snug text-ink">
                    {o.label}
                    {answers[q.id] === undefined && (Array.isArray(q.suggested) ? q.suggested.includes(o.value) : q.suggested === o.value) && (
                      <span className="survey-suggested">Suggested</span>
                    )}
                  </span>
                  {o.hint && <span className="mt-1 block text-[14.5px] leading-relaxed text-muted">{o.hint}</span>}
                </span>
                <span aria-hidden className="survey-key">
                  {i + 1}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="studio-quiet">
          <ArrowLeft size={16} aria-hidden />
          {isFirst ? "Back to start" : "Back"}
        </button>
        <button type="submit" disabled={!answered} className="start-build">
          {finishing ? "Save and see result" : "Continue"}
          <ArrowRight size={17} aria-hidden />
        </button>
      </div>
      <p className="mt-3 hidden text-right text-[13px] text-muted sm:block">
        {q.kind === "multi" ? "Choose all that apply, then continue." : "Tip: press a number to choose, then Enter."}
      </p>
      <WhyWeAsk text={q.why} />
    </form>
  );
}

/** The AI's task-specific questions. Optional: anything left blank is simply not sent. */
export function Details({
  questions,
  answers,
  ready,
  onSubmit,
  onBack,
}: {
  questions: DetailQuestion[];
  answers: Answers;
  /** False while the questions are still being made. */
  ready: boolean;
  onSubmit: (details: Detail[]) => void;
  onBack: () => void;
}) {
  const previous = new Map((answers.details ?? []).map((d) => [d.q, d.a]));
  const [values, setValues] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(questions.map((d) => [d.id, previous.get(d.title)?.split(", ").filter(Boolean) ?? []])),
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.filter((d) => d.kind === "text").map((d) => [d.id, previous.get(d.title) ?? ""])),
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus({ preventScroll: true }), []);

  // Nothing to ask (or AI is off): carry on to the result.
  useEffect(() => {
    if (ready && !questions.length) onSubmit(answers.details ?? []);
  }, [ready, questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (d: DetailQuestion, option: string) =>
    setValues((v) => {
      const cur = v[d.id] ?? [];
      const next = d.kind === "multi" ? (cur.includes(option) ? cur.filter((x) => x !== option) : [...cur, option]) : cur[0] === option ? [] : [option];
      return { ...v, [d.id]: next };
    });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const out: Detail[] = [];
    for (const d of questions) {
      const a = d.kind === "text" ? (notes[d.id] ?? "").trim() : (values[d.id] ?? []).join(", ");
      if (a) out.push({ q: d.title, a });
    }
    onSubmit(out);
  };

  if (!questions.length) return null;
  return (
    <main id="main" className="survey-main">
      <form onSubmit={submit}>
        <p className="section-kicker studio-caption">
          <span className="status-dot" aria-hidden />
          Last step, optional
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="survey-title outline-none">
          A few details about your task
        </h1>
        <p className="survey-help">
          The AI asked these because the answers change how this particular system is built. Skip any you're unsure of.
        </p>
        <div className="mt-8 grid gap-6">
          {questions.map((d) => (
            <fieldset key={d.id} className="survey-card">
              <legend className="sr-only">{d.title}</legend>
              <p aria-hidden className="text-[16px] font-medium leading-snug text-ink">
                {d.title}
              </p>
              {d.help && <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{d.help}</p>}
              {d.kind === "text" ? (
                <input
                  type="text"
                  aria-label={d.title}
                  value={notes[d.id] ?? ""}
                  maxLength={300}
                  onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                  className="survey-input mt-3"
                  placeholder="Type a short answer"
                />
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.options!.map((o) => {
                    const on = (values[d.id] ?? []).includes(o);
                    return (
                      <button
                        key={o}
                        type="button"
                        aria-pressed={on}
                        onClick={() => pick(d, o)}
                        className="survey-chip"
                      >
                        {on && <Check size={13} weight="bold" aria-hidden className="mr-1 inline align-[-1px] text-accent" />}
                        {o}
                      </button>
                    );
                  })}
                </div>
              )}
            </fieldset>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="studio-quiet">
            <ArrowLeft size={16} aria-hidden />
            Back
          </button>
          <button type="submit" className="start-build">
            See your result
            <ArrowRight size={17} aria-hidden />
          </button>
        </div>
      </form>
    </main>
  );
}
