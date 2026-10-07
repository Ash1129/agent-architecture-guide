import { Check, Copy, DownloadSimple, FileZip, Folder, PlayCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { KitFile } from "../lib/starter";
import { ACCENT, BrowserFrame, Desktop, DOCK, Lights, MONO, VideoPlayer, ease, seg, typed, type Clicks, type Keys, type Path, type Section } from "./recording";

// A scripted "screen recording" of going from the starter kit to Claude Code:
// download the kit, open BUILD.md and copy it, minimise the browser, unzip, open Terminal,
// start Claude Code, paste and approve the first step. It shows this person's
// own folder, file names and task.

const SECONDS = 24.5;

/** Where each section ends; the index matches the guide's step cards. */
const SECTIONS: Section[] = [
  { until: 9.7, caption: "Download the kit, copy BUILD.md, then unzip the kit" },
  { until: 14.2, caption: "Open Terminal, go into the folder and start Claude Code" },
  { until: 16.0, caption: "Paste BUILD.md and press Enter" },
  { until: Infinity, caption: "Claude explains each step and asks before it acts" },
];

/**
 * Stage coordinates of the controls on SitePage, for the recordings' cursors.
 * The page is laid out at fixed positions inside the browser window (which
 * sits at 70, 40 on the stage), so these stay exact.
 */
export const SITE = {
  downloadAll: [823, 265],
  buildLink: [450, 209],
  briefCopy: [598, 170],
  toolAction: [821, 325],
} as const;

// Stage coordinates of everything the cursor touches.
const AT = {
  rest: [480, 420],
  download: SITE.downloadAll,
  brief: SITE.buildLink,
  copy: SITE.briefCopy,
  minimise: [104, 57],
  finder: DOCK.finder,
  zip: [372, 160],
  terminal: DOCK.terminal,
  aside: [930, 470],
} as const;

const PATH: Path = [
  [0, AT.rest],
  [0.6, AT.rest],
  [1.5, AT.download],
  [2.0, AT.download],
  [2.6, AT.brief],
  [2.9, AT.brief],
  [3.4, AT.copy],
  [3.9, AT.copy],
  [4.6, AT.minimise],
  [5.6, AT.minimise],
  [6.4, AT.finder],
  [7.2, AT.finder],
  [7.8, AT.zip],
  [8.8, AT.zip],
  [9.6, AT.terminal],
  [10.0, AT.terminal],
  [10.6, AT.aside],
];

const CLICKS: Clicks = [
  [1.6, AT.download],
  [2.7, AT.brief],
  [3.45, AT.copy],
  [4.7, AT.minimise],
  [6.5, AT.finder],
  [7.9, AT.zip],
  [8.05, AT.zip],
  [9.7, AT.terminal],
];

const KEYS: Keys = [
  [3.95, "esc"],
  [12.4, "⏎ Return"],
  [13.5, "⏎ Return"],
  [14.6, "⌘ V"],
  [15.6, "⏎ Return"],
  [20.6, "⏎ Return"],
];

export function BuildVideo({ slug, files, onSection }: { slug: string; files: KitFile[]; onSection?: (i: number) => void }) {
  const task = taskOf(files);
  const lines = files[0]?.content.split("\n").length ?? 0;
  const file = files[1]?.path ?? "README.md";

  return (
    <VideoPlayer
      seconds={SECONDS}
      sections={SECTIONS}
      onSection={onSection}
      description={`A screen recording: on this page's Build view, Download all is clicked, BUILD.md is clicked to open it and its Copy button is pressed, and the browser is minimised. In Finder the kit is unzipped into the folder ${slug}. In Terminal, cd ~/Downloads/${slug} and claude are typed, BUILD.md is pasted and Return pressed, and Claude asks to create ${file}, which is approved.`}
    >
      {(t) => (
        <Desktop t={t} front={t < 5.5 ? "Browser" : t < 9.75 ? "Finder" : "Terminal"} path={PATH} clicks={CLICKS} keys={KEYS} opened={{ finder: 6.5, terminal: 9.7 }}>
          <BrowserWindow t={t} slug={slug} task={task} brief={files[0]?.content.split("\n").slice(0, 14) ?? []} />
          <FinderWindow t={t} slug={slug} />
          <TerminalApp t={t} slug={slug} task={task} file={file} lines={lines} />
        </Desktop>
      )}
    </VideoPlayer>
  );
}

export const taskOf = (files: KitFile[]) => files[0]?.content.match(/^# Build brief: (.+)$/m)?.[1] ?? "your task";

export const SITE_TAB = { title: "Your result | Agent Architecture Guide", color: ACCENT };


const SERIF = "'Instrument Serif', ui-serif, Georgia, serif";
const SANS = "'Work Sans Variable', ui-sans-serif, system-ui, sans-serif";
const HAIR = "rgba(19,32,27,0.09)";

/**
 * This site's result page as it sits in the browser window: the blueprint
 * workspace on its Build view, with the starter kit's build steps. `hermes`
 * shows the Hermes Agent step in place of n8n's; `brief` opens the BUILD.md
 * pop-up.
 */
export function SitePage({
  task,
  downloaded = false,
  brief,
  copiedN8n = false,
  hermes,
  plugin,
}: {
  task: string;
  downloaded?: boolean;
  brief?: { open: boolean; copied: boolean; lines: string[] };
  copiedN8n?: boolean;
  hermes?: { downloaded: boolean };
  plugin?: { downloaded: boolean };
}) {
  const action = (top: number, label: ReactNode, icon: ReactNode, on = false) => (
    <span className="absolute flex items-center gap-1 text-[9.5px] font-medium" style={{ right: 32, top, color: ACCENT, fontWeight: on ? 600 : 500 }}>
      {label}
      {icon}
    </span>
  );
  return (
    <div className="absolute inset-x-0 bottom-0 top-[66px] bg-[#f3f5f4]" style={{ fontFamily: SANS }}>
      {/* Sidebar */}
      <div className="absolute left-0 top-0 h-full w-[150px]" style={{ borderRight: `1px solid ${HAIR}` }}>
        <span className="absolute left-[14px] top-[14px] grid size-[22px] place-items-center rounded-[4px]" style={{ background: ACCENT }}>
          <span className="size-[9px] rounded-[2px] border-2 border-white" />
        </span>
        <span className="absolute left-[42px] top-[12px] text-[17px] leading-none text-[#13201b]" style={{ fontFamily: SERIF }}>
          blueprint
        </span>
        <span className="absolute left-[42px] top-[30px] text-[5px] tracking-[0.06em] text-[#7f8d87]">YOUR SOLUTION STUDIO</span>
        <span className="absolute left-[14px] top-[56px] text-[6px] tracking-[0.06em] text-[#7f8d87]">YOUR WORKSPACE</span>
        {["Solution", "Build", "Workflow"].map((label, i) => (
          <span
            key={label}
            className="absolute left-[10px] flex h-[22px] w-[130px] items-center rounded-[5px] px-[8px] text-[9.5px]"
            style={{ top: 68 + i * 26, background: label === "Build" ? "#e1ede7" : "transparent", color: label === "Build" ? ACCENT : "#4d5b55", fontWeight: label === "Build" ? 500 : 400 }}
          >
            {label}
            {label === "Build" && <span className="ml-auto size-[3px] rounded-full" style={{ background: ACCENT }} />}
          </span>
        ))}
        <span className="absolute left-[14px] top-[262px] w-[120px] text-[11px] leading-[1.3] text-[#4d5b55]" style={{ fontFamily: SERIF }}>
          A considered path from request to working system.
        </span>
      </div>

      {/* Facts strip */}
      <div className="absolute left-[150px] right-0 top-0 flex h-[34px] items-center gap-[22px] px-[30px]" style={{ borderBottom: `1px solid ${HAIR}` }}>
        {["Agents", "Model", "Main tool", "Autonomy", "Runs on"].map((label) => (
          <span key={label} className="flex flex-col gap-[3px]">
            <span className="text-[6px] text-[#7f8d87]">{label}</span>
            <span className="h-[5px] w-[70px] rounded bg-[#13201b]/25" />
          </span>
        ))}
      </div>

      {/* Build view: heading */}
      <span className="absolute left-[180px] top-[48px] text-[6px] tracking-[0.06em] text-[#7f8d87]">YOUR BUILD BRIEF · {task.toUpperCase()}</span>
      <span className="absolute left-[180px] top-[58px] text-[28px] leading-none text-[#13201b]" style={{ fontFamily: SERIF }}>
        Build your solution<span style={{ color: ACCENT }}>.</span>
      </span>
      <span className="absolute left-[180px] top-[96px] whitespace-nowrap text-[10px] text-[#4d5b55]">
        Build it with an AI coding assistant.
      </span>
      <span
        className="absolute left-[357px] top-[96px] font-mono text-[9.5px] text-[#13201b]"
        style={{ textDecoration: brief?.open ? "underline dotted" : undefined, color: brief?.open ? ACCENT : undefined, textUnderlineOffset: 3 }}
      >
        BUILD.md
      </span>
      <span className="absolute left-[408px] top-[96px] whitespace-nowrap text-[10px] text-[#4d5b55]">brings your plan together.</span>

      {/* Build steps */}
      {[
        { n: "01", title: "Build it with an AI coding assistant", body: "Paste BUILD.md into Claude Code, Codex or any AI assistant. It explains each step and asks before it acts.", top: 120 },
        hermes
          ? { n: "02", title: "Hermes Agent setup", body: "Unzip, read setup.sh, then run it. It installs the skill and persona into ~/.hermes.", top: 200 }
          : plugin
            ? { n: "02", title: "Claude plugin", body: "Drag the .plugin into a Claude chat and press Install. In Claude Code, copy its skills folder.", top: 200 }
            : { n: "02", title: "n8n workflow", body: "Open a new workflow in n8n and press Cmd+V. Then add your credentials to the highlighted nodes.", top: 200 },
      ].map((item) => (
        <div key={item.n} className="absolute left-[180px] h-[70px] w-[620px] rounded-[8px] bg-white" style={{ top: item.top, border: `1px solid ${HAIR}` }}>
          <span className="absolute left-[14px] top-[12px] grid size-[18px] place-items-center rounded-full border border-[#d6ddd9] text-[6.5px] text-[#7f8d87]">{item.n}</span>
          <span className="absolute left-[44px] top-[13px] text-[10.5px] font-medium text-[#13201b]">{item.title}</span>
          <span className="absolute left-[44px] top-[30px] w-[380px] text-[8.5px] leading-[1.45] text-[#4d5b55]">{item.body}</span>
        </div>
      ))}
      {action(133, "Walk me through it", <PlayCircle size={10} />)}
      {action(153, "Download all", downloaded ? <Check size={10} weight="bold" /> : <DownloadSimple size={10} />, downloaded)}
      {hermes
        ? action(213, "Download setup", hermes.downloaded ? <Check size={10} weight="bold" /> : <DownloadSimple size={10} />, hermes.downloaded)
        : plugin
          ? action(213, "Download .plugin", plugin.downloaded ? <Check size={10} weight="bold" /> : <DownloadSimple size={10} />, plugin.downloaded)
          : action(213, copiedN8n ? "Copied" : "Copy for n8n", copiedN8n ? <Check size={10} weight="bold" /> : <Copy size={10} />, copiedN8n)}
      {action(233, hermes ? "Walk me through Hermes" : plugin ? "Walk me through the plugin" : "Walk me through n8n", <PlayCircle size={10} />)}

      {/* The BUILD.md pop-up */}
      {brief?.open && (
        <>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute overflow-hidden rounded-[10px] bg-white shadow-2xl" style={{ left: 250, top: 46, width: 360, height: 240, border: `1px solid ${HAIR}` }}>
            <div className="flex h-[34px] items-center px-[14px]" style={{ borderBottom: `1px solid ${HAIR}` }}>
              <span className="font-mono text-[10px] font-semibold text-[#13201b]">BUILD.md</span>
              <span
                className="absolute flex h-[22px] w-[72px] items-center justify-center gap-1 rounded-[6px] bg-white text-[9px] font-medium text-[#13201b]"
                style={{ right: 46, top: 6, border: "1px solid #d6ddd9" }}
              >
                {brief.copied ? <Check size={10} weight="bold" /> : <Copy size={10} />}
                {brief.copied ? "Copied" : "Copy"}
              </span>
              <span className="absolute right-[16px] top-[10px] text-[10px] text-[#4d5b55]">✕</span>
            </div>
            <div className="h-full space-y-[3px] bg-[#f3f5f4]/60 px-[14px] py-[10px] font-mono text-[7.5px] leading-[1.4] text-[#13201b]">
              {brief.lines.map((l, i) => (
                <p key={i} className="truncate">
                  {l || " "}
                </p>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BrowserWindow({ t, slug, task, brief }: { t: number; slug: string; task: string; brief: string[] }) {
  // Minimising: the window shrinks into the browser's dock icon.
  const m = ease(seg(t, 4.75, 5.45));
  if (t > 5.5) return null;
  const bubble = t >= 1.8 && t < 2.7;

  return (
    <BrowserFrame
      tabs={[SITE_TAB]}
      active={0}
      address="Agent Architecture Guide / your result"
      toolbar={<DownloadSimple size={16} weight={t >= 1.8 ? "bold" : "regular"} color={t >= 1.8 ? ACCENT : "#4d5b55"} />}
      style={{ transform: `translate(${-48 * m}px, ${244 * m}px) scale(${1 - 0.95 * m})`, opacity: 1 - seg(t, 5.2, 5.5) }}
    >
      <SitePage task={task} downloaded={t >= 1.65} brief={{ open: t >= 2.75 && t < 4.0, copied: t >= 3.5, lines: brief }} />
      {bubble && (
        <div
          className="absolute right-[10px] top-[60px] flex w-[270px] items-center gap-2.5 rounded-xl border border-black/10 bg-white p-3 shadow-xl"
          style={{ opacity: seg(t, 1.8, 2.0) * (1 - seg(t, 2.5, 2.7)) }}
        >
          <FileZip size={26} color={ACCENT} />
          <span className="min-w-0">
            <span className="block truncate text-[11.5px] font-medium text-[#13201b]">{slug}-starter-kit.zip</span>
            <span className="text-[10.5px] text-[#4d5b55]">Done · saved to Downloads</span>
          </span>
        </div>
      )}
    </BrowserFrame>
  );
}

function FinderWindow({ t, slug }: { t: number; slug: string }) {
  if (t < 6.55) return null;
  const p = ease(seg(t, 6.55, 6.95));
  const selected = t >= 7.9;
  const unzipped = seg(t, 8.2, 8.5);
  const Label = ({ on, children }: { on: boolean; children: ReactNode }) => (
    <span className={`mt-1 line-clamp-2 w-[96px] break-all rounded px-1 text-center text-[10px] leading-tight ${on ? "bg-[#2f6fde] text-white" : "text-[#13201b]"}`}>{children}</span>
  );
  return (
    <div
      className="absolute overflow-hidden rounded-xl border border-black/20 bg-white shadow-2xl"
      style={{ left: 170, top: 64, width: 520, height: 300, opacity: p, transform: `scale(${0.92 + 0.08 * p})` }}
    >
      <div className="flex h-[30px] items-center gap-4 border-b border-black/10 bg-[#eef1ef] px-3">
        <Lights />
        <span className="text-[12px] font-semibold text-[#13201b]">Downloads</span>
      </div>
      <div className="flex h-[270px]">
        <div className="w-[140px] space-y-1 bg-[#f3f5f4] px-3 py-3 text-[11px] text-[#4d5b55]">
          <p className="pb-1 text-[9.5px] font-semibold uppercase tracking-wide text-[#7f8d87]">Favourites</p>
          {["Recents", "Applications", "Desktop", "Downloads", "Documents"].map((f) => (
            <p key={f} className={`rounded px-1.5 py-0.5 ${f === "Downloads" ? "bg-black/10 font-medium text-[#13201b]" : ""}`}>
              {f}
            </p>
          ))}
        </div>
        <div className="flex flex-1 items-start gap-2 p-5">
          <span className="flex flex-col items-center">
            <FileZip size={44} weight="duotone" color="#4d5b55" />
            <Label on={selected && unzipped < 1}>{slug}-starter-kit.zip</Label>
          </span>
          {unzipped > 0 && (
            <span className="flex flex-col items-center" style={{ opacity: unzipped, transform: `scale(${0.7 + 0.3 * unzipped})` }}>
              <Folder size={44} weight="fill" color="#5aa9e6" />
              <Label on={unzipped >= 1}>{slug}</Label>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TerminalApp({ t, slug, task, file, lines }: { t: number; slug: string; task: string; file: string; lines: number }) {
  if (t < 9.75) return null;
  const p = ease(seg(t, 9.75, 10.15));
  const blink = Math.floor(t * 2) % 2 === 0;
  const caret = <span className="inline-block h-[13px] w-[7px] translate-y-[2px] bg-[#d7e0db]" style={{ opacity: blink ? 1 : 0 }} />;
  const Prompt = ({ dir }: { dir: string }) => <span className="text-[#79cbab]">{dir} % </span>;
  const claude = t >= 13.7;
  const msg1 = `Read the build brief for "${task}". I'll go one step at a time and check with you before anything that costs money or sends a message.`;
  const msg2 = "Step 1: set up the project files from the brief.";
  const pasted = `[Pasted text #1 +${lines} lines]`;

  return (
    <div
      className="absolute overflow-hidden rounded-xl border border-black/40 bg-[#151918] text-[#d7e0db] shadow-2xl"
      style={{ left: 290, top: 52, width: 620, height: 372, opacity: p, transform: `scale(${0.92 + 0.08 * p})`, fontFamily: MONO }}
    >
      <div className="flex h-[28px] items-center gap-4 bg-[#1f2422] px-3">
        <Lights />
        <span className="flex-1 text-center text-[11.5px] text-[#8b9690]">{claude ? `${slug} — claude` : `${slug} — zsh`}</span>
      </div>
      <div className="flex h-[344px] flex-col justify-end gap-[6px] overflow-hidden p-3 text-[12px] leading-[18px]">
        <p className="text-[#8b9690]">Last login on ttys001</p>
        <p className="truncate">
          <Prompt dir="~" />
          {typed(`cd ~/Downloads/${slug}`, t, 10.4, 12.2)}
          {t < 12.4 && caret}
        </p>
        {t >= 12.4 && (
          <p>
            <Prompt dir={slug} />
            {typed("claude", t, 12.8, 13.3)}
            {t < 13.5 && caret}
          </p>
        )}
        {claude && (
          <div className="mt-1 w-[300px] rounded-md border border-[#d97757] px-3 py-2" style={{ opacity: seg(t, 13.7, 14.0) }}>
            <p className="text-[#e6a184]">✻ Welcome to Claude Code!</p>
            <p className="mt-1 text-[#8b9690]">/help for help</p>
            <p className="truncate text-[#8b9690]">cwd: ~/Downloads/{slug}</p>
          </div>
        )}
        {t >= 15.7 && (
          <p className="mt-1 text-[#8b9690]">
            &gt; <span className="text-[#d7e0db]">{pasted}</span>
          </p>
        )}
        {t >= 16 && t < 17 && <p className="text-[#e6a184]">{["✻", "✳", "✢", "✶"][Math.floor(t * 6) % 4]} Reading BUILD.md…</p>}
        {t >= 17 && (
          <p>
            <span className="text-[#d7e0db]">⏺ </span>
            {typed(msg1, t, 17, 18.2)}
          </p>
        )}
        {t >= 18.6 && (
          <p>
            <span className="text-[#d7e0db]">⏺ </span>
            {typed(msg2, t, 18.6, 19.1)}
          </p>
        )}
        {t >= 19.3 && t < 20.7 && (
          <div className="rounded-md border border-[#5e6e67] px-3 py-2" style={{ opacity: seg(t, 19.3, 19.5) }}>
            <p className="font-semibold">Create file</p>
            <p className="truncate text-[#8b9690]">{file}</p>
            <p className="mt-1">Do you want to create {file.split("/").pop()}?</p>
            <p className="text-[#79cbab]">❯ 1. Yes</p>
            <p className="text-[#8b9690]">&nbsp;&nbsp;2. Yes, allow all edits during this session</p>
            <p className="text-[#8b9690]">&nbsp;&nbsp;3. No, and tell Claude what to do differently</p>
          </div>
        )}
        {t >= 20.7 && (
          <div style={{ opacity: seg(t, 20.7, 20.9) }}>
            <p>
              <span className="text-[#79cbab]">⏺ </span>Write({file})
            </p>
            <p className="text-[#8b9690]">&nbsp;&nbsp;⎿ Created {file}</p>
          </div>
        )}
        {claude && (
          <div className="mt-1 rounded-md border border-[#5e6e67] px-3 py-1.5" style={{ opacity: seg(t, 13.8, 14.1) }}>
            <span className="text-[#8b9690]">&gt; </span>
            {t >= 14.65 && t < 15.7 ? <span className="rounded-sm bg-[#2c3a35] px-1 text-[#79cbab]">{pasted}</span> : null}
            {(t < 14.65 || t >= 15.7) && caret}
          </div>
        )}
      </div>
    </div>
  );
}
