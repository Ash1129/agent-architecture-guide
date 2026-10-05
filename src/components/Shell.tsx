import { ClockCounterClockwise, Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { LAST_REVIEWED } from "../lib/catalog";
import { AI_TAILORING } from "../lib/features";
import { href, type Route } from "../lib/router";
import { loadTheme, saveTheme, type ThemePref } from "../lib/storage";
import { btn } from "./ui";

function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePref>(loadTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => {
        setTheme(next);
        saveTheme(next);
      }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      aria-label={`Switch to ${next} theme`}
    >
      {theme === "dark" ? <Sun size={19} weight="regular" /> : <Moon size={19} weight="regular" />}
    </button>
  );
}

export function Wordmark() {
  return (
    <a href={href({ name: "home" })} className="group inline-flex items-center gap-2.5 rounded-full py-1 pr-2">
      <svg aria-hidden viewBox="0 0 32 32" className="h-7 w-7 shrink-0">
        <rect width="32" height="32" rx="8" className="fill-accent" />
        <path d="M9 16h6l4-6M15 16l4 6" fill="none" className="stroke-accent-ink" strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="16" r="3" className="fill-accent-ink" />
        <circle cx="21" cy="9" r="3" className="fill-accent-ink" />
        <circle cx="21" cy="23" r="3" className="fill-accent-ink" />
      </svg>
      <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight text-ink">Agent Architecture Guide</span>
    </a>
  );
}

export function Nav({ route, cta, historyCount = 0 }: { route: Route; cta: { label: string; to: Route }; historyCount?: number }) {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark />
        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href={href({ name: "how" })}
            aria-current={route.name === "how" ? "page" : undefined}
            className={`${btn.quiet} max-sm:hidden aria-[current=page]:text-ink`}
          >
            How it decides
          </a>
          <a
            href={href({ name: "history" })}
            aria-current={route.name === "history" ? "page" : undefined}
            aria-label={`History, ${historyCount} saved result${historyCount === 1 ? "" : "s"}`}
            className={`${btn.quiet} aria-[current=page]:text-ink`}
          >
            <ClockCounterClockwise size={17} aria-hidden />
            <span className="max-sm:hidden">History</span>
            {historyCount > 0 && (
              <span className="rounded-full bg-surface-2 px-1.5 py-px font-mono text-[11.5px] text-ink">{historyCount}</span>
            )}
          </a>
          <ThemeToggle />
          {route.name !== "guide" && route.name !== "result" && (
            <a href={href(cta.to)} className={`${btn.primarySmall} ml-1 max-md:hidden`}>
              {cta.label}
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="no-print border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div className="max-w-[52ch] space-y-3">
          <Wordmark />
          <p className="text-[14px] leading-relaxed text-muted">
            Built for AI Assignment 4, ENMGT 5405 at Cornell University. Recommendations come from fixed, published rules
            based on the assignment's research. Product and model names are examples, last reviewed {LAST_REVIEWED}.
          </p>
        </div>
        <ul className="grid content-start gap-2 text-[14px] sm:grid-cols-2 md:grid-cols-1">
          <li>
            <a className="text-muted underline-offset-4 hover:text-ink hover:underline" href={href({ name: "how" })}>
              How it decides
            </a>
          </li>
          <li>
            <a className="text-muted underline-offset-4 hover:text-ink hover:underline" href={href({ name: "how", section: "sources" })}>
              Sources
            </a>
          </li>
          <li>
            <a className="text-muted underline-offset-4 hover:text-ink hover:underline" href={href({ name: "how", section: "design-choices" })}>
              Design choices
            </a>
          </li>
          <li className="text-muted">
            No account, no tracking. Your answers stay in your browser{AI_TAILORING ? " unless you choose Tailor with AI" : ""}.
          </li>
        </ul>
      </div>
    </footer>
  );
}
