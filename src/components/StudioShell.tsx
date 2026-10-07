import { CheckCircle, ClockCounterClockwise, Code, GitBranch, Moon, Scales, Sun, TreeStructure } from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";
import { type ResultView, href } from "../lib/router";
import { type ThemePref, loadTheme, saveTheme } from "../lib/storage";

// The result workspace's frame ("blueprint, your solution studio"): a sidebar
// with the three views of the result, and a strip of the key facts above the
// page. Styles live in src/studio.css.

const VIEWS: { id: ResultView; label: string; Icon: typeof CheckCircle }[] = [
  { id: "solution", label: "Solution", Icon: CheckCircle },
  { id: "build", label: "Build", Icon: Code },
  { id: "workflow", label: "Workflow", Icon: GitBranch },
];

export function StudioShell({
  view,
  onView,
  facts,
  historyCount,
  children,
}: {
  view: ResultView;
  onView: (v: ResultView) => void;
  facts: { label: string; value: string }[];
  historyCount: number;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<ThemePref>(loadTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <div className="studio">
      <aside className="studio-sidebar no-print">
        <a href={href({ name: "home" })} className="studio-logo" aria-label="blueprint, home">
          <span className="studio-logo-mark">
            <TreeStructure size={20} weight="regular" aria-hidden />
          </span>
          <span>
            blueprint
            <small>YOUR SOLUTION STUDIO</small>
          </span>
        </a>
        <p className="studio-caption">Your workspace</p>
        <nav aria-label="Result" className="studio-nav">
          {VIEWS.map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-current={view === id ? "page" : undefined} onClick={() => onView(id)}>
              <Icon size={20} weight="light" aria-hidden />
              {label}
              {view === id && <span className="nav-dot" aria-hidden />}
            </button>
          ))}
        </nav>
        <div className="studio-note">
          <span className="studio-caption">The recommendation</span>
          <p>A considered path from request to working system.</p>
          <span className="studio-rule" aria-hidden />
        </div>
        <div className="studio-profile">
          <a href={href({ name: "history" })}>
            <span className="avatar">
              <ClockCounterClockwise size={16} aria-hidden />
            </span>
            <span>
              Your workspace
              <small>
                {historyCount} saved result{historyCount === 1 ? "" : "s"}
              </small>
            </span>
          </a>
          <a href={href({ name: "how" })}>
            <span className="avatar">
              <Scales size={16} aria-hidden />
            </span>
            How it decides
          </a>
          <button
            type="button"
            onClick={() => {
              setTheme(nextTheme);
              saveTheme(nextTheme);
            }}
          >
            <span className="avatar">{theme === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}</span>
            {nextTheme === "dark" ? "Dark theme" : "Light theme"}
          </button>
        </div>
      </aside>
      <div className="studio-main">
        <dl className="fact-strip" aria-label="Key facts">
          {facts.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
        {children}
      </div>
    </div>
  );
}
