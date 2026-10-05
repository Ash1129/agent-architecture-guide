import { ArrowRight } from "@phosphor-icons/react";
import { useId, useState, type FormEvent } from "react";
import { TASK_EXAMPLES } from "../lib/questions";
import { btn } from "./ui";

/** The first question of the guide. Used in the guide and, live, in the landing hero. */
export function TaskInput({
  initial = "",
  onSubmit,
  submitLabel = "Continue",
  labelId,
  autoFocus = false,
}: {
  initial?: string;
  onSubmit: (task: string) => void;
  submitLabel?: string;
  labelId?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const inputId = useId();
  const helpId = useId();
  const trimmed = value.trim();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor={inputId} id={labelId} className="sr-only">
          The business task you want to improve
        </label>
        <input
          id={inputId}
          type="text"
          value={value}
          maxLength={200}
          autoFocus={autoFocus}
          autoComplete="off"
          aria-describedby={helpId}
          onChange={(e) => setValue(e.target.value)}
          placeholder="For example: answer routine customer emails"
          className="block w-full rounded-xl border border-line-strong bg-surface px-4 py-3.5 text-[17px] text-ink placeholder:text-muted focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <p id={helpId} className="text-[14px] text-muted">
          One sentence is plenty. Describe the work, not the technology.
        </p>
      </div>
      <div>
        <p className="mb-2.5 text-[14px] font-medium text-ink">Or start from an example</p>
        <ul className="flex flex-wrap gap-2">
          {TASK_EXAMPLES.map((ex) => (
            <li key={ex}>
              <button
                type="button"
                onClick={() => setValue(ex)}
                aria-pressed={value === ex}
                className="rounded-full border border-line bg-surface px-3.5 py-2 text-[14px] text-ink transition-colors hover:border-line-strong aria-pressed:border-accent aria-pressed:bg-accent-soft"
              >
                {ex}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button type="submit" disabled={!trimmed} className={btn.primary}>
        {submitLabel}
        <ArrowRight size={17} weight="bold" aria-hidden />
      </button>
    </form>
  );
}
