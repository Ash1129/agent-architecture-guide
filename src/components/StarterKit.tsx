import { CaretDown, Check, CircleNotch, Copy, DownloadSimple, Eye, FileCode, FileText, FlowArrow, Package, PlayCircle, Robot, Sparkle, Terminal, TreeStructure, X } from "@phosphor-icons/react";
import { m, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AI_ENABLED } from "../lib/features";
import { type Answers, effectiveAnswers } from "../lib/questions";
import type { Kit, KitFile, KitTool } from "../lib/starter";
import { loadTailored, saveTailored } from "../lib/tailored";
import { BuildGuide, ClaudePluginGuide, HermesGuide, N8nGuide } from "./BuildGuide";
import { btn } from "./ui";

// The starter kit panel: one file to paste into an AI coding assistant, plus
// every supporting file on its own. Sits beside the diagram, or under it when
// the diagram needs the full width.

function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

const MIME: Record<KitFile["lang"], string> = {
  markdown: "text/markdown",
  json: "application/json",
  python: "text/x-python",
  csv: "text/csv",
  yaml: "application/yaml",
  shell: "text/x-sh",
};

const TOOL_ICON: Record<KitTool["id"], typeof FlowArrow> = {
  n8n: FlowArrow,
  "claude-plugin": Package,
  hermes: Robot,
  airflow: TreeStructure,
};

/** Zip a set of files, optionally re-rooted (a .plugin is a zip of the plugin folder itself). */
async function zipFiles(files: KitFile[], strip = "", into = "") {
  const { zipSync, strToU8 } = await import("fflate");
  return zipSync(Object.fromEntries(files.map((f) => [`${into}${f.path.slice(strip.length)}`, strToU8(f.content)])));
}

export type TailoringState = "idle" | "working" | "done" | "error";

/** The tools with an illustrated walkthrough, and the link that opens it. */
const GUIDE_FOR: Partial<Record<KitTool["id"], { guide: "n8n" | "hermes" | "plugin"; label: string }>> = {
  n8n: { guide: "n8n", label: "Walk me through n8n" },
  hermes: { guide: "hermes", label: "Walk me through Hermes" },
  "claude-plugin": { guide: "plugin", label: "Walk me through the plugin" },
};
type Tailoring =
  | { state: "idle" }
  | { state: "working" }
  | { state: "done"; content: string; model: string }
  | { state: "error"; message: string; problems?: string[] };

/** `rail`: a slim column beside the diagram. Otherwise a short strip under it. */
/**
 * `writing` says where the kit's task-specific text stands when AI is on:
 * being written, written by AI, or the template.
 */
export function StarterKit({
  kit,
  slug,
  answers,
  rail = false,
  writing,
  studio = false,
  autoTailor = false,
  onTailoring,
}: {
  kit: Kit;
  slug: string;
  answers: Answers;
  rail?: boolean;
  writing?: "loading" | "ready" | "template";
  /** Set out as the result workspace's Build view instead of a panel. */
  studio?: boolean;
  /** Tailor the n8n workflow as soon as the kit's text is settled, without waiting for the button. */
  autoTailor?: boolean;
  /** Where tailoring stands; "done" straight away when there's no n8n workflow to tailor. */
  onTailoring?: (state: TailoringState) => void;
}) {
  const [tailoring, setTailoring] = useState<Tailoring>({ state: "idle" });
  const request = useRef<AbortController | null>(null);

  const generated = kit.files.find((f) => f.path === "n8n/workflow.json")?.content;

  // A new design starts from its generated files again, unless this browser
  // already tailored this exact design.
  useEffect(() => {
    request.current?.abort();
    const saved = AI_ENABLED && generated ? loadTailored(answers, generated) : undefined;
    setTailoring(saved ? { state: "done", content: saved.content, model: saved.model } : { state: "idle" });
  }, [kit]); // eslint-disable-line react-hooks/exhaustive-deps -- answers change only together with kit
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => onTailoring?.(AI_ENABLED && generated ? tailoring.state : "done"), [tailoring.state, generated]); // eslint-disable-line react-hooks/exhaustive-deps -- reports changes only

  // With AI tailoring on, the generated n8n workflow is only the AI's starting
  // point and is never offered: the workflow appears, everywhere including inside
  // BUILD.md, once it has been tailored.
  const files = useMemo(() => {
    if (!AI_ENABLED || !generated) return kit.files;
    if (tailoring.state === "done") {
      return kit.files.map((f) =>
        f.path === "n8n/workflow.json" ? { ...f, content: tailoring.content } : f.path === "BUILD.md" ? { ...f, content: f.content.replace(generated, tailoring.content) } : f,
      );
    }
    return kit.files
      .filter((f) => f.path !== "n8n/workflow.json")
      .map((f) => (f.path === "BUILD.md" ? { ...f, content: f.content.replace("```json\n" + generated + "\n```", "_Not included yet. Use Tailor with AI on the n8n row of the starter kit, then copy BUILD.md again._") } : f));
  }, [kit, generated, tailoring]);
  const tools = kit.tools;

  const tailor = async () => {
    if (!AI_ENABLED) return;
    request.current?.abort();
    const ctl = new AbortController();
    request.current = ctl;
    setTailoring({ state: "working" });
    try {
      const res = await fetch("./api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: effectiveAnswers(answers) }),
        signal: ctl.signal,
      });
      const data = (await res.json().catch(() => ({}))) as { workflow?: unknown; model?: string; error?: string; problems?: string[] };
      if (!res.ok || !data.workflow) {
        setTailoring({
          state: "error",
          message: res.status === 404 ? "AI tailoring isn't available on this copy of the site." : data.error ?? "Tailoring failed.",
          problems: data.problems,
        });
        return;
      }
      const done = { content: JSON.stringify(data.workflow, null, 2), model: data.model ?? "AI" };
      setTailoring({ state: "done", ...done });
      if (generated) saveTailored(answers, generated, done);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setTailoring({ state: "error", message: "Couldn't reach the tailoring service." });
    }
  };
  // Built in the background after the survey: tailor once the kit's text is settled, as the button would.
  useEffect(() => {
    if (autoTailor && AI_ENABLED && generated && tailoring.state === "idle" && writing && writing !== "loading") void tailor();
  }, [autoTailor, generated, tailoring.state, writing]); // eslint-disable-line react-hooks/exhaustive-deps -- tailor reads the latest kit itself

  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  // Which illustrated walkthrough is open, if any.
  const [guide, setGuide] = useState<"build" | "n8n" | "hermes" | "plugin" | null>(null);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelId = useId();

  // The file preview is a modal dialog, so it never takes room on the page.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      tabRefs.current[active]?.focus();
    } else if (!open && d.open) d.close();
  }, [open]);
  const brief = files[0];
  const current = files[active];

  // BUILD.md on its own, opened from the Build view's subtitle.
  const [briefOpen, setBriefOpen] = useState(false);
  const briefRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = briefRef.current;
    if (!d) return;
    if (briefOpen && !d.open) d.showModal();
    else if (!briefOpen && d.open) d.close();
  }, [briefOpen]);

  const flash = (key: string) => {
    setCopied(key);
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
  };

  const downloadAll = async () => {
    // The zip code is loaded on demand, so it only ships to people who use it.
    download(`${slug}-starter-kit.zip`, (await zipFiles(files, "", `${slug}/`)) as BlobPart, "application/zip");
  };

  const n8nTool = tools.find((t): t is KitTool & { action: { kind: "copy" } } => t.id === "n8n" && t.action.kind === "copy");
  const hermesTool = tools.find((t) => t.id === "hermes");
  const pluginTool = tools.find((t) => t.id === "claude-plugin");

  const runTool = async (t: KitTool) => {
    const a = t.action;
    if (a.kind === "copy") {
      await copyText(files.find((f) => f.path === a.path)!.content);
      flash(t.id);
    } else if (a.kind === "download") {
      const f = files.find((x) => x.path === a.path)!;
      download(f.path.split("/").pop()!, f.content, MIME[f.lang]);
    } else {
      const part = files.filter((f) => f.path.startsWith(a.prefix));
      download(a.filename, (await zipFiles(part, a.prefix)) as BlobPart, "application/zip");
    }
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = files.length - 1;
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? (i === last ? 0 : i + 1) : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const toolList = tools.length > 0 && (
    <ul aria-label="Ready to use in your tools" className={`grid gap-2 ${rail ? "" : tools.length > 1 ? "md:grid-cols-2" : ""}`}>
      {tools.map((t) => {
        const Icon = TOOL_ICON[t.id];
        const done = copied === t.id;
        // With AI tailoring, the n8n copy button lives with the tailoring controls and appears once there is a workflow.
        const tailored = AI_ENABLED && t.id === "n8n";
        const action = (
          <button
            type="button"
            // The tailored n8n copy button gets its own full-width row, centred like Copy BUILD.md.
            className={`${btn.small} shrink-0 bg-surface px-3 py-1.5 text-[13px] ${tailored ? "w-full justify-center" : ""}`}
            onClick={() => runTool(t)}
          >
            {done ? <Check size={14} weight="bold" aria-hidden /> : t.action.kind === "copy" ? <Copy size={14} aria-hidden /> : <DownloadSimple size={14} aria-hidden />}
            {done ? "Copied" : t.action.label}
          </button>
        );
        return (
          <li key={t.id} className="rounded-xl bg-surface-2/70 p-3">
            <div className="flex items-center gap-2.5">
              <Icon size={17} aria-hidden className="shrink-0 text-accent" />
              <p className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-ink">{t.name}</p>
              {!tailored && action}
            </div>
            {t.id === "n8n" && tailoring.state === "done" && (
              <span className="mt-2 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-accent">Tailored by {tailoring.model}</span>
            )}
            {(!tailored || tailoring.state === "done") && <Instructions className="mt-1.5">{t.how}</Instructions>}
            {tailored && <TailorControls tailoring={tailoring} copy={action} onTailor={tailor} waiting={writing === "loading"} />}
            {GUIDE_FOR[t.id] && (
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setGuide(GUIDE_FOR[t.id]!.guide)}
                className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold italic text-accent underline-offset-4 hover:underline"
              >
                <PlayCircle size={14} weight="fill" aria-hidden />
                {GUIDE_FOR[t.id]!.label}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );

  const copyBrief = () => copyText(brief.content).then(() => flash("brief"));

  const actions = (
    <div className={rail ? "grid gap-2" : "flex flex-wrap items-center gap-2"}>
      <button type="button" className={`${btn.primarySmall} ${rail ? "w-full" : ""}`} onClick={copyBrief}>
        {copied === "brief" ? <Check size={16} weight="bold" aria-hidden /> : <Copy size={16} aria-hidden />}
        {copied === "brief" ? "Copied" : "Copy BUILD.md"}
      </button>
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-bold italic text-accent transition-colors duration-200 hover:bg-surface-2" aria-haspopup="dialog" onClick={() => setGuide("build")}>
          <PlayCircle size={16} weight="fill" aria-hidden />
          Walk me through building it
        </button>
        <button type="button" className={btn.quiet} onClick={downloadAll}>
          <DownloadSimple size={16} aria-hidden />
          Download all
        </button>
        <button type="button" className={btn.quiet} aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <Eye size={16} aria-hidden />
          Preview files
        </button>
      </div>
    </div>
  );

  const overlays = (
    <>
      <p className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </p>

      <BuildGuide
        open={guide === "build"}
        onClose={() => setGuide(null)}
        slug={slug}
        files={files}
        copied={copied === "brief"}
        onCopyBrief={copyBrief}
        onDownloadAll={downloadAll}
      />
      {hermesTool && (
        <HermesGuide open={guide === "hermes"} onClose={() => setGuide(null)} slug={slug} files={files} onDownload={() => runTool(hermesTool)} />
      )}
      {pluginTool && (
        <ClaudePluginGuide open={guide === "plugin"} onClose={() => setGuide(null)} slug={slug} files={files} onDownload={() => runTool(pluginTool)} />
      )}
      {n8nTool && generated && (
        <N8nGuide
          open={guide === "n8n"}
          onClose={() => setGuide(null)}
          files={files}
          workflow={tailoring.state === "done" ? tailoring.content : generated}
          ready={files.some((f) => f.path === n8nTool.action.path)}
          copied={copied === "n8n"}
          onCopy={() => runTool(n8nTool)}
          tailoring={tailoring.state === "working"}
          onTailor={tailor}
        />
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={`${panelId}-title`}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className="m-auto h-[min(760px,88vh)] w-[min(1080px,calc(100%-2rem))] max-w-none overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
            <h2 id={`${panelId}-title`} className="text-[15.5px] font-semibold text-ink">
              Starter kit files
            </h2>
            <button type="button" className={btn.quiet} onClick={() => setOpen(false)}>
              <X size={16} aria-hidden />
              Close
            </button>
          </div>
          <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[250px_minmax(0,1fr)] md:grid-rows-1">
            <div
              role="tablist"
              aria-label="Starter kit files"
              aria-orientation="vertical"
              className="flex gap-1 overflow-x-auto border-b border-line p-2 md:flex-col md:overflow-y-auto md:overflow-x-visible md:border-b-0 md:border-r"
            >
              {files.map((f, i) => {
                const Icon = f.lang === "markdown" ? FileText : FileCode;
                const on = i === active;
                return (
                  <button
                    key={f.path}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`${panelId}-tab-${i}`}
                    aria-selected={on}
                    aria-controls={`${panelId}-file`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setActive(i)}
                    onKeyDown={(e) => onTabKey(e, i)}
                    className={`flex shrink-0 items-start gap-2 rounded-xl px-3 py-2 text-left transition-colors md:w-full ${on ? "bg-accent-soft" : "hover:bg-surface-2"}`}
                  >
                    <Icon size={15} aria-hidden className={`mt-0.5 shrink-0 ${on ? "text-accent" : "text-muted"}`} />
                    <span className="min-w-0">
                      <span className="block whitespace-nowrap font-mono text-[12.5px] text-ink md:whitespace-normal md:break-all">{f.path}</span>
                      <span className="hidden text-[12px] leading-snug text-muted md:block">{f.purpose}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div role="tabpanel" id={`${panelId}-file`} aria-labelledby={`${panelId}-tab-${active}`} className="flex min-h-0 min-w-0 flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
                <p className="min-w-0 text-[13px] text-muted">
                  <span className="font-mono text-ink">{current.path}</span>
                  <span className="md:hidden"> {current.purpose}</span>
                </p>
                <div className="flex gap-1.5">
                  <button type="button" className={btn.quiet} onClick={() => copyText(current.content).then(() => flash(current.path))} aria-label={`Copy ${current.path}`}>
                    {copied === current.path ? <Check size={15} weight="bold" aria-hidden /> : <Copy size={15} aria-hidden />}
                    {copied === current.path ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    className={btn.quiet}
                    onClick={() => download(current.path.split("/").pop()!, current.content, MIME[current.lang])}
                    aria-label={`Download ${current.path}`}
                  >
                    <DownloadSimple size={15} aria-hidden />
                    Download
                  </button>
                </div>
              </div>
              <pre tabIndex={0} aria-label={`Contents of ${current.path}`} className="min-h-0 flex-1 overflow-auto bg-surface-2/50 px-4 py-3.5 font-mono text-[12.5px] leading-relaxed text-ink">
                <code>{current.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );

  // The Build view of the result workspace: the same kit, set out as numbered build steps.
  if (studio) {
    return (
      <section aria-labelledby="kit-title" className="no-print">
        <div className="section-kicker studio-caption">Your build brief</div>
        <div className="section-heading">
          <div className="min-w-0">
            <h1 id="kit-title">
              Build your solution<span className="title-period">.</span>
            </h1>
            <p>
              Build it with an AI coding assistant.{" "}
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setBriefOpen(true)}
                className="font-mono text-[13.5px] text-ink decoration-dotted underline-offset-4 hover:text-accent hover:underline focus-visible:underline"
              >
                BUILD.md
              </button>{" "}
              brings your plan together.
            </p>
            {AI_ENABLED && writing && writing !== "template" && (
              <p role="status" aria-live="polite" className="mt-2 flex items-start gap-1.5 text-[13.5px] leading-snug text-muted">
                {writing === "loading" ? (
                  <CircleNotch size={14} aria-hidden className={`mt-0.5 shrink-0 text-accent ${reduce ? "" : "animate-spin"}`} />
                ) : (
                  <Sparkle size={14} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-accent" />
                )}
                {writing === "loading" ? "Writing the kit's text for your task." : "Prompts, notes and test cases written for your task by AI, checked against the design."}
              </p>
            )}
          </div>
        </div>

        <ol className="build-checklist" aria-label="Build steps">
          <li className="build-item">
            <span className="step-number">01</span>
            <div className="build-item-text">
              <h3>Build it with an AI coding assistant</h3>
              <p>Paste BUILD.md into Claude Code, Codex or any AI assistant. It explains each step and asks before it creates files, spends money or sends anything.</p>
            </div>
            <div className="build-item-actions">
              <button type="button" className="studio-quiet" aria-haspopup="dialog" onClick={() => setGuide("build")}>
                Walk me through it
                <PlayCircle size={16} aria-hidden />
              </button>
              <button type="button" className="studio-quiet" onClick={downloadAll}>
                Download all
                <DownloadSimple size={16} aria-hidden />
              </button>
            </div>
          </li>
          {tools.map((t, i) => {
            const done = copied === t.id;
            const tailored = AI_ENABLED && t.id === "n8n";
            const action = (
              <button type="button" className={tailored ? `${btn.small} w-full justify-center bg-surface px-3 py-1.5 text-[13px]` : "studio-quiet"} onClick={() => runTool(t)}>
                {done ? "Copied" : t.action.label}
                {done ? <Check size={15} weight="bold" aria-hidden /> : t.action.kind === "copy" ? <Copy size={15} aria-hidden /> : <DownloadSimple size={15} aria-hidden />}
              </button>
            );
            return (
              <li key={t.id} className="build-item">
                <span className="step-number">{String(i + 2).padStart(2, "0")}</span>
                <div className="build-item-text">
                  <h3>{t.name}</h3>
                  {t.id === "n8n" && tailoring.state === "done" && (
                    <span className="mb-1.5 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-medium text-accent">Tailored by {tailoring.model}</span>
                  )}
                  {(!tailored || tailoring.state === "done") && <p>{t.how}</p>}
                  {tailored && <TailorControls tailoring={tailoring} copy={action} onTailor={tailor} waiting={writing === "loading"} />}
                </div>
                <div className="build-item-actions">
                  {!tailored && action}
                  {GUIDE_FOR[t.id] && (
                    <button type="button" className="studio-quiet" aria-haspopup="dialog" onClick={() => setGuide(GUIDE_FOR[t.id]!.guide)}>
                      {GUIDE_FOR[t.id]!.label}
                      <PlayCircle size={16} aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="build-detail">
          <h2>A brief with the details that matter</h2>
          <p>
            The steps, models and safeguards of your design, the standing brief for every AI step, and a test set to check it against: {files.length} files in all. Add your
            provider keys yourself, in the tool's own settings, never in chat.
          </p>
          <div className="build-detail-actions">
            <button type="button" className="studio-outline" aria-haspopup="dialog" onClick={() => setOpen(true)}>
              <FileText size={18} aria-hidden />
              Preview files
            </button>
          </div>
        </div>
        {overlays}
        <dialog
          ref={briefRef}
          aria-labelledby={`${panelId}-brief`}
          onClose={() => setBriefOpen(false)}
          onClick={(e) => e.target === e.currentTarget && setBriefOpen(false)}
          className="m-auto h-[min(760px,88vh)] w-[min(900px,calc(100%-2rem))] max-w-none overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
              <div className="min-w-0">
                <h2 id={`${panelId}-brief`} className="font-mono text-[15px] font-semibold text-ink">
                  BUILD.md
                </h2>
                <p className="text-[13px] text-muted">Paste it into Claude Code, Codex or any AI assistant.</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button type="button" className="studio-outline" onClick={copyBrief}>
                  {copied === "brief" ? <Check size={18} weight="bold" aria-hidden /> : <Copy size={18} aria-hidden />}
                  {copied === "brief" ? "Copied" : "Copy"}
                </button>
                <button type="button" className={btn.quiet} onClick={() => setBriefOpen(false)} aria-label="Close">
                  <X size={16} aria-hidden />
                </button>
              </div>
            </div>
            <pre tabIndex={0} aria-label="Contents of BUILD.md" className="min-h-0 flex-1 overflow-auto bg-surface-2/50 px-5 py-4 font-mono text-[12.5px] leading-relaxed text-ink">
              <code>{brief.content}</code>
            </pre>
          </div>
        </dialog>
      </section>
    );
  }

  return (
    <m.section
      aria-labelledby="kit-title"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`no-print shadow-soft overflow-hidden rounded-2xl border border-line bg-surface ${rail ? "sticky top-20 mouse:top-16" : ""}`}
    >
      <div className={rail ? "bg-accent-soft/70 px-4 pb-4 pt-5" : "flex flex-wrap items-center justify-between gap-x-8 gap-y-3 bg-accent-soft/70 px-5 py-4 sm:px-6"}>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-accent">
            <Terminal size={14} weight="bold" aria-hidden />
            Start building
          </p>
          <h2 id="kit-title" className="mt-1 text-[1.125rem] font-semibold leading-snug tracking-tight text-ink">
            Build it with an AI coding assistant
          </h2>
          <Instructions className="mt-1.5">
            Paste <span className="font-mono text-[12.5px] text-ink">BUILD.md</span> into Claude Code, Codex or any AI assistant.
          </Instructions>
          {AI_ENABLED && writing && writing !== "template" && (
            <p role="status" aria-live="polite" className="mt-1.5 flex items-start gap-1.5 text-[12.5px] leading-snug text-muted">
              {writing === "loading" ? (
                <CircleNotch size={13} aria-hidden className={`mt-0.5 shrink-0 text-accent ${reduce ? "" : "animate-spin"}`} />
              ) : (
                <Sparkle size={13} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-accent" />
              )}
              {writing === "loading" ? "Writing the kit's text for your task." : "Prompts, notes and test cases written for your task by AI, checked against the design."}
            </p>
          )}
        </div>
        <div className={rail ? "mt-4" : ""}>{actions}</div>
      </div>
      {toolList && <div className={`border-t border-line ${rail ? "p-3" : "p-3 sm:px-4"}`}>{toolList}</div>}
      {overlays}
    </m.section>
  );
}

/** How-to text, folded away under an "Instructions" toggle so the panel stays short. */
function Instructions({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <details className={`group ${className}`}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[14px] font-normal italic text-ink [&::-webkit-details-marker]:hidden">
        Instructions
        <CaretDown size={14} aria-hidden className="text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{children}</p>
    </details>
  );
}

function TailorControls({
  tailoring,
  copy,
  onTailor,
  waiting,
}: {
  tailoring: Tailoring;
  /** The copy button, shown once the workflow is tailored. */
  copy: ReactNode;
  onTailor: () => void;
  /** True while the kit's text is still being written; tailoring waits so both describe the same workflow. */
  waiting?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="mt-2.5">
      {tailoring.state === "done" ? (
        copy
      ) : (
        <button
          type="button"
          onClick={onTailor}
          disabled={tailoring.state === "working" || waiting}
          className="inline-flex items-center gap-1.5 rounded-full px-0 py-1 text-[13px] font-medium text-accent underline-offset-4 hover:underline disabled:no-underline disabled:opacity-80"
        >
          {tailoring.state === "working" ? (
            <CircleNotch size={14} aria-hidden className={reduce ? "" : "animate-spin"} />
          ) : (
            <Sparkle size={14} weight="fill" aria-hidden />
          )}
          {tailoring.state === "working" ? "Tailoring to your task. This can take a few minutes." : "Tailor with AI"}
        </button>
      )}
      {tailoring.state !== "done" && <p className="mt-1 text-[12px] leading-snug text-muted">Sends your task and answers to OpenAI through this site's server.</p>}
      <p role="status" aria-live="polite" className="sr-only">
        {tailoring.state === "working" ? "Tailoring the workflow" : tailoring.state === "done" ? "Tailored workflow ready" : ""}
      </p>
      {tailoring.state === "error" && (
        <div role="alert" className="mt-1.5 text-[12.5px] leading-snug text-ink">
          {tailoring.message}
          {tailoring.problems && tailoring.problems.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-muted">
              {tailoring.problems.slice(0, 3).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
