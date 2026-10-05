import { Check, CircleNotch, Copy, DownloadSimple, Eye, FileCode, FileText, FlowArrow, Package, Robot, Sparkle, Terminal, TreeStructure, X } from "@phosphor-icons/react";
import { m, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AI_TAILORING } from "../lib/features";
import { type Answers, effectiveAnswers } from "../lib/questions";
import type { Kit, KitFile, KitTool } from "../lib/starter";
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

type Tailoring =
  | { state: "idle" }
  | { state: "working" }
  | { state: "done"; content: string; model: string; using: "ai" | "generated" }
  | { state: "error"; message: string; problems?: string[] };

/** `rail`: a slim column beside the diagram. Otherwise a short strip under it. */
export function StarterKit({ kit, slug, answers, rail = false }: { kit: Kit; slug: string; answers: Answers; rail?: boolean }) {
  const [tailoring, setTailoring] = useState<Tailoring>({ state: "idle" });
  const request = useRef<AbortController | null>(null);

  // A new design starts from its generated files again.
  useEffect(() => {
    request.current?.abort();
    setTailoring({ state: "idle" });
  }, [kit]);
  useEffect(() => () => request.current?.abort(), []);

  // When the AI version is in use, it replaces the generated workflow everywhere, including inside BUILD.md.
  const files = useMemo(() => {
    if (tailoring.state !== "done" || tailoring.using !== "ai") return kit.files;
    const original = kit.files.find((f) => f.path === "n8n/workflow.json")?.content;
    if (!original) return kit.files;
    return kit.files.map((f) =>
      f.path === "n8n/workflow.json" ? { ...f, content: tailoring.content } : f.path === "BUILD.md" ? { ...f, content: f.content.replace(original, tailoring.content) } : f,
    );
  }, [kit, tailoring]);
  const tools = kit.tools;

  const tailor = async () => {
    if (!AI_TAILORING) return;
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
      setTailoring({ state: "done", content: JSON.stringify(data.workflow, null, 2), model: data.model ?? "AI", using: "ai" });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setTailoring({ state: "error", message: "Couldn't reach the tailoring service." });
    }
  };
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
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

  const flash = (key: string) => {
    setCopied(key);
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
  };

  const downloadAll = async () => {
    // The zip code is loaded on demand, so it only ships to people who use it.
    download(`${slug}-starter-kit.zip`, (await zipFiles(files, "", `${slug}/`)) as BlobPart, "application/zip");
  };

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
        return (
          <li key={t.id} className="rounded-xl bg-surface-2/70 p-3">
            <div className="flex items-center gap-2.5">
              <Icon size={17} aria-hidden className="shrink-0 text-accent" />
              <p className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-ink">{t.name}</p>
              <button type="button" className={`${btn.small} shrink-0 bg-surface px-3 py-1.5 text-[13px]`} onClick={() => runTool(t)}>
                {done ? <Check size={14} weight="bold" aria-hidden /> : t.action.kind === "copy" ? <Copy size={14} aria-hidden /> : <DownloadSimple size={14} aria-hidden />}
                {done ? "Copied" : t.action.label}
              </button>
            </div>
            {t.id === "n8n" && tailoring.state === "done" && tailoring.using === "ai" && (
              <span className="mt-2 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-accent">Tailored by {tailoring.model}</span>
            )}
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t.how}</p>
            {AI_TAILORING && t.id === "n8n" && <TailorControls tailoring={tailoring} onTailor={tailor} onUse={(using) => tailoring.state === "done" && setTailoring({ ...tailoring, using })} />}
          </li>
        );
      })}
    </ul>
  );

  const actions = (
    <div className={rail ? "grid gap-2" : "flex flex-wrap items-center gap-2"}>
      <button type="button" className={`${btn.primarySmall} ${rail ? "w-full" : ""}`} onClick={() => copyText(brief.content).then(() => flash("brief"))}>
        {copied === "brief" ? <Check size={16} weight="bold" aria-hidden /> : <Copy size={16} aria-hidden />}
        {copied === "brief" ? "Copied" : "Copy BUILD.md"}
      </button>
      <div className="flex flex-wrap items-center gap-1">
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
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
            Paste <span className="font-mono text-[12.5px] text-ink">BUILD.md</span> into Claude Code, Codex or any AI assistant. It holds the plan
            and all {files.length - 1} other files.
          </p>
        </div>
        <div className={rail ? "mt-4" : ""}>{actions}</div>
      </div>
      {toolList && <div className={`border-t border-line ${rail ? "p-3" : "p-3 sm:px-4"}`}>{toolList}</div>}
      <p className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </p>

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
    </m.section>
  );
}

function TailorControls({
  tailoring,
  onTailor,
  onUse,
}: {
  tailoring: Tailoring;
  onTailor: () => void;
  onUse: (using: "ai" | "generated") => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="mt-2.5">
      {tailoring.state === "done" ? (
        <div role="group" aria-label="Which workflow to use" className="inline-flex rounded-full bg-surface p-0.5 ring-1 ring-line">
          {(["ai", "generated"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={tailoring.using === v}
              onClick={() => onUse(v)}
              className={`rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors ${tailoring.using === v ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"}`}
            >
              {v === "ai" ? "AI-tailored" : "Generated"}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={onTailor}
          disabled={tailoring.state === "working"}
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
      <p className="mt-1 text-[12px] leading-snug text-muted">
        {tailoring.state === "done" ? "Checked before use: every step, branch and model is still there." : "Sends your task and answers to OpenAI through this site's server."}
      </p>
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
