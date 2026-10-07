import {
  ArrowRight,
  ChatCircle,
  Check,
  Clock,
  FileText,
  FlagCheckered,
  FlowArrow,
  FolderSimple,
  GearSix,
  GitFork,
  Globe,
  Lightning,
  Package,
  Sparkle,
  TerminalWindow,
  UserCheck,
  Wind,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, m, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import type { Kit, KitTool } from "../lib/starter";

// The solution view's invitation to build: a small window that plays a short
// scene for BUILD.md and then one for each tool in the kit (n8n, the Claude
// plugin, Hermes Agent, Airflow), moving on a couple of seconds after each
// scene finishes and looping. Every scene is drawn from the kit's real files.
// The whole card links to the Build view. Styles live in src/studio.css under
// .build-invite.

/** How long a finished scene stays on screen before the next one. */
const HOLD = 2.4;
const EASE = [0.16, 1, 0.3, 1] as const;

type Scene = { id: string; icon: Icon; title: string; caption: ReactNode; length: number; body: ReactNode };

/** A line of text typed out once, from `delay` seconds (CSS steps; see .build-invite-typed). */
function Typed({ text, delay, duration = 1.4 }: { text: string; delay: number; duration?: number }) {
  return (
    <span
      className="build-invite-typed"
      style={{ ["--type-chars" as string]: text.length, ["--type-delay" as string]: `${delay}s`, ["--type-time" as string]: `${duration}s` } as CSSProperties}
    >
      {text}
    </span>
  );
}

/** Fades and lifts in at `delay` seconds. */
function Rise({ delay, x = 0, y = 6, className, children }: { delay: number; x?: number; y?: number; className?: string; children: ReactNode }) {
  return (
    <m.span className={className} initial={{ opacity: 0, x, y }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.4, delay, ease: EASE }}>
      {children}
    </m.span>
  );
}

// ---- BUILD.md: the kit's files tick into place, then the prompt types out.

function briefScene(kit: Kit): Scene {
  const files = kit.files.slice(0, 4);
  const more = kit.files.length - files.length;
  const typeAt = 0.35 + (files.length + 1) * 0.16;
  const prompt = "Build this project from BUILD.md";
  return {
    id: "brief",
    icon: FolderSimple,
    title: "your-project",
    caption: "Hand BUILD.md to Claude Code, Codex or another AI coding assistant.",
    length: typeAt + 1.5,
    body: (
      <>
        <span className="build-invite-files">
          {files.map((f, i) => (
            <Rise key={f.path} delay={0.35 + i * 0.16} x={-8} y={0} className={`build-invite-file${f.path === "BUILD.md" ? " is-brief" : ""}`}>
              <FileText size={14} />
              <span className="build-invite-path">{f.path}</span>
              {f.path === "BUILD.md" && <span className="build-invite-tag">the brief</span>}
              <Check size={13} weight="bold" className="build-invite-tick" />
            </Rise>
          ))}
          <Rise delay={0.35 + files.length * 0.16} y={0} className="build-invite-more">
            {more > 0 ? `and ${more} more · ` : ""}
            {kit.files.length} files
          </Rise>
        </span>
        <span className="build-invite-prompt">
          <span className="build-invite-chevron">›</span>
          <Typed text={prompt} delay={typeAt} />
          <span className="build-invite-caret" />
        </span>
      </>
    ),
  };
}

// ---- n8n: the workflow pastes onto the canvas, connects, then runs green.

function n8nIcon(type: string): Icon {
  if (/trigger|webhook/i.test(type)) return /schedule/i.test(type) ? Clock : Lightning;
  if (/langchain|agent|openai|anthropic|lmchat/i.test(type)) return Sparkle;
  if (/wait/i.test(type)) return UserCheck;
  if (/http/i.test(type)) return Globe;
  if (/noop/i.test(type)) return FlagCheckered;
  if (/\.if|switch/i.test(type)) return GitFork;
  return GearSix;
}

function n8nScene(kit: Kit): Scene {
  let nodes: { name: string; type: string }[] = [];
  try {
    const wf = JSON.parse(kit.files.find((f) => f.path === "n8n/workflow.json")?.content ?? "{}");
    nodes = (wf.nodes ?? []).filter((n: { type: string }) => !/stickyNote/i.test(n.type)).map((n: { name: string; type: string }) => ({ name: n.name.replace(/^\d+\.\s*/, ""), type: n.type }));
  } catch {
    /* an unreadable workflow shows an empty canvas */
  }
  const shown = nodes.slice(0, 4);
  const more = nodes.length - shown.length;
  const nodeAt = (i: number) => 0.6 + i * 0.32;
  const runAt = nodeAt(shown.length) + 0.3;
  return {
    id: "n8n",
    icon: FlowArrow,
    title: "n8n · new workflow",
    caption: "Paste the workflow onto an n8n canvas, then add your credentials.",
    length: runAt + shown.length * 0.28 + 0.3,
    body: (
      <span className="build-invite-canvas">
        <Rise delay={0.15} y={-6} className="build-invite-toast">
          <kbd>⌘V</kbd> Pasted {nodes.length} nodes
        </Rise>
        <span className="build-invite-flow">
          {shown.map((n, i) => {
            const NodeIcon = n8nIcon(n.type);
            return (
              <span key={i} className="build-invite-flow-step">
                {i > 0 && (
                  <m.span
                    className="build-invite-wire"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3, delay: nodeAt(i) - 0.12, ease: EASE }}
                  />
                )}
                <Rise delay={nodeAt(i)} y={8} className="build-invite-node">
                  <span className="build-invite-node-box">
                    <NodeIcon size={20} weight={NodeIcon === Sparkle ? "fill" : "regular"} />
                    <m.span
                      className="build-invite-node-ok"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22, delay: runAt + i * 0.28 }}
                    >
                      <Check size={9} weight="bold" />
                    </m.span>
                  </span>
                  <span className="build-invite-node-name">{n.name}</span>
                </Rise>
              </span>
            );
          })}
          {more > 0 && (
            <Rise delay={nodeAt(shown.length)} y={0} className="build-invite-node-more">
              +{more}
            </Rise>
          )}
        </span>
      </span>
    ),
  };
}

// ---- Claude plugin: the .plugin drops into a Cowork chat and installs.

function pluginScene(kit: Kit, tool: KitTool): Scene {
  const parts = kit.files
    .filter((f) => f.path.startsWith("claude-plugin/"))
    .map((f) => f.path.slice("claude-plugin/".length))
    .flatMap((p): [string, string][] => {
      const skill = p.match(/^skills\/([^/]+)\/SKILL\.md$/);
      if (skill) return [["Skill", skill[1]]];
      const agent = p.match(/^agents\/([^/]+)\.md$/);
      if (agent) return [["Agent", agent[1]]];
      if (p.endsWith(".mcp.json")) return [["Connectors", "MCP"]];
      return [];
    });
  const rows = parts.slice(0, 3);
  const filename = tool.action.kind === "zip" ? tool.action.filename : "plugin.plugin";
  return {
    id: "claude-plugin",
    icon: ChatCircle,
    title: "Claude Cowork",
    caption: "Drop the plugin into a Claude Cowork chat and press Install.",
    length: 1.9 + rows.length * 0.2 + 0.3,
    body: (
      <span className="build-invite-chat">
        <Rise delay={0.25} y={-26} className="build-invite-attachment">
          <span className="build-invite-attachment-icon">
            <Package size={18} />
          </span>
          <span className="min-w-0">
            <span className="build-invite-path block">{filename}</span>
            <small>Claude plugin</small>
          </span>
          <span className="build-invite-install">
            <m.span initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.2, delay: 1.35 }}>
              Install
            </m.span>
            <m.span className="is-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 1.4 }}>
              <Check size={12} weight="bold" /> Installed
            </m.span>
          </span>
        </Rise>
        <m.span
          aria-hidden
          className="build-invite-press"
          initial={{ opacity: 0, scale: 1.6 }}
          animate={{ opacity: [0, 0.5, 0], scale: [1.6, 1, 1] }}
          transition={{ duration: 0.5, delay: 1.0, times: [0, 0.6, 1] }}
        />
        <span className="build-invite-chat-rows">
          {rows.map(([kind, name], i) => (
            <Rise key={`${kind}-${name}`} delay={1.9 + i * 0.2} y={4} className="build-invite-chat-row">
              <Check size={12} weight="bold" className="build-invite-tick" />
              <span className="build-invite-chat-kind">{kind}</span>
              <span className="build-invite-path">{name}</span>
            </Rise>
          ))}
        </span>
      </span>
    ),
  };
}

// ---- Hermes Agent: setup.sh runs in a terminal.

function hermesScene(kit: Kit): Scene {
  const setup = kit.files.find((f) => f.path === "hermes/setup.sh")?.content ?? "";
  const skill = kit.files.map((f) => f.path.match(/^hermes\/skills\/business\/([^/]+)\//)?.[1]).find(Boolean) ?? "your-skill";
  const lines: [string, string][] = [
    ["Skill installed", `~/.hermes/skills/business/${skill}`],
    ["Persona installed", "~/.hermes/SOUL.md"],
    ...(/Run every/i.test(setup) ? ([["Scheduled", "every weekday at 7am"]] as [string, string][]) : []),
  ];
  const outAt = (i: number) => 1.6 + i * 0.35;
  const doneAt = outAt(lines.length) + 0.1;
  return {
    id: "hermes",
    icon: TerminalWindow,
    title: "~/Downloads — zsh",
    caption: "Run setup.sh to install the skill, the persona and the schedule.",
    length: doneAt + 1.2,
    body: (
      <span className="build-invite-term">
        <span className="build-invite-term-line">
          <span className="build-invite-chevron">$</span>
          <Typed text="sh setup.sh" delay={0.4} duration={0.8} />
        </span>
        {lines.map(([what, where], i) => (
          <Rise key={what} delay={outAt(i)} y={0} className="build-invite-term-line is-out">
            <Check size={12} weight="bold" className="build-invite-tick" />
            <span>{what}</span>
            <span className="build-invite-path is-dim">{where}</span>
          </Rise>
        ))}
        <Rise delay={doneAt} y={0} className="build-invite-term-line">
          <span className="build-invite-chevron">$</span>
          <Typed text="hermes" delay={doneAt + 0.3} duration={0.5} />
          <span className="build-invite-caret" />
        </Rise>
      </span>
    ),
  };
}

// ---- Airflow: the sensors wait for the data, then each task runs and succeeds.

function airflowScene(kit: Kit): Scene {
  const dag = kit.files.find((f) => f.path.startsWith("airflow/dags/"))?.content ?? "";
  const tasks = [...dag.matchAll(/def (step_\w+|hand_off_to_agent)\(/g)].map((x) => x[1]);
  const shown = tasks.slice(0, 2);
  const more = tasks.length - shown.length;
  const sensors = ["wait_for_first_data_job", "wait_for_second_data_job"];
  const taskAt = (i: number) => 1.3 + i * 0.7;
  const total = taskAt(shown.length) + 0.2;
  // One task box: queued (grey), running (pale green), then success (green).
  const Task = ({ name, start }: { name: string; start: number }) => (
    <m.span
      className="build-invite-task"
      initial={{ borderColor: "rgba(120,130,125,0.35)" }}
      animate={{ borderColor: ["rgba(120,130,125,0.35)", "#8fd3ad", "#1f7a5c"] }}
      transition={{ duration: 0.75, delay: start, times: [0, 0.35, 1] }}
    >
      <m.span
        className="build-invite-task-dot"
        initial={{ backgroundColor: "#b9c2bd" }}
        animate={{ backgroundColor: ["#b9c2bd", "#8fd3ad", "#1f7a5c"] }}
        transition={{ duration: 0.75, delay: start, times: [0, 0.35, 1] }}
      />
      <span className="build-invite-path">{name}</span>
    </m.span>
  );
  return {
    id: "airflow",
    icon: Wind,
    title: "Airflow · DAGs",
    caption: "Save the DAG to your dags folder and point its sensors at your data jobs.",
    length: total + 0.6,
    body: (
      <span className="build-invite-dag">
        <Rise delay={0.2} y={4} className="build-invite-dag-col">
          {sensors.map((s) => (
            <Task key={s} name={s} start={0.5} />
          ))}
        </Rise>
        {shown.map((t, i) => (
          <span key={t} className="build-invite-flow-step">
            <m.span className="build-invite-wire" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3, delay: taskAt(i) - 0.25, ease: EASE }} />
            <Rise delay={taskAt(i) - 0.15} y={4} className="build-invite-dag-col">
              <Task name={t} start={taskAt(i)} />
            </Rise>
          </span>
        ))}
        {more > 0 && (
          <Rise delay={taskAt(shown.length) - 0.2} y={0} className="build-invite-node-more">
            +{more}
          </Rise>
        )}
      </span>
    ),
  };
}

function scenesFor(kit: Kit): Scene[] {
  const scenes = [briefScene(kit)];
  for (const tool of kit.tools) {
    if (tool.id === "n8n") scenes.push(n8nScene(kit));
    else if (tool.id === "claude-plugin") scenes.push(pluginScene(kit, tool));
    else if (tool.id === "hermes") scenes.push(hermesScene(kit));
    else if (tool.id === "airflow") scenes.push(airflowScene(kit));
  }
  return scenes;
}

export function BuildInvite({ kit, href, onOpen }: { kit: Kit; href: string; onOpen: () => void }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const visible = useInView(ref, { amount: 0.4 });
  const scenes = useMemo(() => scenesFor(kit), [kit]);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const scene = scenes[Math.min(index, scenes.length - 1)];
  // Each showing of a scene gets its own key, so its animation plays from the start.
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (visible) setStarted(true);
  }, [visible]);

  // Move on a little after the scene's animation ends; pause while the card is off screen.
  useEffect(() => {
    if (reduce || !started || !visible || scenes.length < 2) return;
    const t = window.setTimeout(() => {
      setIndex((i) => (i + 1) % scenes.length);
      setRound((r) => r + 1);
    }, (scene.length + HOLD) * 1000);
    return () => window.clearTimeout(t);
  }, [reduce, started, visible, scene, scenes.length, round]);

  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    // A plain click switches views in place; a modified click opens the link as usual.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onOpen();
  };

  const TitleIcon = scene.icon;
  const names = scenes.map((s) => (s.id === "brief" ? "BUILD.md" : kit.tools.find((t) => t.id === s.id)?.name ?? s.id));

  return (
    <a
      ref={ref}
      href={href}
      onClick={open}
      className={`build-invite${reduce ? " is-still" : ""}`}
      aria-label={`Build it: open your starter kit (${names.join(", ")}), ${kit.files.length} files ready for an AI coding assistant`}
    >
      <span aria-hidden className="build-invite-window">
        <span className="build-invite-bar">
          <span className="build-invite-lights">
            <i />
            <i />
            <i />
          </span>
          <span className="build-invite-title">
            <TitleIcon size={13} weight="fill" />
            {scene.title}
          </span>
          {scenes.length > 1 && (
            <span className="build-invite-progress">
              {scenes.map((s, i) => (
                <span key={s.id} className={i < index ? "is-done" : undefined}>
                  {i === index && started && !reduce && (
                    <i key={round} style={{ animationDuration: `${scene.length + HOLD}s`, animationPlayState: visible ? "running" : "paused" }} />
                  )}
                </span>
              ))}
            </span>
          )}
        </span>
        <span className="build-invite-stage">
          <AnimatePresence initial={false}>
            {(started || reduce) && (
              <m.span
                key={`${scene.id}-${round}`}
                className={`build-invite-scene is-${scene.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
              >
                {scene.body}
              </m.span>
            )}
          </AnimatePresence>
        </span>
      </span>

      <span className="build-invite-cta">
        <AnimatePresence mode="wait" initial={false}>
          <m.span key={scene.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <strong>Build it.</strong> {scene.caption}
          </m.span>
        </AnimatePresence>
        <span className="build-invite-go">
          Start building
          <ArrowRight size={16} aria-hidden />
        </span>
      </span>
    </a>
  );
}
