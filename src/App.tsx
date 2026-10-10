import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Footer, Nav } from "./components/Shell";
import { BrandIntro, shouldPlayIntro } from "./components/Brand";
import { BuildOverlay } from "./components/BuildOverlay";
import { SurveyFrame } from "./components/StudioShell";
import { Details, Guide, Review } from "./pages/Guide";
import { History } from "./pages/History";
import { HowItWorks } from "./pages/HowItWorks";
import { Landing } from "./pages/Landing";
import { ProcessMap } from "./pages/Process";
import { Result } from "./pages/Result";
import { SplitReview } from "./pages/Split";
import {
  type Answers,
  type QuestionId,
  activeQuestions,
  firstUnanswered,
  isAnswered,
  isComplete,
} from "./lib/questions";
import { href, navigate, replaceHash, useRoute, type Route } from "./lib/router";
import { decodeAnswers, resultCode } from "./lib/share";
import { loadAnswers, loadDescribed, saveAnswers, saveDescribed } from "./lib/storage";
import { type HistoryEntry, findByCode, loadHistory, loadSessionId, newSessionId, saveSessionId, upsertHistory } from "./lib/history";
import { AI_ENABLED } from "./lib/features";
import { type Detail, type InterviewResponse, MAX_DESCRIPTION, MAX_TASK_TITLE, fillFromPlan, taskTitle } from "./lib/interview";
import {
  type Process,
  type ProcessDraft,
  type Split,
  decodeProcess,
  fetchSplit,
  isSplit,
  loadDraft,
  loadProcesses,
  loadSystem,
  partOf,
  processCode,
  clearProcesses,
  removeProcess,
  saveDraft,
  saveSystem,
  upsertProcess,
} from "./lib/process";
import type { SystemNav } from "./components/StudioShell";
import { fetchPlan, loadPlan, savePlan } from "./lib/plans";

/** The adapted questions for the current task: being made, ready, or not used. */
export type PlanState = { task: string; status: "loading" | "ready" | "standard"; response?: InterviewResponse; note?: string };

const TITLES: Record<Route["name"], string> = {
  home: "Agent Architecture Guide",
  guide: "Guide | Agent Architecture Guide",
  details: "Guide | Agent Architecture Guide",
  review: "Your answers | Agent Architecture Guide",
  split: "Your jobs | Agent Architecture Guide",
  process: "Your system | Agent Architecture Guide",
  result: "Your result | Agent Architecture Guide",
  how: "How it decides | Agent Architecture Guide",
  history: "History | Agent Architecture Guide",
};

/** The finished example behind "Explore an example" on the start page. */
const EXAMPLE: Answers = {
  task: "Tailor resumes to job descriptions",
  shape: "varies",
  kinds: "yes",
  roles: "specialists",
  quality: "partly",
  knowledge: ["playbook", "reference", "memory"],
  systems: "none",
  trigger: "schedule",
  volume: "occasional",
  risks: ["visible", "irreversible", "personal"],
  location: "independence",
  team: "small",
  details: [
    { q: "What format should the tailored resume be delivered in?", a: "PDF" },
    { q: "What changes may it make to the source resume?", a: "Add facts from other supplied materials" },
    { q: "What should happen before a tailored resume is used?", a: "A person reviews every resume" },
  ],
};

export default function App() {
  const route = useRoute();
  const [answers, setAnswers] = useState<Answers>(loadAnswers);
  const [editing, setEditing] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [invalidLink, setInvalidLink] = useState(false);
  const adopted = useRef<string | undefined>(undefined);
  // Which saved entry the current answers belong to.
  const [sessionId, setSessionIdState] = useState(loadSessionId);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const setSession = (id: string) => {
    setSessionIdState(id);
    saveSessionId(id);
  };

  useEffect(() => saveAnswers(answers), [answers]);

  // After a problem is described on the start page: the questions the AI
  // answered from the description (null on every other path), and the
  // description while it's being read.
  const [described, setDescribedState] = useState<QuestionId[] | null>(() => loadDescribed() as QuestionId[] | null);
  const setDescribed = (ids: QuestionId[] | null) => {
    setDescribedState(ids);
    saveDescribed(ids);
  };
  // `split`: a description from the start page, which may hold several jobs.
  // `title`: a job of a confirmed split, read under its own name.
  const [reading, setReading] = useState<{ text: string; split?: boolean; title?: string } | null>(null);

  // A description read as several jobs, waiting to be confirmed; then the
  // confirmed jobs being worked through, one at a time.
  const [proposal, setProposal] = useState<{ text: string; split: Split } | null>(null);
  const [draft, setDraftState] = useState<ProcessDraft | null>(loadDraft);
  const setDraft = (d: ProcessDraft | null) => {
    setDraftState(d);
    saveDraft(d);
  };
  // The process being looked at, so each of its jobs' results shows its place in it.
  const [system, setSystemState] = useState(loadSystem);
  const setSystem = (v: { id: string; code: string } | null) => {
    setSystemState(v);
    saveSystem(v);
  };
  const systemProcess = useMemo(() => (system ? decodeProcess(system.code) : null), [system]);
  const [processes, setProcesses] = useState(loadProcesses);

  // While working through the guide, the questions are adapted to the task by
  // the local AI server: once per task, then kept in the browser.
  const [plan, setPlan] = useState<PlanState | undefined>(undefined);
  const inGuide = route.name === "guide" || route.name === "details" || route.name === "review";
  useEffect(() => {
    const task = answers.task?.trim();
    if (!AI_ENABLED || !task || !inGuide) return;
    if (plan?.task === task) return;
    const saved = loadPlan(task);
    if (saved) {
      setPlan({ task, status: "ready", response: saved });
      return;
    }
    const ctl = new AbortController();
    setPlan({ task, status: "loading" });
    fetchPlan(task, ctl.signal)
      .then((response) => {
        savePlan(task, response);
        setPlan({ task, status: "ready", response });
      })
      .catch((e: Error) => {
        if (!ctl.signal.aborted) setPlan({ task, status: "standard", note: e.message });
      });
    return () => ctl.abort();
  }, [answers.task, inGuide]); // eslint-disable-line react-hooks/exhaustive-deps -- plan is read only to skip a repeat fetch
  const currentPlan = plan && plan.task === answers.task?.trim() ? plan : undefined;

  // Read a described problem. From the start page it may be several jobs: then
  // they're shown to confirm first. One job (or each confirmed job in turn) has
  // what it settles answered, and only the rest is asked (then, after any
  // task-specific questions, the answers are shown for review).
  useEffect(() => {
    if (!reading) return;
    const ctl = new AbortController();
    const { text } = reading;
    const short = text.length <= MAX_DESCRIPTION;
    // A short description's questions are read alongside the split, in case it's one job.
    const early = short ? fetchPlan(text, ctl.signal) : undefined;
    early?.catch(() => {});
    (async () => {
      let jobText = text.slice(0, MAX_DESCRIPTION);
      let title = reading.title;
      if (reading.split) {
        const s = await fetchSplit(text, ctl.signal).catch(() => null);
        if (ctl.signal.aborted) return;
        if (s && isSplit(s.split)) {
          setProposal({ text, split: s.split });
          setReading(null);
          setDirection(1);
          navigate({ name: "split" });
          return;
        }
        // A long description that is one job is read from the split's own account of it.
        if (!short && s) {
          jobText = s.split.jobs[0].description;
          title = s.split.jobs[0].title;
        }
      }
      const response = await (early ?? fetchPlan(jobText, ctl.signal));
      if (ctl.signal.aborted) return;
      const task = title ?? taskTitle(jobText, response.plan);
      savePlan(task, response);
      const { answers: filled, filled: ids } = fillFromPlan(task, response.plan);
      setPlan({ task, status: "ready", response });
      setAnswers(filled);
      setDescribed(ids);
      setReading(null);
      setDirection(1);
      const next = firstUnanswered(filled);
      if (next) navigate({ name: "guide", q: next.id });
      else navigate(response.plan.details.length ? { name: "details" } : { name: "review" });
    })().catch((e: Error) => {
      if (ctl.signal.aborted) return;
      // It couldn't be read: carry on with the questions, the description as the task.
      setPlan({ task: reading.title ?? taskTitle(text), status: "standard", note: e.message });
      setReading(null);
    });
    return () => ctl.abort();
  }, [reading]); // eslint-disable-line react-hooks/exhaustive-deps -- runs once per description

  /** Starts on one job of a confirmed split: its description is read like any other. */
  const startJob = (d: ProcessDraft, i: number) => {
    const job = d.jobs[i];
    setSession(newSessionId());
    setDescribed(null);
    setEditing(false);
    setInvalidLink(false);
    setDirection(1);
    setAnswers({ task: job.title });
    setPlan({ task: job.title, status: "loading" });
    setReading({ text: job.description, title: job.title });
    navigate({ name: "guide", q: "shape" });
  };

  const openProcess = (p: Process, id: string) => {
    const code = processCode(p);
    setSystem({ id, code });
    setProcesses(upsertProcess(id, p));
    navigate({ name: "process", code });
  };

  // A process link opens its map, and is saved like a result.
  useEffect(() => {
    if (route.name !== "process" || !route.code || system?.code === route.code) return;
    const p = decodeProcess(route.code);
    if (!p) return;
    const id = processes.find((e) => e.code === route.code)?.id ?? newSessionId();
    setSystem({ id, code: route.code });
    setProcesses(upsertProcess(id, p));
  }, [route]); // eslint-disable-line react-hooks/exhaustive-deps -- once per link

  // Which job of the process the result on screen is. A job whose answers are
  // edited stays that job: the process takes the new answers.
  const part = route.name === "result" && systemProcess ? partOf(systemProcess, resultCode(answers)) : -1;
  const lastPart = useRef<{ session: string; index: number } | null>(null);
  useEffect(() => {
    if (part >= 0) {
      lastPart.current = { session: sessionId, index: part };
      return;
    }
    const last = lastPart.current;
    if (route.name !== "result" || !isComplete(answers) || !system || !systemProcess || last?.session !== sessionId) return;
    const p = { ...systemProcess, parts: systemProcess.parts.map((a, i) => (i === last.index ? answers : a)) };
    setSystem({ id: system.id, code: processCode(p) });
    setProcesses(upsertProcess(system.id, p));
  }, [part, answers, sessionId, route.name]); // eslint-disable-line react-hooks/exhaustive-deps
  const systemNav = (p: Process, code: string, current: number, onMap: boolean): SystemNav => ({
    title: p.title,
    mapHref: href({ name: "process", code }),
    onMap,
    jobs: p.parts.map((a, i) => ({ label: a.task ?? `Job ${i + 1}`, href: href({ name: "result", code: resultCode(a) }), current: i === current })),
  });

  // The start page and a finished result have their own header and footer, so the app's step aside.
  // The full-screen logo intro plays on a visitor's first open only, and ends by revealing the start page's heading.
  const [intro, setIntro] = useState<"playing" | "revealing" | "done">(() => (shouldPlayIntro() ? "playing" : "done"));
  const revealAfterIntro = useCallback(() => setIntro("revealing"), []);
  const endIntro = useCallback(() => setIntro("done"), []);
  const studio = route.name === "home" || inGuide || route.name === "split" || route.name === "process" || (route.name === "result" && isComplete(answers));
  const planDetails = currentPlan?.status === "ready" ? (currentPlan.response?.plan.details ?? []) : [];

  // Every result reached is saved; edits update the same entry.
  useEffect(() => {
    if (route.name === "result" && isComplete(answers)) setHistory(upsertHistory(sessionId, answers));
  }, [route.name, answers, sessionId]);

  // A shared result link carries its answers; adopt them once per link.
  useEffect(() => {
    if (route.name !== "result" || !route.code || adopted.current === route.code) return;
    adopted.current = route.code;
    if (route.code === resultCode(answers)) return;
    const decoded = decodeAnswers(route.code);
    if (decoded && Object.keys(decoded).length) {
      // A link seen before reopens its entry; a new one starts its own.
      setSession(findByCode(resultCode(decoded))?.id ?? newSessionId());
      setAnswers(decoded);
      setInvalidLink(!isComplete(decoded));
    } else {
      setInvalidLink(true);
    }
  }, [route, answers]);

  // Keep the result URL in step with the answers, so the address bar is always shareable.
  useEffect(() => {
    if (route.name === "result" && isComplete(answers)) replaceHash({ name: "result", code: resultCode(answers), view: route.view });
  }, [route.name, answers]);

  // Never show a question out of order or one that no longer applies, nor the review before every question is answered.
  useEffect(() => {
    if (route.name === "review" && !isComplete(answers)) {
      navigate({ name: "guide", q: (firstUnanswered(answers) ?? activeQuestions(answers)[0]).id });
      return;
    }
    if (route.name !== "guide") return;
    const active = activeQuestions(answers);
    const idx = active.findIndex((q) => q.id === route.q);
    const gap = active.slice(0, Math.max(idx, 0)).find((q) => !isAnswered(q, answers));
    if (idx === -1 || gap) navigate({ name: "guide", q: (gap ?? firstUnanswered(answers) ?? active[0]).id });
  }, [route, answers]);

  // Page title, scroll position and focus on navigation.
  const routeKey = route.name === "how" ? `how/${route.section ?? ""}` : route.name;
  useEffect(() => {
    document.title = TITLES[route.name];
    if (route.name === "how" && route.section) {
      requestAnimationFrame(() => document.getElementById(route.section!)?.scrollIntoView({ block: "start" }));
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const cta = useMemo((): { label: string; to: Route } => {
    if (isComplete(answers)) return { label: "See your result", to: { name: "result" } };
    const next = firstUnanswered(answers);
    if (answers.task && next) return { label: "Resume the guide", to: { name: "guide", q: next.id } };
    return { label: "Start the guide", to: { name: "guide", q: "task" } };
  }, [answers]);

  // Finishing the survey hands over to the result with a few lines on screen,
  // while the result, open underneath, starts building the tools with AI.
  const [handover, setHandover] = useState(false);
  const endHandover = useCallback(() => setHandover(false), []);
  const toResult = () => {
    if (AI_ENABLED) setHandover(true);
    navigate({ name: "result" });
  };
  // A described problem ends on the review of its answers; the survey goes straight to the result.
  const finish = () => (described || draft ? navigate({ name: "review" }) : toResult());
  // After a description, only the questions it didn't settle are asked; these are the ones to step back through.
  const asked = (a: Answers) => activeQuestions(a).filter((q) => q.id !== "task" && !(described ?? []).includes(q.id));

  const handleAnswer = (next: Answers, from: QuestionId) => {
    setAnswers(next);
    setInvalidLink(false);
    setDirection(1);
    // An answer given here is the owner's own, not one read from their description.
    if (described?.includes(from)) setDescribed(described.filter((id) => id !== from));
    if (editing && isComplete(next)) {
      setEditing(false);
      finish();
      return;
    }
    const active = activeQuestions(next);
    const following = editing || described ? firstUnanswered(next) : active[active.findIndex((q) => q.id === from) + 1];
    const target = following ?? firstUnanswered(next);
    if (target) navigate({ name: "guide", q: target.id });
    else if (!editing && planDetails.length && next.details === undefined) navigate({ name: "details" });
    else {
      setEditing(false);
      finish();
    }
  };

  const handleDetails = (details: Detail[]) => {
    setAnswers((a) => ({ ...a, details }));
    setDirection(1);
    finish();
  };

  const handleBack = (from: QuestionId) => {
    setDirection(-1);
    if (editing) {
      setEditing(false);
      navigate(described ? { name: "review" } : { name: "result" });
      return;
    }
    const active = activeQuestions(answers);
    const idx = active.findIndex((q) => q.id === from);
    if (described) {
      const prev = asked(answers).filter((q) => active.indexOf(q) < idx).pop();
      navigate(prev ? { name: "guide", q: prev.id } : draft && proposal ? { name: "split" } : { name: "home" });
      return;
    }
    if (idx <= 0) navigate({ name: "home" });
    else navigate({ name: "guide", q: active[idx - 1].id });
  };

  const startOver = () => {
    setSession(newSessionId());
    setDraft(null);
    setSystem(null);
    setDescribed(null);
    setReading(null);
    setAnswers({});
    setEditing(false);
    setInvalidLink(false);
    setDirection(1);
    navigate({ name: "guide", q: "task" });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg text-ink">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById("main");
          if (!main) return;
          main.setAttribute("tabindex", "-1");
          main.focus();
          main.scrollIntoView();
        }}
        className="sr-only z-50 rounded-full bg-accent px-4 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>
      {/* The start page, the survey and a finished result have their own studio frames, so the top bar steps aside. */}
      {!studio && <Nav route={route} cta={cta} historyCount={history.length} />}
      <div className="flex-1 [&>main]:outline-none">
        {route.name === "home" && (
          <Landing
            introPlaying={intro === "playing"}
            onTask={(text) => {
              // A described problem begins a new entry. With AI it's read first
              // (see the reading effect); without, it becomes the first answer.
              setSession(newSessionId());
              setEditing(false);
              setInvalidLink(false);
              setDirection(1);
              setDescribed(null);
              setDraft(null);
              setProposal(null);
              setSystem(null);
              if (AI_ENABLED) {
                const task = taskTitle(text);
                setAnswers({ task });
                setPlan({ task, status: "loading" });
                setReading({ text, split: true });
              } else {
                setAnswers({ task: text.slice(0, MAX_TASK_TITLE) });
              }
              navigate({ name: "guide", q: "shape" });
            }}
            onSurvey={startOver}
            onExample={() => {
              setSession(findByCode(resultCode(EXAMPLE))?.id ?? newSessionId());
              setDescribed(null);
              setAnswers(EXAMPLE);
              setEditing(false);
              setInvalidLink(false);
              navigate({ name: "result", code: resultCode(EXAMPLE) });
            }}
          />
        )}
        {route.name === "guide" && (
          <SurveyFrame>
            <Guide
              qid={route.q}
              answers={answers}
              editing={editing}
              direction={direction}
              plan={currentPlan}
              reading={reading?.text}
              job={draft ? { index: draft.current, total: draft.jobs.length } : undefined}
              described={described ?? undefined}
              onUseStandard={() => {
                setReading(null);
                if (answers.task) setPlan({ task: answers.task.trim(), status: "standard" });
              }}
              onAnswer={handleAnswer}
              onBack={handleBack}
              onCancelEdit={() => {
                setEditing(false);
                navigate(described ? { name: "review" } : { name: "result" });
              }}
            />
          </SurveyFrame>
        )}
        {AI_ENABLED && route.name === "details" && (
          <SurveyFrame>
            <Details
              key={currentPlan?.status ?? "none"}
              questions={planDetails}
              // Not ready until this task's plan has been looked up (it isn't, on the first render after a reload).
              ready={!answers.task || (!!currentPlan && currentPlan.status !== "loading")}
              answers={answers}
              onSubmit={handleDetails}
              onBack={() => {
                setDirection(-1);
                const last = described ? asked(answers).pop() : activeQuestions(answers).pop();
                navigate(last ? { name: "guide", q: last.id } : { name: "home" });
              }}
            />
          </SurveyFrame>
        )}
        {AI_ENABLED && route.name === "review" && (
          <SurveyFrame>
            <Review
              answers={answers}
              plan={currentPlan?.response?.plan}
              described={described ?? []}
              onChange={(q) => {
                setEditing(true);
                setDirection(1);
                navigate({ name: "guide", q });
              }}
              onBack={() => {
                setDirection(-1);
                if (planDetails.length) return navigate({ name: "details" });
                const last = asked(answers).pop();
                navigate(last ? { name: "guide", q: last.id } : { name: "home" });
              }}
              job={draft ? { index: draft.current, total: draft.jobs.length, next: draft.jobs[draft.current + 1]?.title } : undefined}
              onConfirm={() => {
                setDescribed(null);
                setDirection(1);
                if (!draft) return toResult();
                // A job of a split: on to the next one, or, after the last, the whole system.
                const done = [...draft.done];
                done[draft.current] = answers;
                if (draft.current + 1 < draft.jobs.length) {
                  const d = { ...draft, done, current: draft.current + 1 };
                  setDraft(d);
                  return startJob(d, d.current);
                }
                setDraft(null);
                setProposal(null);
                openProcess({ title: draft.title, parts: done, handoffs: draft.handoffs }, newSessionId());
              }}
            />
          </SurveyFrame>
        )}
        {AI_ENABLED && route.name === "split" && proposal && (
          <SurveyFrame>
            <SplitReview
              split={proposal.split}
              onBack={() => navigate({ name: "home" })}
              onKeepOne={() => {
                // The whole description as one task, read from the split's account of it when it's long.
                const { text, split } = proposal;
                const one = text.length <= MAX_DESCRIPTION ? text : split.jobs.map((j) => j.description).join(" ").slice(0, MAX_DESCRIPTION);
                setDraft(null);
                setReading({ text: one, title: text.length <= MAX_TASK_TITLE ? undefined : split.title });
                navigate({ name: "guide", q: "shape" });
              }}
              onConfirm={(split) => {
                if (split.jobs.length < 2) {
                  setDraft(null);
                  setReading({ text: split.jobs[0].description, title: split.jobs[0].title });
                  return navigate({ name: "guide", q: "shape" });
                }
                const d: ProcessDraft = { title: split.title, jobs: split.jobs, handoffs: split.handoffs, current: 0, done: [] };
                setDraft(d);
                startJob(d, 0);
              }}
            />
          </SurveyFrame>
        )}
        {route.name === "process" &&
          (route.code && decodeProcess(route.code) ? (
            <ProcessMap
              process={decodeProcess(route.code)!}
              code={route.code}
              historyCount={history.length}
              onNew={() => {
                setSystem(null);
                navigate({ name: "home" });
              }}
            />
          ) : (
            <main id="main" className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
              <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">This link doesn't contain a complete system</h1>
              <p className="mt-4 max-w-[55ch] text-[17px] leading-relaxed text-muted">It may have been cut short when it was copied.</p>
              <a href="#/" className="mt-8 inline-flex text-accent underline-offset-4 hover:underline">
                Start from the beginning
              </a>
            </main>
          ))}
        {route.name === "result" && (
          <Result
            answers={answers}
            saved={history.some((e) => e.id === sessionId)}
            invalidLink={invalidLink}
            onStartOver={startOver}
            onChange={(q) => {
              setEditing(true);
              setDirection(1);
              navigate({ name: "guide", q });
            }}
            view={route.view ?? "solution"}
            onView={(view) => navigate({ name: "result", code: resultCode(answers), view })}
            historyCount={history.length}
            system={part >= 0 && systemProcess && system ? systemNav(systemProcess, system.code, part, false) : undefined}
          />
        )}
        {route.name === "how" && <HowItWorks cta={cta} />}
        {route.name === "history" && (
          <History
            entries={history}
            currentId={sessionId}
            onChange={setHistory}
            onOpen={(entry) => {
              const decoded = decodeAnswers(entry.code);
              if (!decoded) return;
              setSession(entry.id);
              setDescribed(null);
              setAnswers(decoded);
              setEditing(false);
              setInvalidLink(false);
              adopted.current = entry.code;
              navigate({ name: "result", code: entry.code });
            }}
            onStart={startOver}
            systems={processes}
            onRemoveSystem={(id) => {
              setProcesses(removeProcess(id));
              if (system?.id === id) setSystem(null);
            }}
            onClearSystems={() => {
              clearProcesses();
              setProcesses([]);
              setSystem(null);
            }}
          />
        )}
      </div>
      {!inGuide && !studio && <Footer />}
      {handover && route.name === "result" && <BuildOverlay onDone={endHandover} />}
      {intro !== "done" && <BrandIntro onReveal={revealAfterIntro} onDone={endIntro} />}
    </div>
  );
}
