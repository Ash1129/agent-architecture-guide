import { Check, CheckCircle, FileArchive, Package, Plug, Plus, Robot, Sparkle } from "@phosphor-icons/react";
import type { KitFile } from "../lib/starter";
import { SITE, SITE_TAB, SitePage, taskOf } from "./BuildVideo";
import { ACCENT, BrowserFrame, DOCK, Desktop, Lights, MONO, VideoPlayer, ease, seg, typed, type Clicks, type Keys, type Path, type Section } from "./recording";

// A scripted "screen recording" of installing the starter kit's Claude
// plugin: download the .plugin, open Claude from the dock, drag the file from
// the desktop into the chat and install it, see what it added, then try it on
// one real case. It shows this person's own plugin, Skill and agents. Claude's
// own window is drawn plainly (a chat with a message box), so nothing about it
// is made up.

const SECONDS = 23;

/** Where each section ends; the index matches the plugin guide's step cards. */
const SECTIONS: Section[] = [
  { until: 4.0, caption: "Download the plugin from the starter kit" },
  { until: 6.4, caption: "Open Claude from the dock" },
  { until: 10.6, caption: "Drag the .plugin from your desktop into the chat, then press Install" },
  { until: 14.0, caption: "Check what it added: the Skill, the agents and any connectors" },
  { until: Infinity, caption: "Try it on one real past case, and check its work" },
];

/** The plugin's parts, from its files in the kit. */
export function pluginParts(files: KitFile[]) {
  const paths = files.filter((f) => f.path.startsWith("claude-plugin/")).map((f) => f.path.slice("claude-plugin/".length));
  return {
    skill: paths.map((p) => p.match(/^skills\/([^/]+)\/SKILL\.md$/)?.[1]).find(Boolean) ?? "your-task",
    agents: paths.map((p) => p.match(/^agents\/([^/]+)\.md$/)?.[1]).filter((x): x is string => !!x),
    connectors: paths.includes(".mcp.json"),
  };
}

// The Claude window, and everything the cursor touches, on the stage.
const WIN = { left: 210, top: 44, width: 680, height: 410 };
const OPEN_CLAUDE = 5.4;
const DRAG = [7.4, 8.9] as const;
const DROPPED = 9.0;
const INSTALLED = 10.35;
const AT = {
  rest: [480, 420],
  download: SITE.toolAction,
  claude: DOCK.claude,
  file: [118, 168],
  drop: [600, 420],
  install: [824, 344], // the Install button, on the plugin card at the foot of the chat
  composer: [560, 420],
  aside: [920, 470],
} as const;

const PATH: Path = [
  [0, AT.rest],
  [0.6, AT.rest],
  [1.5, AT.download],
  [2.3, AT.download],
  [4.4, AT.download],
  [5.2, AT.claude],
  [6.4, AT.claude],
  [7.1, AT.file],
  [DRAG[0], AT.file],
  [DRAG[1], AT.drop],
  [9.2, AT.drop],
  [10.0, AT.install],
  [10.6, AT.install],
  [13.6, AT.composer],
  [14.6, AT.composer],
  [15.8, AT.aside],
];

// Picking the file up isn't a click, so it has no ripple; the badge below says what's happening.
const CLICKS: Clicks = [
  [1.6, AT.download],
  [OPEN_CLAUDE, AT.claude],
  [10.2, AT.install],
  [14.3, AT.composer],
];

const KEYS: Keys = [
  [DRAG[0], "Drag and drop"],
  [16.9, "⏎ Return"],
];

export function ClaudePluginVideo({ slug, files, onSection }: { slug: string; files: KitFile[]; onSection?: (i: number) => void }) {
  const task = taskOf(files);
  const parts = pluginParts(files);
  const file = `${slug}.plugin`;
  return (
    <VideoPlayer
      seconds={SECONDS}
      sections={SECTIONS}
      onSection={onSection}
      description={`A screen recording: on this page, Download .plugin is clicked and ${file} is saved to the desktop. Claude is opened from the dock. ${file} is dragged from the desktop into the chat and Install is pressed. The plugin adds the ${parts.skill} Skill${parts.agents.length ? ` and ${parts.agents.length} agent${parts.agents.length === 1 ? "" : "s"}` : ""}${parts.connectors ? ", plus connectors to set up" : ""}. Then Claude is asked to use the Skill on one real past case, and replies with a draft to check before anything is sent.`}
    >
      {(t) => (
        <Desktop t={t} front={t < OPEN_CLAUDE ? "Browser" : "Claude"} path={PATH} clicks={CLICKS} keys={KEYS} opened={{ claude: OPEN_CLAUDE }}>
          {t < 4.6 && (
            <BrowserFrame tabs={[SITE_TAB]} active={0} address="Agent Architecture Guide / your result" style={{ opacity: 1 - seg(t, 4.0, 4.5) }}>
              <SitePage task={task} plugin={{ downloaded: t >= 1.65 }} />
              {t >= 1.8 && t < 3.8 && (
                <div
                  className="absolute right-[10px] top-[60px] flex w-[270px] items-center gap-2.5 rounded-xl border border-black/10 bg-white p-3 shadow-xl"
                  style={{ opacity: seg(t, 1.8, 2.0) * (1 - seg(t, 3.6, 3.8)) }}
                >
                  <FileArchive size={26} color={ACCENT} />
                  <span className="min-w-0">
                    <span className="block truncate text-[11.5px] font-medium text-[#13201b]">{file}</span>
                    <span className="text-[10.5px] text-[#4d5b55]">Done · saved to Downloads</span>
                  </span>
                </div>
              )}
            </BrowserFrame>
          )}
          <DesktopFile t={t} name={file} />
          <ClaudeWindow t={t} file={file} parts={parts} />
          <DragGhost t={t} name={file} />
        </Desktop>
      )}
    </VideoPlayer>
  );
}

/** The downloaded plugin on the desktop: dimmed while it's dragged, gone once it's dropped. */
function DesktopFile({ t, name }: { t: number; name: string }) {
  if (t < 4.2 || t >= DROPPED) return null;
  const lifted = t >= DRAG[0];
  return (
    <div
      className="absolute flex w-[96px] flex-col items-center gap-1"
      style={{ left: AT.file[0] - 48, top: AT.file[1] - 26, opacity: seg(t, 4.2, 4.5) * (lifted ? 0.35 : 1) }}
    >
      <span className="grid size-[44px] place-items-center rounded-lg bg-white/90 shadow">
        <Package size={24} color="#c4623f" />
      </span>
      <span className="w-full truncate rounded bg-black/25 px-1 text-center text-[10px] text-white">{name}</span>
    </div>
  );
}

/** The file following the pointer while it's dragged (the same easing as the pointer), lifted with a shadow. */
function DragGhost({ t, name }: { t: number; name: string }) {
  if (t < DRAG[0] || t >= DROPPED) return null;
  const p = ease(seg(t, DRAG[0], DRAG[1]));
  const x = AT.file[0] + (AT.drop[0] - AT.file[0]) * p;
  const y = AT.file[1] + (AT.drop[1] - AT.file[1]) * p;
  const lift = seg(t, DRAG[0], DRAG[0] + 0.2);
  return (
    <div className="absolute flex flex-col items-center gap-1" style={{ left: x - 22, top: y - 30, transform: `scale(${1 + 0.08 * lift}) rotate(${-4 * lift}deg)` }}>
      <span className="grid size-[44px] place-items-center rounded-lg bg-white shadow-2xl">
        <Package size={24} color="#c4623f" />
      </span>
      <span className="max-w-[140px] truncate rounded bg-[#2f6fde] px-1.5 text-[10px] text-white">{name}</span>
    </div>
  );
}

function ClaudeWindow({ t, file, parts }: { t: number; file: string; parts: ReturnType<typeof pluginParts> }) {
  if (t < OPEN_CLAUDE + 0.2) return null;
  const p = ease(seg(t, OPEN_CLAUDE + 0.2, OPEN_CLAUDE + 0.7));
  const dragging = t >= DRAG[0] && t < DROPPED;
  const over = dragging && t >= DRAG[1] - 0.5;
  const dropped = t >= DROPPED;
  const installed = t >= INSTALLED;
  const prompt = `Use the ${parts.skill} Skill on one real past case.`;
  const sent = t >= 17.0;
  const rows: { icon: typeof Robot; kind: string; name: string }[] = [
    { icon: Sparkle, kind: "Skill", name: parts.skill },
    ...parts.agents.slice(0, 2).map((a) => ({ icon: Robot, kind: "Agent", name: a })),
    ...(parts.connectors ? [{ icon: Plug, kind: "Connectors", name: "Connect them in Claude's settings" }] : []),
  ];
  return (
    <div
      className="absolute overflow-hidden rounded-xl border border-black/20 bg-[#faf9f5] shadow-2xl"
      style={{ ...WIN, opacity: p, transform: `scale(${0.95 + 0.05 * p})`, fontFamily: "var(--font-sans)" }}
    >
      <div className="flex h-[30px] items-center gap-4 border-b border-black/10 bg-[#f0eee6] px-3">
        <Lights />
        <span className="flex-1 text-center text-[11.5px] text-[#4d5b55]">Claude</span>
      </div>
      {/* Sidebar */}
      <div className="absolute bottom-0 left-0 top-[30px] w-[150px] border-r border-black/10 bg-[#f4f2ea] p-3">
        <span className="flex h-[26px] items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-[#13201b]" style={{ background: "#e6e2d4" }}>
          <Plus size={12} weight="bold" color="#c4623f" />
          New chat
        </span>
        <span className="mt-4 block text-[9px] uppercase tracking-[0.06em] text-[#8a887f]">Recents</span>
        {[96, 80, 104].map((w, i) => (
          <span key={i} className="mt-2 block h-[6px] rounded bg-black/10" style={{ width: w }} />
        ))}
      </div>

      {!dropped && (
        <p className="absolute left-[150px] right-0 top-[120px] text-center text-[22px] text-[#13201b]" style={{ fontFamily: "var(--font-serif)" }}>
          How can I help you today?
        </p>
      )}
      {/* Conversation: anchored to the bottom like a chat, so the newest message stays in view. */}
      <div className="absolute bottom-[64px] left-[150px] right-0 top-[30px] flex flex-col justify-end gap-3 overflow-hidden px-6 py-4">
        {dropped && (
          <div
            className="flex shrink-0 items-center gap-3 rounded-xl border border-black/10 bg-white p-3 shadow-sm"
            style={{ opacity: seg(t, DROPPED, DROPPED + 0.3), transform: `translateY(${(1 - ease(seg(t, DROPPED, DROPPED + 0.3))) * 8}px)` }}
          >
            <span className="grid size-[34px] shrink-0 place-items-center rounded-lg" style={{ background: "#f6e3da" }}>
              <Package size={18} color="#c4623f" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-medium text-[#13201b]" style={{ fontFamily: MONO }}>
                {file}
              </span>
              <span className="text-[10.5px] text-[#6b6a63]">Claude plugin</span>
            </span>
            <span
              className="flex h-[26px] shrink-0 items-center gap-1 rounded-full px-3 text-[11px] font-medium"
              style={installed ? { background: "#e1ede7", color: ACCENT } : { background: "#13201b", color: "#fff", transform: `scale(${t >= 10.2 && t < INSTALLED ? 0.94 : 1})` }}
            >
              {installed && <Check size={11} weight="bold" />}
              {installed ? "Installed" : "Install"}
            </span>
          </div>
        )}
        {installed && (
          <div className="grid shrink-0 px-1" style={{ rowGap: 6 * seg(t, 10.7, 11.0) }}>
            {rows.map((r, i) => (
              // Each row grows in as it appears, so the card above slides up instead of jumping.
              <p
                key={r.kind + r.name}
                className="flex items-center gap-2 overflow-hidden text-[11px] text-[#4d5b55]"
                style={{ opacity: seg(t, 10.9 + 0.5 * i, 11.2 + 0.5 * i), maxHeight: 20 * ease(seg(t, 10.7 + 0.5 * i, 11.0 + 0.5 * i)) }}
              >
                <CheckCircle size={14} weight="fill" color={ACCENT} />
                <span className="w-[70px] shrink-0 text-[9.5px] uppercase tracking-[0.06em] text-[#8a887f]">{r.kind}</span>
                <span className="truncate text-[#13201b]" style={{ fontFamily: r.kind === "Connectors" ? undefined : MONO }}>
                  {r.name}
                </span>
              </p>
            ))}
          </div>
        )}
        {sent && (
          <p className="ml-auto max-w-[78%] shrink-0 rounded-xl bg-[#e9e6dc] px-3 py-2 text-[11.5px] text-[#13201b]" style={{ opacity: seg(t, 17.0, 17.3) }}>
            {prompt}
          </p>
        )}
        {t >= 17.6 && (
          <div className="max-w-[86%] shrink-0 space-y-1.5" style={{ opacity: seg(t, 17.6, 17.9) }}>
            <span className="inline-flex items-center gap-1 rounded-md border border-black/10 bg-white px-2 py-0.5 text-[10px] text-[#4d5b55]">
              <Sparkle size={10} weight="fill" color="#c4623f" />
              Using the {parts.skill} Skill
            </span>
            {[300, 260, 280].map((w, i) => (
              <span key={i} className="block h-[7px] rounded bg-black/10" style={{ width: w * seg(t, 18.0 + 0.4 * i, 18.4 + 0.4 * i) }} />
            ))}
            {t >= 19.8 && (
              <p className="text-[11.5px] text-[#13201b]" style={{ opacity: seg(t, 19.8, 20.1) }}>
                Here's a draft for one real case. Check it before anything is sent.
              </p>
            )}
          </div>
        )}
      </div>

      {/* The whole chat lights up as a drop target while the file is dragged over it */}
      {dragging && (
        <div
          className="pointer-events-none absolute bottom-0 left-[150px] right-0 top-[30px] grid place-items-center border-2 border-dashed"
          style={{ borderColor: "rgba(196,98,63,.6)", background: `rgba(196,98,63,${over ? 0.08 : 0.03})`, opacity: seg(t, DRAG[0], DRAG[0] + 0.25) }}
        >
          <span className="rounded-full bg-white px-3 py-1.5 text-[11.5px] font-medium shadow" style={{ color: "#c4623f" }}>
            Drop to add the plugin
          </span>
        </div>
      )}

      {/* Message box */}
      <div className="absolute bottom-[14px] left-[170px] right-[20px] flex h-[38px] items-center rounded-xl border border-black/10 bg-white px-3 text-[11.5px]">
        {t >= 14.4 && !sent ? (
          <span className="text-[#13201b]">
            {typed(prompt, t, 14.6, 16.6)}
            <span className="ml-px inline-block h-[12px] w-px translate-y-[2px] bg-[#13201b]" style={{ opacity: Math.floor(t * 2) % 2 ? 0 : 1 }} />
          </span>
        ) : (
          <span className="text-[#8a887f]">Reply to Claude…</span>
        )}
      </div>
    </div>
  );
}
