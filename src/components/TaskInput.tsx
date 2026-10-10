import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useId, useState, type FormEvent } from "react";
import { TASK_EXAMPLES } from "../lib/questions";

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
        <div className="problem-field survey-field">
          <MagnifyingGlass size={20} aria-hidden />
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
          />
        </div>
        <p id={helpId} className="text-[14px] text-muted">
          One sentence is plenty. Describe the work, not the technology.
        </p>
      </div>
      <div>
        <p className="studio-caption !mb-3">Or start from an example</p>
        <ul className="flex flex-wrap gap-2">
          {TASK_EXAMPLES.map((ex) => (
            <li key={ex}>
              <button
                type="button"
                onClick={() => setValue(ex)}
                aria-pressed={value === ex}
                className="survey-chip"
              >
                {ex}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button type="submit" disabled={!trimmed} className="start-build">
        {submitLabel}
        <ArrowRight size={17} aria-hidden />
      </button>
    </form>
  );
}
