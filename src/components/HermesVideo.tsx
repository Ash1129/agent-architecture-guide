import { Check, CheckCircle, FileZip, GithubLogo, ShieldCheck } from "@phosphor-icons/react";
import type { KitFile } from "../lib/starter";
import { SITE, SITE_TAB, SitePage, taskOf } from "./BuildVideo";
import { ACCENT, BrowserFrame, Desktop, DOCK, Lights, MONO, VideoPlayer, ease, seg, typed, type Clicks, type Keys, type Path, type Section } from "./recording";

// A scripted "screen recording" of setting up Hermes Agent from the starter
// kit: download the setup, look up Hermes on GitHub, read and run setup.sh,
// merge the settings into ~/.hermes/config.yaml, then check the safety
// settings. It shows this person's own folder, script and settings; nothing
// is shown of Hermes's own screens, so nothing about them is made up.

const SECONDS = 23;

/** Where each section ends; the index matches the Hermes guide's step cards. */
const SECTIONS: Section[] = [
  { until: 4.0, caption: "Download the Hermes setup from the starter kit" },
  { until: 7.6, caption: "Install Hermes Agent from its GitHub repository" },
  { until: 14.0, caption: "Read setup.sh, then run it" },
  { until: 18.4, caption: "Merge the settings into ~/.hermes/config.yaml" },
  { until: Infinity, caption: "Keep approvals on, then test it on a real past case" },
];

// Stage coordinates of everything the cursor touches.
const AT = {
  rest: [480, 420],
  download: SITE.toolAction,
  tab: [500, 61],
  terminal: DOCK.terminal,
  aside: [900, 300],
} as const;

const PATH: Path = [
  [0, AT.rest],
  [0.6, AT.rest],
  [1.5, AT.download],
  [2.3, AT.download],
  [3.4, AT.tab],
  [4.4, AT.tab],
  [6.6, AT.terminal],
  [7.9, AT.terminal],
  [8.5, AT.aside],
];

const CLICKS: Clicks = [
  [1.6, AT.download],
  [4.1, AT.tab],
  [7.7, AT.terminal],
];

const KEYS: Keys = [
  [9.5, "⏎ Return"],
  [10.4, "⏎ Return"],
  [12.2, "⏎ Return"],
  [13.8, "⏎ Return"],
  [15.4, "⌘ V"],
  [17.2, "⌘ S"],
];

/** The kit's Hermes files, as the person will see them once unzipped. */
export function hermesFiles(files: KitFile[]) {
  const get = (p: string) => files.find((f) => f.path === `hermes/${p}`)?.content ?? "";
  const setup = get("setup.sh");
  return {
    config: get("config.yaml"),
    setup,
    scheduled: /hermes cron create/.test(setup),
    paths: files.filter((f) => f.path.startsWith("hermes/")).map((f) => f.path.slice("hermes/".length)),
  };
}

export function HermesVideo({ slug, files, onSection }: { slug: string; files: KitFile[]; onSection?: (i: number) => void }) {
  const task = taskOf(files);
  const h = hermesFiles(files);
  const folder = `${slug}-hermes`;
  return (
    <VideoPlayer
      seconds={SECONDS}
      sections={SECTIONS}
      onSection={onSection}
      description={`A screen recording: on this page, Download setup is clicked and ${folder}.zip is saved. A browser tab shows the Hermes Agent repository on GitHub. In Terminal, cd ~/Downloads/${folder} is typed, cat setup.sh shows the script, and sh setup.sh installs the Skill and the persona. config.yaml is opened, the kit's settings are pasted in and saved. A checklist then confirms command approval stays on, Skill changes need a person's approval${h.scheduled ? ", the gateway is kept running for the schedule" : ""}, and a real past case is tried.`}
    >
      {(t) => (
        <Desktop t={t} front={t < 7.75 ? "Browser" : t < 14 ? "Terminal" : t < 18.4 ? "TextEdit" : "Terminal"} path={PATH} clicks={CLICKS} keys={KEYS} opened={{ terminal: 7.7 }}>
          {t < 7.75 && (
            <BrowserFrame
              tabs={[SITE_TAB, { title: "NousResearch/hermes-agent", color: "#13201b" }]}
              active={t < 4.15 ? 0 : 1}
              address={t < 4.15 ? "Agent Architecture Guide / your result" : "github.com/NousResearch/hermes-agent"}
            >
              {t < 4.15 ? (
                <>
                  <SitePage task={task} hermes={{ downloaded: t >= 1.65 }} />
                  {t >= 1.8 && t < 3.6 && (
                    <div
                      className="absolute right-[10px] top-[60px] flex w-[270px] items-center gap-2.5 rounded-xl border border-black/10 bg-white p-3 shadow-xl"
                      style={{ opacity: seg(t, 1.8, 2.0) * (1 - seg(t, 3.4, 3.6)) }}
                    >
                      <FileZip size={26} color={ACCENT} />
                      <span className="min-w-0">
                        <span className="block truncate text-[11.5px] font-medium text-[#13201b]">{folder}.zip</span>
                        <span className="text-[10.5px] text-[#4d5b55]">Done · saved to Downloads</span>
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <RepoPage />
              )}
            </BrowserFrame>
          )}
          <Terminal t={t} folder={folder} setup={h.setup} />
          <Editor t={t} config={h.config} />
          <Checklist t={t} scheduled={h.scheduled} />
        </Desktop>
      )}
    </VideoPlayer>
  );
}

/** The repository page, kept generic: only what the knowledge base confirms (an MIT-licensed project by Nous Research). */
function RepoPage() {
  return (
    <div className="absolute inset-x-0 bottom-0 top-[66px] bg-white px-8 py-5">
      <p className="flex items-center gap-2 text-[15px] text-[#13201b]">
        <GithubLogo size={18} />
        <span className="text-[#2f6fde]">NousResearch</span> / <span className="font-semibold text-[#2f6fde]">hermes-agent</span>
        <span className="ml-1 rounded-full border border-black/15 px-2 py-0.5 text-[10.5px] text-[#4d5b55]">Public</span>
      </p>
      <p className="mt-3 text-[11.5px] text-[#4d5b55]">MIT license</p>
      <div className="mt-4 rounded-lg border border-black/10">
        <p className="border-b border-black/10 px-4 py-2 text-[12px] font-semibold text-[#13201b]">README</p>
        <div className="space-y-2 px-4 py-4">
          <p className="text-[15px] font-semibold text-[#13201b]">Installation</p>
          {[260, 330, 210, 290].map((w, i) => (
            <span key={i} className="block h-[8px] rounded bg-[#e3e8e5]" style={{ width: w }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Terminal({ t, folder, setup }: { t: number; folder: string; setup: string }) {
  if (t < 7.75 || t >= 18.4) return null;
  const p = ease(seg(t, 7.75, 8.15));
  const blink = Math.floor(t * 2) % 2 === 0;
  const caret = <span className="inline-block h-[13px] w-[7px] translate-y-[2px] bg-[#d7e0db]" style={{ opacity: blink ? 1 : 0 }} />;
  const Prompt = ({ dir }: { dir: string }) => <span className="text-[#79cbab]">{dir} % </span>;
  // The first few lines of the person's own script, as `cat` shows them.
  const script = setup
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#!") && !l.startsWith("set -e") && !l.startsWith("HERE="))
    .slice(0, 5);

  return (
    <div
      className="absolute overflow-hidden rounded-xl border border-black/40 bg-[#151918] text-[#d7e0db] shadow-2xl"
      style={{ left: 170, top: 50, width: 640, height: 380, opacity: p * (1 - seg(t, 13.9, 14.1) * 0.15), transform: `scale(${0.92 + 0.08 * p})`, fontFamily: MONO }}
    >
      <div className="flex h-[28px] items-center gap-4 bg-[#1f2422] px-3">
        <Lights />
        <span className="flex-1 text-center text-[11.5px] text-[#8b9690]">{folder} — zsh</span>
      </div>
      <div className="flex h-[352px] flex-col justify-end gap-[5px] overflow-hidden p-3 text-[11.5px] leading-[17px]">
        <p className="text-[#8b9690]">Last login on ttys001</p>
        <p className="truncate">
          <Prompt dir="~" />
          {typed(`cd ~/Downloads/${folder}`, t, 8.2, 9.4)}
          {t < 9.5 && caret}
        </p>
        {t >= 9.5 && (
          <p>
            <Prompt dir={folder} />
            {typed("cat setup.sh", t, 9.7, 10.3)}
            {t < 10.4 && caret}
          </p>
        )}
        {t >= 10.5 &&
          script.map((l, i) => (
            <p key={i} className={`truncate ${l.startsWith("#") ? "text-[#8b9690]" : ""}`} style={{ opacity: seg(t, 10.5 + 0.08 * i, 10.6 + 0.08 * i) }}>
              {l}
            </p>
          ))}
        {t >= 10.9 && (
          <p>
            <Prompt dir={folder} />
            {typed("sh setup.sh", t, 11.6, 12.1)}
            {t < 12.2 && t >= 11.2 && caret}
          </p>
        )}
        {t >= 12.6 && <p className="truncate text-[#79cbab]">Installed. Now merge config.yaml into ~/.hermes/config.yaml (model and MCP servers).</p>}
        {t >= 12.7 && (
          <p>
            <Prompt dir={folder} />
            {typed("open ~/.hermes/config.yaml", t, 12.9, 13.7)}
            {t < 13.8 && caret}
          </p>
        )}
      </div>
    </div>
  );
}

function Editor({ t, config }: { t: number; config: string }) {
  if (t < 14 || t >= 18.6) return null;
  const p = ease(seg(t, 14, 14.35)) * (1 - seg(t, 18.4, 18.6));
  const pasted = t >= 15.45;
  const saved = t >= 17.25;
  // The kit's own settings, without its two header comments.
  const lines = config.split("\n").filter((l) => !l.startsWith("#"));
  return (
    <div
      className="absolute overflow-hidden rounded-xl border border-black/20 bg-white shadow-2xl"
      style={{ left: 210, top: 70, width: 560, height: 330, opacity: p, transform: `scale(${0.94 + 0.06 * p})`, fontFamily: MONO }}
    >
      <div className="flex h-[28px] items-center gap-4 border-b border-black/10 bg-[#eef1ef] px-3">
        <Lights />
        <span className="flex-1 text-center text-[11.5px] text-[#4d5b55]">
          config.yaml — ~/.hermes{saved ? "" : " — Edited"}
        </span>
      </div>
      <div className="space-y-[3px] p-4 text-[11.5px] leading-[17px] text-[#13201b]">
        <p className="text-[#7f8d87]"># Your existing Hermes settings stay as they are.</p>
        <p className="text-[#7f8d87]"># …</p>
        <p>&nbsp;</p>
        {pasted &&
          lines.map((l, i) => (
            <p key={i} className="truncate rounded-sm px-1" style={{ background: saved ? "transparent" : "#e1ede7", opacity: seg(t, 15.45 + 0.05 * i, 15.6 + 0.05 * i) }}>
              {l || " "}
            </p>
          ))}
        {!pasted && <span className="inline-block h-[13px] w-px bg-[#13201b]" style={{ opacity: Math.floor(t * 2) % 2 ? 0 : 1 }} />}
      </div>
      {saved && (
        <span className="absolute bottom-3 right-4 flex items-center gap-1 text-[11px] font-medium" style={{ color: ACCENT, opacity: seg(t, 17.25, 17.45), fontFamily: "var(--font-sans)" }}>
          <Check size={12} weight="bold" />
          Saved
        </span>
      )}
    </div>
  );
}

function Checklist({ t, scheduled }: { t: number; scheduled: boolean }) {
  if (t < 18.5) return null;
  const p = ease(seg(t, 18.5, 18.85));
  const rows = [
    "Command approval stays on Manual or Smart, never Off",
    "Skills the agent writes for itself need a person's approval",
    ...(scheduled ? ["The gateway keeps running, so the schedule runs"] : []),
    "Tried on one real past case, and the result checked",
  ];
  return (
    <div
      className="absolute rounded-2xl border border-black/10 bg-white p-5 shadow-2xl"
      style={{ left: 250, top: 110, width: 460, opacity: p, transform: `translateY(${(1 - p) * 12}px)`, fontFamily: "var(--font-sans)" }}
    >
      <p className="flex items-center gap-2 text-[15px] font-semibold text-[#13201b]">
        <ShieldCheck size={20} weight="fill" color={ACCENT} />
        Before you rely on it
      </p>
      <ul className="mt-3 space-y-2.5">
        {rows.map((r, i) => {
          const on = t >= 19.2 + 0.8 * i;
          return (
            <li key={r} className="flex items-start gap-2.5 text-[12.5px] leading-snug text-[#13201b]">
              {on ? (
                <CheckCircle size={17} weight="fill" color={ACCENT} className="shrink-0" />
              ) : (
                <span className="mt-[1px] size-[15px] shrink-0 rounded-full border-2 border-[#c9cfcc]" />
              )}
              <span style={{ opacity: on ? 1 : 0.7 }}>{r}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
