import { Check, Copy, DownloadSimple, Eye, FileZip, Folder, FlowArrow, PlayCircle, Robot } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { KitFile } from "../lib/starter";
import { ACCENT, BrowserFrame, Desktop, DOCK, Lights, MONO, VideoPlayer, ease, seg, typed, type Clicks, type Keys, type Path, type Section } from "./recording";

// A scripted "screen recording" of going from the starter kit to Claude Code:
// download the kit, copy BUILD.md, minimise the browser, unzip, open Terminal,
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

// Stage coordinates of everything the cursor touches.
const AT = {
  rest: [480, 420],
  download: [656, 286],
  copy: [735, 250],
  minimise: [104, 57],
  finder: DOCK.finder,
  zip: [372, 160],
  terminal: DOCK.terminal,
  aside: [930, 470],
} as const;

const PATH: Path = [
  [0, AT.rest],
  [0.6, AT.rest],
  [1.6, AT.download],
  [2.4, AT.download],
  [3.2, AT.copy],
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
  [1.7, AT.download],
  [3.3, AT.copy],
  [4.7, AT.minimise],
  [6.5, AT.finder],
  [7.9, AT.zip],
  [8.05, AT.zip],
  [9.7, AT.terminal],
];

const KEYS: Keys = [
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
      description={`A screen recording: on this page, Download all and Copy BUILD.md are clicked and the browser is minimised. In Finder the kit is unzipped into the folder ${slug}. In Terminal, cd ~/Downloads/${slug} and claude are typed, BUILD.md is pasted and Return pressed, and Claude asks to create ${file}, which is approved.`}
    >
      {(t) => (
        <Desktop t={t} front={t < 5.5 ? "Browser" : t < 9.75 ? "Finder" : "Terminal"} path={PATH} clicks={CLICKS} keys={KEYS} opened={{ finder: 6.5, terminal: 9.7 }}>
          <BrowserWindow t={t} slug={slug} task={task} />
          <FinderWindow t={t} slug={slug} />
          <TerminalApp t={t} slug={slug} task={task} file={file} lines={lines} />
        </Desktop>
      )}
    </VideoPlayer>
  );
}

export const taskOf = (files: KitFile[]) => files[0]?.content.match(/^# Build brief: (.+)$/m)?.[1] ?? "your task";

export const SITE_TAB = { title: "Your result | Agent Architecture Guide", color: ACCENT };

/**
 * This site's result page, with the starter kit panel on the right, as it sits
 * in the browser window. `hermes` shows the Hermes Agent row in place of n8n's.
 */
export function SitePage({
  task,
  copiedBrief = false,
  copiedN8n = false,
  hermes,
}: {
  task: string;
  copiedBrief?: boolean;
  copiedN8n?: boolean;
  hermes?: { downloaded: boolean };
}) {
  return (
    <>
      <div className="absolute left-[20px] top-[86px] w-[490px]">
        <p className="text-[11px] text-[#4d5b55]">Recommended setup for {task}</p>
        <div className="mt-2 h-[18px] w-[300px] rounded bg-[#13201b]/80" />
        <div className="mt-4 h-[250px] rounded-xl border border-[#d6ddd9] bg-white p-4">
          <div className="flex items-center gap-3 pt-16">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                {i > 0 && <span className="h-px w-5 bg-[#7f8d87]" />}
                <span className="h-[54px] w-[86px] rounded-lg border border-[#d6ddd9] bg-[#f3f5f4]" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute left-[530px] top-[76px] h-[340px] w-[270px] overflow-hidden rounded-xl border border-[#d6ddd9] bg-white">
        <div className="bg-[#e1ede7] px-[14px] pb-3 pt-[12px]">
          <p className="text-[10.5px] font-medium" style={{ color: ACCENT }}>
            {">_"} Start building
          </p>
          <p className="mt-1 text-[15px] font-semibold leading-tight text-[#13201b]">Build it with an AI coding assistant</p>
          <p className="mt-1.5 text-[10.5px] leading-snug text-[#4d5b55]">Paste BUILD.md into Claude Code, Codex or any AI assistant.</p>
          <span className="mt-3 flex h-[32px] items-center justify-center gap-1.5 rounded-full text-[12px] font-medium text-white" style={{ background: ACCENT }}>
            {copiedBrief ? <Check size={13} weight="bold" /> : <Copy size={13} />}
            {copiedBrief ? "Copied" : "Copy BUILD.md"}
          </span>
          <div className="mt-2 space-y-[4px] text-[11.5px] text-[#4d5b55]">
            <p className="flex h-[24px] items-center gap-1.5">
              <DownloadSimple size={13} /> Download all
            </p>
            <p className="flex h-[24px] items-center gap-1.5">
              <Eye size={13} /> Preview files
            </p>
            <p className="flex h-[24px] items-center gap-1.5">
              <PlayCircle size={13} /> Walk me through building it
            </p>
          </div>
        </div>
        {hermes ? (
          <div className="m-2.5 flex items-center gap-2 rounded-lg bg-[#eaeeec] px-2.5 py-2.5">
            <Robot size={14} color={ACCENT} />
            <span className="flex-1 text-[11.5px] font-semibold text-[#13201b]">Hermes Agent setup</span>
            <span className="flex h-[26px] items-center gap-1 rounded-full border border-[#7f8d87] bg-white px-2.5 text-[11px] font-medium text-[#13201b]">
              {hermes.downloaded ? <Check size={11} weight="bold" /> : <DownloadSimple size={11} />}
              Download setup
            </span>
          </div>
        ) : (
          <div className="m-2.5 flex items-center gap-2 rounded-lg bg-[#eaeeec] px-2.5 py-2.5">
            <FlowArrow size={14} color={ACCENT} />
            <span className="flex-1 text-[11.5px] font-semibold text-[#13201b]">n8n workflow</span>
            <span className="flex h-[26px] items-center gap-1 rounded-full border border-[#7f8d87] bg-white px-2.5 text-[11px] font-medium text-[#13201b]">
              {copiedN8n ? <Check size={11} weight="bold" /> : <Copy size={11} />}
              {copiedN8n ? "Copied" : "Copy for n8n"}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function BrowserWindow({ t, slug, task }: { t: number; slug: string; task: string }) {
  // Minimising: the window shrinks into the browser's dock icon.
  const m = ease(seg(t, 4.75, 5.45));
  if (t > 5.5) return null;
  const bubble = t >= 1.8 && t < 3.1;

  return (
    <BrowserFrame
      tabs={[SITE_TAB]}
      active={0}
      address="Agent Architecture Guide / your result"
      toolbar={<DownloadSimple size={16} weight={t >= 1.8 ? "bold" : "regular"} color={t >= 1.8 ? ACCENT : "#4d5b55"} />}
      style={{ transform: `translate(${-48 * m}px, ${244 * m}px) scale(${1 - 0.95 * m})`, opacity: 1 - seg(t, 5.2, 5.5) }}
    >
      <SitePage task={task} copiedBrief={t >= 3.35} />
      {bubble && (
        <div
          className="absolute right-[10px] top-[60px] flex w-[270px] items-center gap-2.5 rounded-xl border border-black/10 bg-white p-3 shadow-xl"
          style={{ opacity: seg(t, 1.8, 2.0) * (1 - seg(t, 2.9, 3.1)) }}
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
