import { CaretDown, Check, CheckCircle, Envelope, FlowArrow, GitBranch, House, Key, PencilSimple, Play, Plus, Robot, Sparkle, Users, Warning, X } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { KitFile } from "../lib/starter";
import { SITE, SITE_TAB, SitePage, taskOf } from "./BuildVideo";
import { BrowserFrame, Desktop, VideoPlayer, ease, seg, type Clicks, type Keys, type Path, type Section } from "./recording";

// A scripted "screen recording" of moving the workflow into n8n: copy it from
// the starter kit, open n8n, create a workflow, paste, add a credential, run a
// test and switch it on. The pasted workflow is a simple example so the steps
// are easy to follow; the person's own workflow has its own steps.

const SECONDS = 22;

/** Where each section ends; the index matches the n8n guide's step cards. */
const SECTIONS: Section[] = [
  { until: 3.1, caption: "Copy the workflow from the starter kit" },
  { until: 5.9, caption: "Open n8n and create a new workflow" },
  { until: 8.2, caption: "Click the empty canvas and paste" },
  { until: 16.0, caption: "Add a credential to each node with a warning" },
  { until: Infinity, caption: "Run a test, then switch the workflow on" },
];

const N8N = "#ea4b71";
const OK = "#2e9e5b";

// Stage coordinates of everything the cursor touches.
const AT = {
  rest: [480, 420],
  copy: SITE.toolAction,
  tab: [500, 61],
  create: [807, 137],
  canvas: [640, 400],
  model: [360, 370],
  dropdown: [470, 248],
  newCred: [480, 283],
  apiKey: [502, 294],
  save: [662, 363],
  close: [718, 181],
  execute: [503, 446],
  toggle: [798, 125],
  aside: [880, 300],
} as const;

const PATH: Path = [
  [0, AT.rest],
  [0.6, AT.rest],
  [1.5, AT.copy],
  [2.2, AT.copy],
  [3.0, AT.tab],
  [3.6, AT.tab],
  [4.4, AT.create],
  [5.0, AT.create],
  [5.8, AT.canvas],
  [8.2, AT.canvas],
  [9.0, AT.model],
  [9.8, AT.model],
  [10.5, AT.dropdown],
  [11.1, AT.dropdown],
  [11.5, AT.newCred],
  [11.8, AT.newCred],
  [12.1, AT.apiKey],
  [13.2, AT.apiKey],
  [13.8, AT.save],
  [14.6, AT.save],
  [15.2, AT.close],
  [15.8, AT.close],
  [16.6, AT.execute],
  [18.9, AT.execute],
  [19.7, AT.toggle],
  [20.4, AT.toggle],
  [21.0, AT.aside],
];

const CLICKS: Clicks = [
  [1.6, AT.copy],
  [3.1, AT.tab],
  [4.5, AT.create],
  [5.9, AT.canvas],
  [9.1, AT.model],
  [9.25, AT.model],
  [10.6, AT.dropdown],
  [11.6, AT.newCred],
  [12.15, AT.apiKey],
  [13.9, AT.save],
  [15.3, AT.close],
  [16.7, AT.execute],
  [19.8, AT.toggle],
];

const KEYS: Keys = [[6.3, "⌘ V"]];

export function N8nVideo({ files, onSection }: { files: KitFile[]; onSection?: (i: number) => void }) {
  const task = taskOf(files);
  return (
    <VideoPlayer
      seconds={SECONDS}
      sections={SECTIONS}
      onSection={onSection}
      description="A screen recording: on this page, Copy for n8n is clicked. In an n8n tab, Create workflow is clicked, the empty canvas is clicked and Command V pastes an example workflow of five connected steps. The AI model step shows a warning; it is opened, a new Anthropic credential is created with an API key and saved, and the warning goes away. Execute workflow runs every step with a green check, and the workflow is switched to Active."
    >
      {(t) => (
        <Desktop t={t} front="Browser" path={PATH} clicks={CLICKS} keys={KEYS}>
          <BrowserFrame
            tabs={[SITE_TAB, { title: t < 4.6 ? "Overview · n8n" : "My workflow · n8n", color: N8N }]}
            active={t < 3.15 ? 0 : 1}
            address={t < 3.15 ? "Agent Architecture Guide / your result" : t < 4.6 ? "yourteam.app.n8n.cloud/home/workflows" : "yourteam.app.n8n.cloud/workflow/new"}
          >
            {t < 3.15 ? (
              <SitePage task={task} copiedN8n={t >= 1.65} />
            ) : (
              // n8n's screens are laid out in stage coordinates, offset by the window's position.
              <div className="absolute" style={{ left: -70, top: -40, width: 960, height: 540 }}>
                <N8nApp t={t} />
              </div>
            )}
          </BrowserFrame>
        </Desktop>
      )}
    </VideoPlayer>
  );
}

// ------------------------------------------------------------------ n8n

function N8nApp({ t }: { t: number }) {
  return (
    <>
      {/* Left sidebar */}
      <div className="absolute flex flex-col items-center gap-3 border-r border-black/10 bg-white pt-3" style={{ left: 70, top: 106, width: 44, height: 364 }}>
        <span className="grid size-6 place-items-center rounded-md text-[12px] font-bold text-white" style={{ background: N8N }}>
          n
        </span>
        <House size={15} color="#7f8d87" />
        <FlowArrow size={15} color="#7f8d87" />
        <Key size={15} color="#7f8d87" />
        <Users size={15} color="#7f8d87" />
      </div>
      {t < 4.6 ? <Overview /> : <Editor t={t} />}
    </>
  );
}

function Overview() {
  return (
    <div className="absolute bg-[#f7f7f8]" style={{ left: 114, top: 106, width: 776, height: 364 }}>
      <div className="flex items-center justify-between px-6 pt-4">
        <span className="text-[17px] font-semibold text-[#13201b]">Overview</span>
        <span className="flex h-[28px] w-[120px] items-center justify-center gap-1 rounded-md text-[11.5px] font-medium text-white" style={{ background: N8N }}>
          <Plus size={11} weight="bold" />
          Create workflow
        </span>
      </div>
      <div className="mt-4 space-y-2 px-6">
        {["Invoice reminders", "New lead intake", "Weekly report"].map((w) => (
          <div key={w} className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-4 py-3 text-[12px] text-[#13201b]">
            {w}
            <span className="text-[10.5px] text-[#7f8d87]">Last updated 2 days ago</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type NodeSpec = { id: string; label: string; x: number; y: number; icon: ReactNode; w?: number; trigger?: boolean };

// An example workflow: triage incoming email with AI.
const NODES: NodeSpec[] = [
  { id: "email", label: "New email", x: 210, y: 270, icon: <Envelope size={22} color="#2f6fde" />, trigger: true },
  { id: "ai", label: "Classify with AI", x: 360, y: 270, icon: <Robot size={22} color="#13201b" />, w: 120 },
  { id: "if", label: "Urgent?", x: 510, y: 270, icon: <GitBranch size={22} color="#2e9e5b" /> },
  { id: "alert", label: "Alert the team", x: 660, y: 215, icon: <Warning size={22} color="#d97706" /> },
  { id: "draft", label: "Draft a reply", x: 660, y: 325, icon: <PencilSimple size={22} color="#7a5b00" /> },
];
// When each step finishes in the test run (the "draft" branch is not taken).
const RAN: Record<string, number> = { email: 16.9, ai: 17.3, model: 17.3, if: 17.7, alert: 18.0 };

function Editor({ t }: { t: number }) {
  const pasted = t >= 6.4;
  const appear = (i: number) => ease(seg(t, 6.4 + 0.15 * i, 6.7 + 0.15 * i));
  const saved = t >= 13.95;
  const active = t >= 19.85;
  const ran = (id: string) => t >= (RAN[id] ?? Infinity);

  return (
    <>
      {/* Top bar */}
      <div className="absolute flex items-center gap-3 border-b border-black/10 bg-white px-4" style={{ left: 114, top: 106, width: 776, height: 36 }}>
        <span className="text-[12.5px] font-semibold text-[#13201b]">My workflow</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] font-medium" style={{ color: active ? OK : "#7f8d87" }}>
          {active ? "Active" : "Inactive"}
          <span className="relative h-[16px] w-[28px] rounded-full transition-colors" style={{ background: active ? OK : "#c9cfcc" }}>
            <span className="absolute top-[2px] size-[12px] rounded-full bg-white" style={{ left: active ? 14 : 2 }} />
          </span>
        </span>
        <span className="rounded-md border border-black/15 px-3 py-1 text-[11px] text-[#13201b]">Save</span>
      </div>

      {/* Canvas */}
      <div
        className="absolute"
        style={{ left: 114, top: 142, width: 776, height: 328, background: "#f7f7f8", backgroundImage: "radial-gradient(#d4d7d6 1px, transparent 1px)", backgroundSize: "16px 16px" }}
      />

      {!pasted && (
        <div className="absolute flex flex-col items-center gap-2" style={{ left: 432, top: 240 }}>
          <span className="grid size-[64px] place-items-center rounded-xl border-2 border-dashed border-[#9aa9a2] bg-white">
            <Plus size={22} color="#7f8d87" />
          </span>
          <span className="text-[11px] text-[#4d5b55]">Add first step…</span>
        </div>
      )}

      {pasted && (
        <>
          <svg className="absolute left-0 top-0" width={960} height={540} fill="none">
            {[
              { d: "M238 270 L300 270", i: 1 },
              { d: "M420 270 L482 270", i: 2 },
              { d: "M538 270 C580 270 590 215 632 215", i: 3, label: "true", lx: 584, ly: 232 },
              { d: "M538 270 C580 270 590 325 632 325", i: 4, label: "false", lx: 584, ly: 314 },
            ].map((e) => (
              <g key={e.d} opacity={appear(e.i)}>
                <path d={e.d} stroke="#9aa9a2" strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - appear(e.i)} />
                {e.label && (
                  <text x={e.lx} y={e.ly} fontSize={9.5} fill="#7f8d87" textAnchor="middle">
                    {e.label}
                  </text>
                )}
              </g>
            ))}
            <path d="M360 298 L360 346" stroke="#9aa9a2" strokeWidth={2} strokeDasharray="4 4" opacity={appear(2)} />
            {/* Items passed along in the test run */}
            {[
              { x: 269, y: 262, at: RAN.email },
              { x: 451, y: 262, at: RAN.ai },
              { x: 596, y: 205, at: RAN.if },
            ].map((l) =>
              t >= l.at ? (
                <text key={l.x} x={l.x} y={l.y} fontSize={9.5} fill={OK} textAnchor="middle" fontWeight={600}>
                  1 item
                </text>
              ) : null,
            )}
          </svg>

          {NODES.map((n, i) => {
            const w = n.w ?? 56;
            const p = appear(i);
            const done = ran(n.id);
            return (
              <div key={n.id} className="absolute flex flex-col items-center" style={{ left: n.x - 60, top: n.y - 28, width: 120, opacity: p, transform: `scale(${0.8 + 0.2 * p})` }}>
                <span
                  className={`relative grid place-items-center border-2 bg-white shadow-sm ${n.trigger ? "rounded-l-[28px] rounded-r-lg" : "rounded-lg"}`}
                  style={{ width: w, height: 56, borderColor: done ? OK : "#c9cfcc" }}
                >
                  {n.icon}
                  {done && <CheckCircle size={14} weight="fill" color={OK} className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white" />}
                </span>
                <span className="mt-1 text-center text-[10.5px] font-medium leading-tight text-[#13201b]">{n.label}</span>
              </div>
            );
          })}

          {/* The AI step's model, which needs a credential */}
          <div className="absolute flex flex-col items-center" style={{ left: 300, top: 346, width: 120, opacity: appear(2) }}>
            <span className="relative grid size-[48px] place-items-center rounded-full border-2 bg-white shadow-sm" style={{ borderColor: ran("model") ? OK : saved ? "#c9cfcc" : "#d97706" }}>
              <Sparkle size={18} weight="fill" color="#d97757" />
              {!saved && (
                <span className="absolute -right-1 -top-1 grid size-[16px] place-items-center rounded-full bg-[#d97706]">
                  <Warning size={10} weight="fill" color="#fff" />
                </span>
              )}
              {ran("model") && <CheckCircle size={14} weight="fill" color={OK} className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white" />}
            </span>
            <span className="mt-1 text-[10.5px] font-medium text-[#13201b]">Claude model</span>
          </div>
        </>
      )}

      {/* Execute button */}
      <span
        className="absolute flex h-[30px] w-[140px] items-center justify-center gap-1.5 rounded-md text-[11.5px] font-medium text-white shadow"
        style={{ left: 432, top: 430, background: N8N }}
      >
        <Play size={11} weight="fill" />
        Execute workflow
      </span>

      {t >= 18.3 && t < 20.6 && (
        <div
          className="absolute flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-[11px] text-[#13201b] shadow-lg"
          style={{ left: 655, top: 152, opacity: seg(t, 18.3, 18.5) * (1 - seg(t, 20.3, 20.6)) }}
        >
          <CheckCircle size={14} weight="fill" color={OK} />
          Workflow executed successfully
        </div>
      )}

      {t >= 9.35 && t < 15.4 && <NodePanel t={t} />}
    </>
  );
}

/** The opened model node: pick or create its credential. */
function NodePanel({ t }: { t: number }) {
  const p = ease(seg(t, 9.35, 9.6)) * (1 - seg(t, 15.3, 15.4));
  const saved = t >= 13.95;
  const menu = t >= 10.65 && t < 11.65;
  const modal = t >= 11.65 && t < 13.95;
  const dots = "•".repeat(Math.round(22 * seg(t, 12.3, 13.1)));

  return (
    <div className="absolute" style={{ left: 114, top: 106, width: 776, height: 364, opacity: p }}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute rounded-xl border border-black/10 bg-white shadow-2xl" style={{ left: 146, top: 54, width: 480, height: 270 }}>
        <div className="flex items-center gap-2 border-b border-black/10 px-4 py-2.5">
          <Sparkle size={15} weight="fill" color="#d97757" />
          <span className="text-[12.5px] font-semibold text-[#13201b]">Claude model</span>
          <X size={13} color="#4d5b55" className="ml-auto" />
        </div>
        <div className="px-5 pt-3">
          <p className="text-[10.5px] font-medium text-[#4d5b55]">Credential to connect with</p>
          <div
            className="mt-1 flex h-[28px] items-center justify-between rounded-md border px-2.5 text-[11.5px]"
            style={{ borderColor: saved ? "#c9cfcc" : "#d97706", color: saved ? "#13201b" : "#7f8d87" }}
          >
            <span className="flex items-center gap-1.5">
              {saved && <Check size={11} weight="bold" color={OK} />}
              {saved ? "Anthropic account" : "Select credential"}
            </span>
            <CaretDown size={11} />
          </div>
          {menu && (
            <div className="mt-1 rounded-md border border-black/10 bg-white px-2.5 py-2 text-[11.5px] shadow-lg">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: N8N }}>
                <Plus size={11} weight="bold" />
                Create new credential
              </span>
            </div>
          )}
          {!menu && (
            <>
              <p className="mt-4 text-[10.5px] font-medium text-[#4d5b55]">Model</p>
              <div className="mt-1 flex h-[28px] items-center justify-between rounded-md border border-[#c9cfcc] px-2.5 text-[11.5px] text-[#13201b]">
                claude-sonnet-5-5
                <CaretDown size={11} />
              </div>
            </>
          )}
        </div>

        {modal && (
          <div className="absolute rounded-xl border border-black/10 bg-white shadow-2xl" style={{ left: 30, top: 30, width: 420, height: 200 }}>
            <div className="border-b border-black/10 px-4 py-2.5">
              <p className="text-[12.5px] font-semibold text-[#13201b]">Anthropic account</p>
              <p className="text-[10px] text-[#7f8d87]">Anthropic API</p>
            </div>
            <div className="px-5 pt-3">
              <p className="text-[10.5px] font-medium text-[#4d5b55]">API Key</p>
              <div className="mt-1 flex h-[28px] items-center rounded-md border border-[#2f6fde] px-2.5 font-mono text-[12px] tracking-wider text-[#13201b]">
                {dots}
                {t < 13.2 && <span className="ml-px inline-block h-[13px] w-px bg-[#13201b]" style={{ opacity: Math.floor(t * 2) % 2 ? 0 : 1 }} />}
              </div>
              <p className="mt-2 flex items-center gap-1 text-[10px] text-[#7f8d87]">
                <Key size={10} />
                Stored encrypted in n8n, never in the workflow
              </p>
            </div>
            <span className="absolute bottom-[14px] right-[20px] rounded-md px-4 py-1.5 text-[11px] font-medium text-white" style={{ background: N8N }}>
              Save
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
