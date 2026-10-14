import { ArrowRight, ClockCounterClockwise, Moon, Scales, Sun } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FocusEvent } from "react";
import { LAST_REVIEWED } from "../lib/catalog";
import { AI_ENABLED } from "../lib/features";
import { href, type Route } from "../lib/router";
import { loadTheme, saveTheme, type ThemePref } from "../lib/storage";
import { BrandMark } from "./Brand";
import { btn } from "./ui";

function ThemeToggle({ compact = false }: { compact?: boolean }) {
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
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-[width,height,color,background-color] duration-300 hover:bg-surface-2 hover:text-ink ${compact ? "mouse:h-8 mouse:w-8" : ""}`}
      aria-label={`Switch to ${next} theme`}
    >
      {theme === "dark" ? <Sun size={compact ? 17 : 19} weight="regular" /> : <Moon size={compact ? 17 : 19} weight="regular" />}
    </button>
  );
}

/** Labels in the top bar fold away when it is collapsed, leaving only the icons. */
function fold(collapsed: boolean, side: "left" | "right" = "left") {
  const gap = side === "left" ? `ml-2 ${collapsed ? "mouse:ml-0" : ""}` : `mr-2 ${collapsed ? "mouse:mr-0" : ""}`;
  return `overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none max-w-56 opacity-100 ${gap} ${
    collapsed ? "mouse:max-w-0 mouse:opacity-0" : ""
  }`;
}

export function Wordmark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <a href={href({ name: "home" })} aria-label="Agent Architecture Guide, home" className="group inline-flex items-center rounded-full py-1 pr-2">
      <BrandMark
        className={`w-auto shrink-0 transition-[height] duration-300 motion-reduce:transition-none ${collapsed ? "h-7 mouse:h-6" : "h-7"}`}
      />
      <span className={`${fold(collapsed)} text-[15px] font-semibold tracking-tight text-ink`}>Agent Architecture Guide</span>
    </a>
  );
}

/**
 * Like the macOS Spaces bar: with a mouse or trackpad the top bar rests as a
 * slim, translucent strip of icons and expands with labels while the pointer
 * is over it or keyboard focus is inside it. On touch screens it is an
 * ordinary full bar. The result's sidebar folds the same way.
 */
export function useMenuBar() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return {
    collapsed: !hovered && !focused,
    handlers: {
      onMouseEnter: () => {
        window.clearTimeout(timer.current);
        setHovered(true);
      },
      onMouseLeave: () => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setHovered(false), 260);
      },
      onFocus: () => setFocused(true),
      onBlur: (e: FocusEvent) => e.currentTarget.contains(e.relatedTarget as Node | null) || setFocused(false),
    },
  };
}

export function Nav({ route, cta, historyCount = 0 }: { route: Route; cta: { label: string; to: Route }; historyCount?: number }) {
  const { collapsed, handlers } = useMenuBar();
  const item = `${btn.quiet} gap-0 aria-[current=page]:text-ink ${collapsed ? "mouse:px-2.5 mouse:py-1.5" : ""}`;
  return (
    <>
      {/* Keeps page content clear of the resting strip, which floats above it. */}
      <div aria-hidden className="no-print hidden h-11 mouse:block" />
      <header
        {...handlers}
        className={`no-print sticky top-0 z-40 border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none mouse:fixed mouse:inset-x-0 ${
          collapsed
            ? "border-line/70 bg-bg/85 mouse:border-line/40 mouse:bg-bg/45"
            : "border-line/70 bg-bg/85 mouse:shadow-[0_10px_30px_-14px_hsl(var(--shadow)/0.3)]"
        }`}
      >
        <nav
          aria-label="Main"
          className={`mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 transition-[height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:px-6 ${
            collapsed ? "mouse:h-11" : ""
          }`}
        >
          <Wordmark collapsed={collapsed} />
          <div className="flex items-center gap-1 sm:gap-1.5">
            <a href={href({ name: "how" })} aria-current={route.name === "how" ? "page" : undefined} className={`${item} max-sm:hidden`} title={collapsed ? "How it decides" : undefined}>
              <Scales size={17} aria-hidden />
              <span className={fold(collapsed)}>How it decides</span>
            </a>
            <a
              href={href({ name: "history" })}
              aria-current={route.name === "history" ? "page" : undefined}
              aria-label={`History, ${historyCount} saved result${historyCount === 1 ? "" : "s"}`}
              title={collapsed ? "History" : undefined}
              className={item}
            >
              <ClockCounterClockwise size={17} aria-hidden />
              <span className={`${fold(collapsed)} max-sm:hidden`}>History</span>
              {historyCount > 0 && <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 py-px font-mono text-[11.5px] text-ink">{historyCount}</span>}
            </a>
            <ThemeToggle compact={collapsed} />
            {route.name !== "guide" && route.name !== "result" && (
              <a
                href={href(cta.to)}
                aria-label={cta.label}
                title={collapsed ? cta.label : undefined}
                className={`${btn.primarySmall} ml-1 gap-0 transition-[padding] duration-300 max-md:hidden ${collapsed ? "mouse:px-2 mouse:py-2" : ""}`}
              >
                <span className={fold(collapsed, "right")}>{cta.label}</span>
                <ArrowRight size={15} weight="bold" aria-hidden />
              </a>
            )}
          </div>
        </nav>
      </header>
    </>
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
            No account, no tracking. Your answers stay in your browser{AI_ENABLED ? " unless you choose Tailor with AI" : ""}.
          </li>
        </ul>
      </div>
    </footer>
  );
}
