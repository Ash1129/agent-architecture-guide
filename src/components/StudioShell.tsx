import { CheckCircle, CircleNotch, ClockCounterClockwise, Code, GitBranch, Moon, Scales, Sun, TreeStructure } from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";
import { type ResultView, href } from "../lib/router";
import { BrandMark } from "./Brand";
import { useMenuBar } from "./Shell";
import { type ThemePref, loadTheme, saveTheme } from "../lib/storage";

// The result workspace's frame ("blueprint, your solution studio"): a sidebar
// with the three views of the result. The key facts sit in the Solution view's
// byline, not here. With a mouse or trackpad the sidebar rests as a slim rail of icons and
// opens over the page while the pointer is over it or focus is inside it,
// like the top bar. Styles live in src/studio.css.

const VIEWS: { id: ResultView; label: string; Icon: typeof CheckCircle }[] = [
  { id: "solution", label: "Solution", Icon: CheckCircle },
  // Workflow before Build: it can be read while the tools are still being built.
  { id: "workflow", label: "Workflow", Icon: GitBranch },
  { id: "build", label: "Build", Icon: Code },
];

/** A process's place in the sidebar: its map, then each job's result. */
export type SystemNav = {
  title: string;
  mapHref: string;
  /** The map is showing (rather than one job's result). */
  onMap: boolean;
  jobs: { label: string; href: string; current: boolean }[];
};

export function StudioShell({
  view,
  onView,
  historyCount,
  building = false,
  system,
  children,
}: {
  /** The result's view; none on a process's map. */
  view?: ResultView;
  onView?: (v: ResultView) => void;
  historyCount: number;
  /** When this result is one job of a process, or the process's map is showing. */
  system?: SystemNav;
  /** The tools are still being built in the background: the Build view opens once they're ready. */
  building?: boolean;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<ThemePref>(loadTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const nextTheme = theme === "dark" ? "light" : "dark";
  const { collapsed, handlers } = useMenuBar();
  // A name on hover while the labels are folded away.
  const tip = (label: string) => (collapsed ? label : undefined);

  return (
    <div className="studio">
      <aside className="studio-sidebar no-print" data-collapsed={collapsed || undefined} {...handlers}>
        <div className="studio-rail">
          <a href={href({ name: "home" })} className="studio-logo" aria-label="blueprint, home">
            <BrandMark className="studio-logo-mark" />
            <span className="rail-label studio-logo-word">
              <span>lueprint</span>
              <small>YOUR SOLUTION STUDIO</small>
            </span>
          </a>
          {system && (
            <>
              <p className="studio-caption rail-label">Your system</p>
              <nav aria-label="Your system" className="studio-nav studio-nav-system">
                <a href={system.mapHref} aria-current={system.onMap ? "page" : undefined} title={tip("System map")}>
                  <TreeStructure size={20} weight="light" aria-hidden />
                  <span className="rail-label">System map</span>
                  {system.onMap && <span className="nav-dot rail-label" aria-hidden />}
                </a>
                {system.jobs.map((j, i) => (
                  <a key={j.href} href={j.href} aria-current={j.current ? "true" : undefined} title={tip(j.label)} aria-label={`Job ${i + 1}: ${j.label}`}>
                    <span className="nav-num" aria-hidden>
                      {i + 1}
                    </span>
                    <span className="rail-label nav-job">{j.label}</span>
                  </a>
                ))}
              </nav>
            </>
          )}
          {view && onView && <p className="studio-caption rail-label">{system ? "This job" : "Your workspace"}</p>}
          {view && onView && <nav aria-label="Result" className="studio-nav">
            {VIEWS.map(({ id, label, Icon }) => {
              const locked = building && id === "build";
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={view === id ? "page" : undefined}
                  aria-label={locked ? "Build, opens once your tools are built" : label}
                  title={locked ? "Building your tools. This opens the moment they're ready." : tip(label)}
                  disabled={locked}
                  onClick={() => onView(id)}
                >
                  {locked ? <CircleNotch size={20} aria-hidden className="motion-safe:animate-spin" /> : <Icon size={20} weight="light" aria-hidden />}
                  <span className="rail-label">{label}</span>
                  {locked ? <span className="nav-building rail-label">Building…</span> : view === id && <span className="nav-dot rail-label" aria-hidden />}
                </button>
              );
            })}
          </nav>}
          <div className="studio-note rail-label">
            <span className="studio-caption">The recommendation</span>
            <p>A considered path from request to working system.</p>
            <span className="studio-rule" aria-hidden />
          </div>
          <div className="studio-profile">
            <a href={href({ name: "history" })} title={tip("Your workspace")}>
              <span className="avatar">
                <ClockCounterClockwise size={16} aria-hidden />
              </span>
              <span className="rail-label">
                Your workspace
                <small>
                  {historyCount} saved result{historyCount === 1 ? "" : "s"}
                </small>
              </span>
            </a>
            <a href={href({ name: "how" })} title={tip("How it decides")}>
              <span className="avatar">
                <Scales size={16} aria-hidden />
              </span>
              <span className="rail-label">How it decides</span>
            </a>
            <button
              type="button"
              title={tip(nextTheme === "dark" ? "Dark theme" : "Light theme")}
              onClick={() => {
                setTheme(nextTheme);
                saveTheme(nextTheme);
              }}
            >
              <span className="avatar">{theme === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}</span>
              <span className="rail-label">{nextTheme === "dark" ? "Dark theme" : "Light theme"}</span>
            </button>
          </div>
        </div>
      </aside>
      <div className="studio-main">
        {children}
      </div>
    </div>
  );
}

/** The survey's frame: the start page's background and "blueprint studio" header around the questions. */
export function SurveyFrame({ children }: { children: ReactNode }) {
  return (
    <div className="studio start-page survey-page">
      <header className="start-header">
        <a href={href({ name: "home" })} className="start-brand" aria-label="Blueprint, home">
          <BrandMark className="h-[26px] w-auto" />
        </a>
      </header>
      {children}
    </div>
  );
}
