import {
  ArrowDown,
  ArrowRight,
  CaretDown,
  Check,
  CheckCircle,
  CircleNotch,
  Copy,
  CursorClick,
  DownloadSimple,
  FileCode,
  FileText,
  FolderOpen,
  Key,
  Asterisk,
  Lightbulb,
  Package,
  Play,
  Plug,
  Plus,
  Robot,
  Sparkle,
  Warning,
  X,
} from "@phosphor-icons/react";
import { m, useReducedMotion } from "motion/react";
import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { KitFile } from "../lib/starter";
import { BuildVideo } from "./BuildVideo";
import { ClaudePluginVideo, pluginParts } from "./ClaudePluginVideo";
import { HermesVideo, hermesFiles } from "./HermesVideo";
import { N8nVideo } from "./N8nVideo";
import { btn } from "./ui";

// Illustrated "walk me through it" guides for the starter kit: one for building
// with an AI coding assistant, one for pasting the workflow into n8n, and one
// for setting up Hermes Agent. Each step
// pairs a small mock-up of the screen the person will see with what to do
// there, joined left to right (top to bottom on narrow screens) so the whole
// journey reads as one picture.

type Step = { title: string; screen: ReactNode; body: ReactNode; action?: ReactNode };

// Static class strings per step count, so Tailwind can see every one. Five
// steps need more room before they sit side by side.
const LAYOUT = {
  4: {
    grid: "lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-2",
    card: "lg:max-w-none",
    down: "lg:hidden",
    right: "hidden lg:block",
    gap: "lg:pt-24",
  },
  5: {
    grid: "xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] xl:gap-2",
    card: "xl:max-w-none",
    down: "xl:hidden",
    right: "hidden xl:block",
    gap: "xl:pt-24",
  },
} as const;

function GuideDialog({
  open,
  onClose,
  title,
  subtitle,
  steps,
  tip,
  video,
  active,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  steps: Step[];
  tip: ReactNode;
  /** A recording shown above the steps; `active` is the step it is showing. */
  video?: ReactNode;
  active?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reduce = useReducedMotion();
  const layout = LAYOUT[steps.length as keyof typeof LAYOUT] ?? LAYOUT[4];

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto max-h-[92vh] w-[min(1280px,calc(100%-2rem))] max-w-none overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex max-h-[92vh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15.5px] font-semibold text-ink">
              {title}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>
          </div>
          <button type="button" className={btn.quiet} onClick={onClose}>
            <X size={16} aria-hidden />
            Close
          </button>
        </div>

        {/* Rendered only while open, so the steps animate in each time. */}
        {open && (
          <div className="min-h-0 overflow-y-auto px-5 py-5">
            {video && <div className="mb-5">{video}</div>}
            <ol className={`grid gap-3 ${layout.grid}`}>
              {steps.map((s, i) => (
                <Fragment key={s.title}>
                  {i > 0 && (
                    <li aria-hidden className={`flex items-center justify-center text-line-strong ${layout.gap}`}>
                      <ArrowDown size={18} weight="bold" className={layout.down} />
                      <ArrowRight size={18} weight="bold" className={layout.right} />
                    </li>
                  )}
                  <m.li
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: reduce ? 0 : 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                    aria-current={active === i ? "step" : undefined}
                    className={`flex w-full min-w-0 max-w-[440px] flex-col justify-self-center rounded-2xl border p-3 transition-colors duration-300 ${active === i ? "border-accent bg-accent-soft/50" : "border-line bg-surface-2/40"} ${layout.card}`}
                  >
                    <div className="diagram-surface flex h-[184px] items-center justify-center overflow-hidden rounded-xl border border-line bg-bg p-3" aria-hidden>
                      {s.screen}
                    </div>
                    <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                      <h3 className="flex items-center gap-2 text-[14.5px] font-semibold leading-snug text-ink">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-semibold text-accent-ink">{i + 1}</span>
                        {s.title}
                      </h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.body}</p>
                      {s.action && <div className="mt-auto pt-3">{s.action}</div>}
                    </div>
                  </m.li>
                </Fragment>
              ))}
            </ol>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-accent-soft/70 px-4 py-3 text-[13px] leading-relaxed text-ink">
              <Lightbulb size={16} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-accent" />
              <span>{tip}</span>
            </p>
          </div>
        )}
      </div>
    </dialog>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <span className="rounded bg-surface-2 px-1 py-px font-mono text-[12px] text-ink [overflow-wrap:anywhere]">{children}</span>;
}

function B({ children }: { children: ReactNode }) {
  return <b className="font-semibold text-ink">{children}</b>;
}

const stepBtn = `${btn.small} px-3 py-1.5 text-[13px]`;
const stepLink = "text-[13px] font-medium text-accent underline-offset-4 hover:underline";

// ------------------------------------------------------------------ AI coding assistant

export function BuildGuide({
  open,
  onClose,
  slug,
  files,
  copied,
  onCopyBrief,
  onDownloadAll,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  files: KitFile[];
  copied: boolean;
  onCopyBrief: () => void;
  onDownloadAll: () => void;
}) {
  const [section, setSection] = useState(0);
  const zip = `${slug}-starter-kit.zip`;
  const lines = files[0]?.content.split("\n").length ?? 0;

  const steps: Step[] = [
    {
      title: "Download the kit",
      screen: <DownloadScreen slug={slug} files={files} item={{ n: "01", title: "Build it with an AI coding assistant" }} />,
      body: (
        <>
          Press <B>Download all</B>, then double-click <Mono>{zip}</Mono> to unzip it. You get a folder called <Mono>{slug}</Mono>.
        </>
      ),
      action: (
        <button type="button" className={stepBtn} onClick={onDownloadAll}>
          <DownloadSimple size={14} aria-hidden />
          Download all
        </button>
      ),
    },
    {
      title: "Open Claude Code in that folder",
      screen: <TerminalScreen slug={slug} />,
      body: (
        <>
          Open Terminal, go into the folder with <Mono>cd</Mono>, and type <Mono>claude</Mono>. In the Claude desktop app, open the Code tab and pick the folder instead.
        </>
      ),
      action: (
        <a href="https://claude.com/claude-code" target="_blank" rel="noreferrer" className={stepLink}>
          Not installed yet? Get Claude Code
        </a>
      ),
    },
    {
      title: "Paste BUILD.md",
      screen: <PasteScreen lines={lines} />,
      body: (
        <>
          Copy <Mono>BUILD.md</Mono>, paste it into the prompt and press Enter.
        </>
      ),
      action: (
        <button type="button" className={stepBtn} onClick={onCopyBrief}>
          {copied ? <Check size={14} weight="bold" aria-hidden /> : <Copy size={14} aria-hidden />}
          {copied ? "Copied" : "Copy BUILD.md"}
        </button>
      ),
    },
    {
      title: "Build it together",
      screen: <BuildScreen file={files[1]?.path ?? "the first file"} />,
      body: <>Claude explains each step before doing it and asks before creating files, spending money or sending anything. Read, then approve.</>,
    },
  ];

  return (
    <GuideDialog
      open={open}
      onClose={onClose}
      title="From starter kit to a working build"
      subtitle="Watch it once, then follow the four steps below."
      steps={steps}
      video={<BuildVideo slug={slug} files={files} onSection={setSection} />}
      active={section}
      tip={
        <>
          Rather not paste? <Mono>BUILD.md</Mono> is already in the folder, so in step 3 you can type <Mono>Read BUILD.md and follow it</Mono> instead. Using Codex? Same steps:
          run <Mono>codex</Mono> in the folder.
        </>
      }
    />
  );
}

// ------------------------------------------------------------------ n8n

type WfNode = { name: string; type: string };

/** The steps a person will see on the canvas, and the first node that needs a credential. */
function readWorkflow(json: string) {
  let nodes: WfNode[] = [];
  try {
    nodes = (JSON.parse(json) as { nodes?: WfNode[] }).nodes ?? [];
  } catch {
    // Shown as a generic workflow below.
  }
  nodes = nodes.filter((n) => !n.type.endsWith("stickyNote"));
  const needsKey = (n: WfNode) => /lmChat|httpRequest|mcpClient/.test(n.type);
  // Model and tool nodes hang off their AI step, so the main chain is everything else.
  const chain = nodes.filter((n) => !/lmChat|mcpClient/.test(n.type));
  // The placeholder final action is where most people connect their first app.
  const placeholder = nodes.find((n) => n.type.endsWith(".noOp")) ?? chain.at(-1);
  return { count: nodes.length, chain, keyed: nodes.find(needsKey), placeholder };
}

export function N8nGuide({
  open,
  onClose,
  files,
  workflow,
  ready,
  copied,
  onCopy,
  tailoring,
  onTailor,
}: {
  open: boolean;
  onClose: () => void;
  files: KitFile[];
  /** The workflow JSON, tailored if it has been. */
  workflow: string;
  /** Whether the workflow can be copied yet (with AI tailoring on, only after tailoring). */
  ready: boolean;
  copied: boolean;
  onCopy: () => void;
  tailoring: boolean;
  onTailor: () => void;
}) {
  const reduce = useReducedMotion();
  const [section, setSection] = useState(0);
  const wf = readWorkflow(workflow);

  const steps: Step[] = [
    {
      title: "Copy the workflow",
      screen: <CopyScreen count={wf.count} ready={ready} />,
      body: ready ? (
        <>
          Press <B>Copy for n8n</B>. The whole workflow, all {wf.count} nodes and their connections, goes to your clipboard.
        </>
      ) : (
        <>
          Press <B>Tailor with AI</B> first so the workflow fits your task. Then press <B>Copy for n8n</B>.
        </>
      ),
      action: ready ? (
        <button type="button" className={stepBtn} onClick={onCopy}>
          {copied ? <Check size={14} weight="bold" aria-hidden /> : <Copy size={14} aria-hidden />}
          {copied ? "Copied" : "Copy for n8n"}
        </button>
      ) : (
        <button type="button" className={stepBtn} onClick={onTailor} disabled={tailoring}>
          {tailoring ? <CircleNotch size={14} aria-hidden className={reduce ? "" : "animate-spin"} /> : <Sparkle size={14} weight="fill" aria-hidden />}
          {tailoring ? "Tailoring…" : "Tailor with AI"}
        </button>
      ),
    },
    {
      title: "Open a new workflow",
      screen: <N8nHomeScreen />,
      body: (
        <>
          Sign in to n8n Cloud or open your own n8n, then choose <B>Create workflow</B>. You get an empty canvas.
        </>
      ),
      action: (
        <a href="https://n8n.io" target="_blank" rel="noreferrer" className={stepLink}>
          No n8n yet? Start at n8n.io
        </a>
      ),
    },
    {
      title: "Paste onto the canvas",
      screen: <CanvasScreen chain={wf.chain} />,
      body: (
        <>
          Click the empty canvas and press <B>Cmd+V</B> (<B>Ctrl+V</B> on Windows). Every step appears, already connected.
        </>
      ),
    },
    wf.keyed
      ? {
          title: "Add your credentials",
          screen: <CredentialScreen node={wf.keyed.name} />,
          body: (
            <>
              Open each node with a warning sign and choose or create its credential. Keys go in n8n's credential manager, never in the node's text.
            </>
          ),
        }
      : {
          title: "Connect your apps",
          screen: <CredentialScreen node={wf.placeholder?.name ?? "Final action"} />,
          body: (
            <>
              This workflow uses no AI model, so it needs no AI key. When you swap a placeholder node for your real app (email, a spreadsheet, a CRM), connect that app's
              credential the same way.
            </>
          ),
        },
    {
      title: "Test, then switch it on",
      screen: <RunScreen chain={wf.chain} />,
      body: <>Run it once with a test item and check each node's output. When every step looks right, save and switch the workflow on.</>,
    },
  ];

  return (
    <GuideDialog
      open={open}
      onClose={onClose}
      title="From starter kit to a running n8n workflow"
      subtitle="Watch it once, then follow the five steps below. You need an n8n account or your own n8n."
      steps={steps}
      video={<N8nVideo files={files} onSection={setSection} />}
      active={section}
      tip={
        <>
          Paste not working? Use the <B>⋯</B> menu, <B>Import from File</B>, and pick <Mono>n8n/workflow.json</Mono> from the kit. Every node has a note saying what it does and
          what to <Mono>REPLACE</Mono>; open the node and look under Settings.
        </>
      }
    />
  );
}

// ------------------------------------------------------------------ Hermes Agent

export function HermesGuide({
  open,
  onClose,
  slug,
  files,
  onDownload,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  files: KitFile[];
  onDownload: () => void;
}) {
  const [section, setSection] = useState(0);
  const h = hermesFiles(files);
  const folder = `${slug}-hermes`;
  const shown: KitFile[] = h.paths.map((path) => ({ path, lang: path.endsWith(".md") ? "markdown" : "shell", purpose: "", content: "" }));
  const connects = /mcp_servers:/.test(h.config);

  const steps: Step[] = [
    {
      title: "Download the setup",
      screen: <DownloadScreen slug={folder} files={shown} label="Download setup" item={{ n: "02", title: "Hermes Agent setup" }} />,
      body: (
        <>
          Press <B>Download setup</B>, then double-click <Mono>{folder}.zip</Mono>. The folder holds the settings, the persona (<Mono>SOUL.md</Mono>), the Skill and{" "}
          <Mono>setup.sh</Mono>.
        </>
      ),
      action: (
        <button type="button" className={stepBtn} onClick={onDownload}>
          <DownloadSimple size={14} aria-hidden />
          Download setup
        </button>
      ),
    },
    {
      title: "Install Hermes Agent",
      screen: <RepoScreen />,
      body: (
        <>
          Hermes Agent is open source (MIT licence) and runs on your computer or a small server. Install it by following its README, then check that{" "}
          <Mono>hermes</Mono> runs in Terminal.
        </>
      ),
      action: (
        <a href="https://github.com/NousResearch/hermes-agent" target="_blank" rel="noreferrer" className={stepLink}>
          Hermes Agent on GitHub
        </a>
      ),
    },
    {
      title: "Read, then run setup.sh",
      screen: <SetupScreen folder={folder} />,
      body: (
        <>
          In Terminal, go into the folder with <Mono>cd</Mono>, read the script with <Mono>cat setup.sh</Mono>, then run <Mono>sh setup.sh</Mono>. It copies the Skill and the
          persona into <Mono>~/.hermes</Mono> and keeps a backup of any persona you had{h.scheduled ? ", and creates the weekday schedule" : ""}.
        </>
      ),
    },
    {
      title: "Merge the settings",
      screen: <ConfigScreen config={h.config} />,
      body: (
        <>
          Open <Mono>~/.hermes/config.yaml</Mono> and add the lines from the kit's <Mono>config.yaml</Mono>: the model{connects ? " and the connection to your business system" : ""}.
          {connects ? " The token stays in an environment variable, never in the file." : ""}
        </>
      ),
    },
    {
      title: "Lock it down, then test",
      screen: <SafetyScreen scheduled={h.scheduled} />,
      body: (
        <>
          Keep command approval on <B>manual</B> or <B>smart</B>, never <B>off</B>, and turn on approval for Skills the agent writes for itself.
          {h.scheduled ? " Keep the gateway running: scheduled jobs only run while it is." : ""} Then try it on one real past case and check the result.
        </>
      ),
    },
  ];

  return (
    <GuideDialog
      open={open}
      onClose={onClose}
      title="From starter kit to a running Hermes Agent"
      subtitle="Watch it once, then follow the five steps below. You need a computer or small server you can install software on."
      steps={steps}
      video={<HermesVideo slug={slug} files={files} onSection={setSection} />}
      active={section}
      tip={
        <>
          Rather not use Terminal yourself? <Mono>BUILD.md</Mono> has these steps too, so <B>Walk me through building it</B> lets Claude Code do them with you, asking before each
          one. Hermes works with any model provider, so you can change the model later in <Mono>config.yaml</Mono>.
        </>
      }
    />
  );
}

// ------------------------------------------------------------------ Claude plugin

export function ClaudePluginGuide({
  open,
  onClose,
  slug,
  files,
  onDownload,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  files: KitFile[];
  onDownload: () => void;
}) {
  const [section, setSection] = useState(0);
  const parts = pluginParts(files);
  const file = `${slug}.plugin`;

  const steps: Step[] = [
    {
      title: "Download the plugin",
      screen: <PluginFileScreen file={file} />,
      body: (
        <>
          Press <B>Download .plugin</B>. You get one file, <Mono>{file}</Mono>, in your Downloads folder. There's nothing to unzip.
        </>
      ),
      action: (
        <button type="button" className={stepBtn} onClick={onDownload}>
          <DownloadSimple size={14} aria-hidden />
          Download .plugin
        </button>
      ),
    },
    {
      title: "Open Claude",
      screen: <ClaudeOpenScreen />,
      body: <>Open the Claude desktop app from your dock and start a new chat. Plugins install from any chat.</>,
    },
    {
      title: "Drop it in and install",
      screen: <PluginInstallScreen file={file} />,
      body: (
        <>
          Drag <Mono>{file}</Mono> into the chat and press <B>Install</B>. The plugin stays installed, so you do this once.
        </>
      ),
    },
    {
      title: "Check what it added",
      screen: <PluginPartsScreen parts={parts} />,
      body: (
        <>
          The Skill is your playbook, used whenever this task comes up{parts.agents.length ? "; the agents take the specialist steps" : ""}.
          {parts.connectors ? " Connect the apps it lists in Claude's settings. Keys stay there, never in chat." : ""}
        </>
      ),
    },
    {
      title: "Try it on a real case",
      // The full prompt is long with the Skill's name in it; the picture shows the gist, and names the Skill on the reply.
      screen: <PluginTryScreen skill={parts.skill} prompt="Use the Skill on one real past case." />,
      body: <>Ask Claude to do the task for one real past case, and check its work before anything is sent or changed. Then use it on new cases.</>,
    },
  ];

  return (
    <GuideDialog
      open={open}
      onClose={onClose}
      title="From starter kit to a Claude plugin"
      subtitle="Watch it once, then follow the five steps below. You need the Claude desktop app."
      steps={steps}
      video={<ClaudePluginVideo slug={slug} files={files} onSection={setSection} />}
      active={section}
      tip={
        <>
          Working in Claude Code instead? Unzip <Mono>{file}</Mono> and copy its <Mono>skills</Mono> folder into <Mono>.claude/skills</Mono> in your project, or use{" "}
          <B>Walk me through building it</B> and let Claude Code set it up with you.
        </>
      }
    />
  );
}

// ------------------------------------------------------------------ mock-ups

/** A small app window: title bar with traffic lights, then content. */
function Window({ title, dark = false, children }: { title: string; dark?: boolean; children: ReactNode }) {
  return (
    <div className={`w-full overflow-hidden rounded-lg border shadow-sm ${dark ? "border-[#2a2f2d] bg-[#151918] text-[#d7e0db]" : "border-line bg-surface text-ink"}`}>
      <div className={`flex items-center gap-1 px-2 py-1.5 ${dark ? "bg-[#1f2422]" : "bg-surface-2"}`}>
        <span className="size-1.5 rounded-full bg-[#ec6a5e]" />
        <span className="size-1.5 rounded-full bg-[#f4bf4f]" />
        <span className="size-1.5 rounded-full bg-[#61c554]" />
        <span className={`ml-1.5 truncate font-mono text-[9.5px] ${dark ? "text-[#8b9690]" : "text-muted"}`}>{title}</span>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function Cursor() {
  return <CursorClick size={16} weight="fill" className="absolute -bottom-3 -right-3 text-ink" />;
}

/**
 * One step of the Build page as it looks now (see .build-item in studio.css and
 * SitePage in BuildVideo): a numbered row with its title and its green text
 * action, which the cursor presses. The action sits under the title here, so
 * the title stays readable in the narrow step cards.
 */
function BuildItemMock({ n, title, action, icon, done = false }: { n: string; title: string; action: string; icon: ReactNode; done?: boolean }) {
  return (
    <div className="w-full rounded-lg border border-line bg-surface px-2.5 py-2 shadow-sm">
      <div className="flex items-start gap-2">
        <span className="grid size-[18px] shrink-0 place-items-center rounded-full border border-line-strong/60 text-[7.5px] text-muted">{n}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10.5px] font-medium text-ink">{title}</p>
          <span className={`relative mt-1 inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-accent ${done ? "font-semibold" : "font-medium"}`}>
            {action}
            {icon}
            <Cursor />
          </span>
        </div>
      </div>
    </div>
  );
}

function DownloadScreen({
  slug,
  files,
  label = "Download all",
  item,
}: {
  slug: string;
  files: KitFile[];
  label?: string;
  item: { n: string; title: string };
}) {
  // Two files and a count: the Build page row above takes the room the frame used to give the list.
  const shown = files.slice(0, 2);
  const more = files.length - shown.length;
  return (
    <div className="flex w-full flex-col items-center gap-1">
      <BuildItemMock n={item.n} title={item.title} action={label} icon={<DownloadSimple size={10} />} />
      <Window title={slug}>
        <p className="flex min-w-0 items-center gap-1 font-mono text-[10px] text-ink">
          <FolderOpen size={12} weight="fill" className="shrink-0 text-accent" />
          <span className="truncate">{slug}/</span>
        </p>
        <ul className="mt-0.5 space-y-px pl-3.5">
          {shown.map((f, i) => (
            <li key={f.path} className={`flex items-center gap-1 font-mono text-[9.5px] ${f.path === "BUILD.md" ? "font-semibold text-ink" : "text-muted"}`}>
              {f.lang === "markdown" ? <FileText size={10} className="shrink-0" /> : <FileCode size={10} className="shrink-0" />}
              <span className="truncate">{f.path}</span>
              {/* The count rides on the last line shown, to keep the picture inside its frame. */}
              {i === shown.length - 1 && more > 0 && <span className="ml-auto shrink-0 pl-1.5 font-normal text-muted">+ {more} more</span>}
            </li>
          ))}
        </ul>
      </Window>
    </div>
  );
}

function TerminalScreen({ slug }: { slug: string }) {
  return (
    <Window title="Terminal" dark>
      <div className="space-y-1 font-mono text-[10px] leading-snug">
        <p className="truncate">
          <span className="text-[#79cbab]">$</span> cd ~/Downloads/{slug}
        </p>
        <p>
          <span className="text-[#79cbab]">$</span> claude
        </p>
        <div className="mt-1.5 rounded border border-[#d97757]/70 px-2 py-1.5">
          <p className="text-[#e6a184]">✻ Welcome to Claude Code</p>
          <p className="mt-0.5 truncate text-[#8b9690]">cwd: ~/Downloads/{slug}</p>
        </div>
      </div>
    </Window>
  );
}

function PasteScreen({ lines }: { lines: number }) {
  return (
    <Window title="claude" dark>
      <div className="space-y-1.5 font-mono text-[10px] leading-snug">
        <p className="text-[#8b9690]">⌘V or Ctrl+V to paste</p>
        <div className="rounded border border-[#5e6e67] px-2 py-1.5">
          <span className="text-[#8b9690]">&gt; </span>
          <span className="rounded-sm bg-[#2c3a35] px-1 text-[#79cbab]">[Pasted text #1 +{lines} lines]</span>
          <span className="ml-0.5 inline-block h-2.5 w-1 translate-y-0.5 animate-pulse bg-[#d7e0db]" />
        </div>
        <p className="text-right text-[9.5px] text-[#8b9690]">
          press <span className="rounded border border-[#5e6e67] px-1 text-[#d7e0db]">Enter ↵</span>
        </p>
      </div>
    </Window>
  );
}

function BuildScreen({ file }: { file: string }) {
  return (
    <Window title="claude" dark>
      <div className="space-y-1.5 font-mono text-[10px] leading-snug">
        <p>
          <span className="text-[#e6a184]">⏺</span> Step 1 of the plan: I'll set up the project folder and its first file.
        </p>
        <div className="rounded border border-[#5e6e67] px-2 py-1.5">
          <p className="truncate">Create {file}?</p>
          <p className="mt-0.5 text-[#79cbab]">❯ 1. Yes</p>
          <p className="text-[#8b9690]">&nbsp;&nbsp;2. No, tell Claude what to change</p>
        </div>
      </div>
    </Window>
  );
}

// n8n's own coral, used only inside the n8n mock-ups so they read as n8n.
const N8N = "#ea4b71";

function CopyScreen({ count, ready }: { count: number; ready: boolean }) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <BuildItemMock
        n="02"
        title="n8n workflow"
        action={ready ? "Copy for n8n" : "Tailor with AI"}
        icon={ready ? <Copy size={10} /> : <Sparkle size={10} weight="fill" />}
      />
      <ArrowDown size={11} className="mt-1 text-line-strong" />
      <div className="flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 font-mono text-[9.5px] text-ink">
        <Check size={10} weight="bold" className="text-accent" />
        {ready ? `workflow.json · ${count} nodes on clipboard` : "Tailored, then ready to copy"}
      </div>
    </div>
  );
}

function N8nHomeScreen() {
  return (
    <Window title="n8n · Overview">
      <div className="flex gap-2">
        <div className="flex w-5 flex-col items-center gap-1.5 rounded bg-surface-2 py-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: N8N }} />
          <span className="size-2 rounded-sm bg-line" />
          <span className="size-2 rounded-sm bg-line" />
          <span className="size-2 rounded-sm bg-line" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10.5px] font-semibold text-ink">Overview</span>
            <span className="relative flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium text-white" style={{ background: N8N }}>
              <Plus size={8} weight="bold" />
              Create workflow
              <Cursor />
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {["Invoice reminders", "Lead intake"].map((w) => (
              <div key={w} className="flex items-center justify-between rounded border border-line px-1.5 py-1 text-[9px] text-muted">
                {w}
                <span className="h-1.5 w-3 rounded-full bg-line" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Window>
  );
}

/** The workflow's own steps, top to bottom, as small n8n-style nodes. */
function NodeChain({ chain, done = false }: { chain: WfNode[]; done?: boolean }) {
  const shown = chain.slice(0, 3);
  const more = chain.length - shown.length;
  const names = shown.length ? shown.map((n) => n.name) : ["1. Trigger", "2. AI step", "3. Action"];
  return (
    <div className="flex flex-col items-center">
      {names.map((name, i) => (
        <Fragment key={name}>
          {i > 0 && <span className="h-2 w-px bg-line-strong" />}
          <span className="flex w-[150px] items-center gap-1.5 rounded-md border border-line-strong bg-surface px-1.5 py-1 text-[9.5px] text-ink shadow-sm">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: i === 0 ? N8N : "var(--line-strong)" }} />
            <span className="min-w-0 flex-1 truncate">{name}</span>
            {done && <CheckCircle size={11} weight="fill" className="shrink-0 text-accent" />}
          </span>
        </Fragment>
      ))}
      {more > 0 && <span className="mt-1 text-[9px] text-muted">+ {more} more steps</span>}
    </div>
  );
}

function CanvasScreen({ chain }: { chain: WfNode[] }) {
  return (
    <div className="relative flex w-full items-center justify-center">
      <NodeChain chain={chain} />
      <span className="absolute right-0 top-0 rounded border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink shadow-sm">⌘V</span>
    </div>
  );
}

function CredentialScreen({ node }: { node: string }) {
  return (
    <div className="w-full rounded-lg border border-line bg-surface p-2 shadow-sm">
      <p className="flex items-center gap-1 text-[10.5px] font-semibold text-ink">
        <Warning size={11} weight="fill" className="shrink-0 text-[#d97706]" />
        <span className="truncate">{node}</span>
      </p>
      <p className="mt-2 text-[9px] font-medium text-muted">Credential to connect with</p>
      <div className="relative mt-0.5 flex items-center justify-between rounded border border-[#d97706]/70 px-1.5 py-1 text-[9.5px] text-muted">
        Select credential
        <CaretDown size={9} />
        <Cursor />
      </div>
      <div className="mt-1 space-y-0.5 rounded border border-line bg-surface-2/60 p-1 text-[9px]">
        <p className="flex items-center gap-1 text-ink">
          <Plus size={8} weight="bold" style={{ color: N8N }} />
          Create new credential
        </p>
        <p className="flex items-center gap-1 text-muted">
          <Key size={8} />
          Saved in n8n, not in the workflow
        </p>
      </div>
    </div>
  );
}

function RunScreen({ chain }: { chain: WfNode[] }) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full items-center justify-between">
        <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium text-white" style={{ background: N8N }}>
          <Play size={8} weight="fill" />
          Execute workflow
        </span>
        <span className="flex items-center gap-1 text-[9px] font-medium text-ink">
          On
          <span className="relative h-2.5 w-5 rounded-full bg-accent">
            <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-accent-ink" />
          </span>
        </span>
      </div>
      <NodeChain chain={chain} done />
    </div>
  );
}

function RepoScreen() {
  return (
    <Window title="github.com/NousResearch/hermes-agent">
      <p className="flex items-center gap-1 text-[10.5px] text-ink">
        <span className="text-[#2f6fde]">NousResearch</span> / <span className="font-semibold text-[#2f6fde]">hermes-agent</span>
      </p>
      <p className="mt-0.5 text-[9px] text-muted">MIT license</p>
      <div className="mt-1.5 rounded border border-line p-1.5">
        <p className="relative inline-block text-[10px] font-semibold text-ink">
          README · Installation
          <Cursor />
        </p>
        <div className="mt-1 space-y-1">
          {[85, 70, 90].map((w) => (
            <span key={w} className="block h-1.5 rounded bg-line" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </Window>
  );
}

function SetupScreen({ folder }: { folder: string }) {
  return (
    <Window title="Terminal" dark>
      <div className="space-y-1 font-mono text-[10px] leading-snug">
        <p className="truncate">
          <span className="text-[#79cbab]">$</span> cd ~/Downloads/{folder}
        </p>
        <p>
          <span className="text-[#79cbab]">$</span> cat setup.sh
        </p>
        <p className="truncate text-[#8b9690]"># Installs the setup into Hermes Agent…</p>
        <p>
          <span className="text-[#79cbab]">$</span> sh setup.sh
        </p>
        <p className="truncate text-[#79cbab]">Installed. Now merge config.yaml…</p>
      </div>
    </Window>
  );
}

function ConfigScreen({ config }: { config: string }) {
  const lines = config.split("\n").filter((l) => l && !l.startsWith("#")).slice(0, 4);
  return (
    <Window title="~/.hermes/config.yaml">
      <div className="space-y-0.5 font-mono text-[9.5px] leading-snug">
        <p className="text-muted"># your existing settings</p>
        {lines.map((l, i) => (
          <p key={i} className="truncate rounded-sm bg-accent-soft px-1 text-ink">
            {l}
          </p>
        ))}
      </div>
    </Window>
  );
}

function SafetyScreen({ scheduled }: { scheduled: boolean }) {
  const rows = ["Command approval: manual or smart", "Skill changes need approval", ...(scheduled ? ["Gateway running for the schedule"] : []), "Tested on a real past case"];
  return (
    <div className="w-full rounded-lg border border-line bg-surface p-2 shadow-sm">
      <p className="text-[10.5px] font-semibold text-ink">Before you rely on it</p>
      <ul className="mt-1.5 space-y-1">
        {rows.map((r) => (
          <li key={r} className="flex items-center gap-1.5 text-[9.5px] text-ink">
            <CheckCircle size={11} weight="fill" className="shrink-0 text-accent" />
            <span className="truncate">{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Claude's warm off-white, used only inside the Claude mock-ups so they read as Claude.
const CLAUDE_BG = "#faf9f5";
const PLUGIN_ORANGE = "#c4623f";

function PluginChip({ file }: { file: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-md" style={{ background: "#f6e3da" }}>
        <Package size={13} color={PLUGIN_ORANGE} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-mono text-[9.5px] text-ink">{file}</span>
        <span className="block text-[8.5px] text-muted">Claude plugin</span>
      </span>
    </span>
  );
}

function PluginFileScreen({ file }: { file: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-1.5">
      <BuildItemMock n="02" title="Claude plugin" action="Download .plugin" icon={<DownloadSimple size={10} />} />
      <ArrowDown size={11} className="text-line-strong" />
      <div className="w-full rounded-lg border border-line bg-surface px-2.5 py-2 shadow-sm">
        <PluginChip file={file} />
      </div>
      <p className="font-mono text-[9px] text-muted">saved to Downloads</p>
    </div>
  );
}

/** A small Claude window: a sidebar with New chat, and the conversation. */
function ClaudeMini({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-line shadow-sm" style={{ background: CLAUDE_BG }}>
      <div className="flex items-center gap-1 bg-[#f0eee6] px-2 py-1.5">
        <span className="size-1.5 rounded-full bg-[#ec6a5e]" />
        <span className="size-1.5 rounded-full bg-[#f4bf4f]" />
        <span className="size-1.5 rounded-full bg-[#61c554]" />
        <span className="ml-1.5 font-mono text-[9.5px] text-[#6b6a63]">Claude</span>
      </div>
      <div className="flex">
        {/* A slim sidebar: New chat as its + button, then recent chats. */}
        <div className="flex w-[26px] shrink-0 flex-col items-center gap-1 border-r border-black/10 bg-[#f4f2ea] py-1.5" title="New chat">
          <span className="grid size-[16px] place-items-center rounded bg-[#e6e2d4]">
            <Plus size={8} weight="bold" color={PLUGIN_ORANGE} />
          </span>
          {[14, 11, 15].map((w, i) => (
            <span key={i} className="block h-[3px] rounded bg-black/10" style={{ width: w }} />
          ))}
        </div>
        <div className="min-w-0 flex-1 p-2">{children}</div>
      </div>
    </div>
  );
}

/** The dock with Claude's app (its coral tile and starburst), the cursor on it, and the window it opens. */
function ClaudeOpenScreen() {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <ClaudeMini>
        <p className="py-2 text-center text-[13px] text-ink" style={{ fontFamily: "var(--font-serif)" }}>
          How can I help you today?
        </p>
      </ClaudeMini>
      <div className="flex items-center gap-1.5 rounded-xl border border-white/40 bg-ink/10 px-2 py-1.5">
        {["#2f6fde", "#ffffff", "#1f2422"].map((c) => (
          <span key={c} className="size-5 rounded-md border border-black/10" style={{ background: c }} />
        ))}
        <span className="relative grid size-6 place-items-center rounded-md shadow" style={{ background: "#d97757" }}>
          <Asterisk size={14} weight="bold" color="#fff" />
          <Cursor />
        </span>
      </div>
    </div>
  );
}

function PluginInstallScreen({ file }: { file: string }) {
  return (
    <ClaudeMini>
      <div className="flex items-center gap-1.5 rounded-md border border-black/10 bg-white p-1.5">
        <PluginChip file={file} />
        <span className="relative ml-auto shrink-0 rounded-full bg-ink px-2 py-0.5 text-[9px] font-medium text-bg">
          Install
          <Cursor />
        </span>
      </div>
      <div className="mt-2 rounded-md border border-dashed px-2 py-1.5 text-center text-[9px]" style={{ borderColor: PLUGIN_ORANGE, color: PLUGIN_ORANGE }}>
        Dropped in from your desktop
      </div>
    </ClaudeMini>
  );
}

function PluginPartsScreen({ parts }: { parts: ReturnType<typeof pluginParts> }) {
  const rows: { icon: ReactNode; kind: string; name: string }[] = [
    { icon: <Sparkle size={10} weight="fill" />, kind: "Skill", name: parts.skill },
    ...parts.agents.slice(0, 2).map((a) => ({ icon: <Robot size={10} />, kind: "Agent", name: a })),
    ...(parts.connectors ? [{ icon: <Plug size={10} />, kind: "Apps", name: "connect in settings" }] : []),
  ];
  return (
    <ClaudeMini>
      <p className="mb-1.5 flex items-center gap-1 text-[9.5px] font-medium text-accent">
        <Check size={10} weight="bold" />
        Installed
      </p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.kind + r.name} className="flex min-w-0 items-center gap-1.5 text-[9px]">
            <span className="shrink-0 text-accent">{r.icon}</span>
            <span className="w-[34px] shrink-0 text-[8px] uppercase tracking-[0.06em] text-muted">{r.kind}</span>
            <span className="truncate font-mono text-ink">{r.name}</span>
          </li>
        ))}
      </ul>
    </ClaudeMini>
  );
}

function PluginTryScreen({ skill, prompt }: { skill: string; prompt: string }) {
  return (
    <ClaudeMini>
      <p className="ml-auto w-fit max-w-[90%] rounded-md bg-[#e9e6dc] px-1.5 py-1 text-[8.5px] leading-snug text-ink">{prompt}</p>
      <span className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded border border-black/10 bg-white px-1.5 py-0.5 text-[8px] text-[#4d5b55]">
        <Sparkle size={8} weight="fill" color={PLUGIN_ORANGE} className="shrink-0" />
        <span className="truncate">Using the {skill} Skill</span>
      </span>
      <p className="mt-1 text-[8.5px] leading-snug text-ink">Here's a draft. Check it before anything is sent.</p>
    </ClaudeMini>
  );
}
