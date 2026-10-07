import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Footer, Nav } from "./components/Shell";
import { BrandIntro, shouldPlayIntro } from "./components/Brand";
import { SurveyFrame } from "./components/StudioShell";
import { Details, Guide } from "./pages/Guide";
import { History } from "./pages/History";
import { HowItWorks } from "./pages/HowItWorks";
import { Landing } from "./pages/Landing";
import { Result } from "./pages/Result";
import {
  type Answers,
  type QuestionId,
  activeQuestions,
  firstUnanswered,
  isAnswered,
  isComplete,
} from "./lib/questions";
import { navigate, replaceHash, useRoute, type Route } from "./lib/router";
import { decodeAnswers, resultCode } from "./lib/share";
import { loadAnswers, saveAnswers } from "./lib/storage";
import { type HistoryEntry, findByCode, loadHistory, loadSessionId, newSessionId, saveSessionId, upsertHistory } from "./lib/history";
import { AI_ENABLED } from "./lib/features";
import type { Detail, InterviewResponse } from "./lib/interview";
import { fetchPlan, loadPlan, savePlan } from "./lib/plans";

/** The adapted questions for the current task: being made, ready, or not used. */
export type PlanState = { task: string; status: "loading" | "ready" | "standard"; response?: InterviewResponse; note?: string };

const TITLES: Record<Route["name"], string> = {
  home: "Agent Architecture Guide",
  guide: "Guide | Agent Architecture Guide",
  details: "Guide | Agent Architecture Guide",
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

  // While working through the guide, the questions are adapted to the task by
  // the local AI server: once per task, then kept in the browser.
  const [plan, setPlan] = useState<PlanState | undefined>(undefined);
  const inGuide = route.name === "guide" || route.name === "details";
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
  // The start page and a finished result have their own header and footer, so the app's step aside.
  // The full-screen logo intro plays on a visitor's first open only, and ends by revealing the start page's heading.
  const [intro, setIntro] = useState<"playing" | "revealing" | "done">(() => (shouldPlayIntro() ? "playing" : "done"));
  const revealAfterIntro = useCallback(() => setIntro("revealing"), []);
  const endIntro = useCallback(() => setIntro("done"), []);
  const studio = route.name === "home" || inGuide || (route.name === "result" && isComplete(answers));
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

  // Never show a question out of order or one that no longer applies.
  useEffect(() => {
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

  const handleAnswer = (next: Answers, from: QuestionId) => {
    setAnswers(next);
    setInvalidLink(false);
    setDirection(1);
    if (editing && isComplete(next)) {
      setEditing(false);
      navigate({ name: "result" });
      return;
    }
    const active = activeQuestions(next);
    const following = editing ? firstUnanswered(next) : active[active.findIndex((q) => q.id === from) + 1];
    const target = following ?? firstUnanswered(next);
    if (target) navigate({ name: "guide", q: target.id });
    else if (!editing && planDetails.length && next.details === undefined) navigate({ name: "details" });
    else {
      setEditing(false);
      navigate({ name: "result" });
    }
  };

  const handleDetails = (details: Detail[]) => {
    setAnswers((a) => ({ ...a, details }));
    setDirection(1);
    navigate({ name: "result" });
  };

  const handleBack = (from: QuestionId) => {
    setDirection(-1);
    if (editing) {
      setEditing(false);
      navigate({ name: "result" });
      return;
    }
    const active = activeQuestions(answers);
    const idx = active.findIndex((q) => q.id === from);
    if (idx <= 0) navigate({ name: "home" });
    else navigate({ name: "guide", q: active[idx - 1].id });
  };

  const startOver = () => {
    setSession(newSessionId());
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
            onTask={(task) => {
              // A problem typed on the start page begins a new entry, unless it's the unfinished one already under way.
              if (isComplete(answers) || answers.task?.trim() !== task) {
                setSession(newSessionId());
                setAnswers({ task });
              }
              setEditing(false);
              setDirection(1);
              navigate({ name: "guide", q: "shape" });
            }}
            onSurvey={startOver}
            onExample={() => {
              setSession(findByCode(resultCode(EXAMPLE))?.id ?? newSessionId());
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
              onUseStandard={() => answers.task && setPlan({ task: answers.task.trim(), status: "standard" })}
              onAnswer={handleAnswer}
              onBack={handleBack}
              onCancelEdit={() => {
                setEditing(false);
                navigate({ name: "result" });
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
                const active = activeQuestions(answers);
                navigate({ name: "guide", q: active[active.length - 1].id });
              }}
            />
          </SurveyFrame>
        )}
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
              setAnswers(decoded);
              setEditing(false);
              setInvalidLink(false);
              adopted.current = entry.code;
              navigate({ name: "result", code: entry.code });
            }}
            onStart={startOver}
          />
        )}
      </div>
      {!inGuide && !studio && <Footer />}
      {intro !== "done" && <BrandIntro onReveal={revealAfterIntro} onDone={endIntro} />}
    </div>
  );
}
