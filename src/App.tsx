import { useEffect, useMemo, useRef, useState } from "react";
import { Footer, Nav } from "./components/Shell";
import { Guide } from "./pages/Guide";
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

const TITLES: Record<Route["name"], string> = {
  home: "Agent Architecture Guide",
  guide: "Guide | Agent Architecture Guide",
  result: "Your result | Agent Architecture Guide",
  how: "How it decides | Agent Architecture Guide",
  history: "History | Agent Architecture Guide",
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
    if (route.name === "result" && isComplete(answers)) replaceHash({ name: "result", code: resultCode(answers) });
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
    else {
      setEditing(false);
      navigate({ name: "result" });
    }
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
      <Nav route={route} cta={cta} historyCount={history.length} />
      <div className="flex-1 [&>main]:outline-none">
        {route.name === "home" && (
          <Landing
            cta={cta}
            onTask={(task) => {
              // A new task typed on the home page is a new entry, unless it's unfinished work being renamed.
              if (isComplete(answers)) setSession(newSessionId());
              setAnswers((a) => ({ ...a, task }));
              setDirection(1);
              navigate({ name: "guide", q: "shape" });
            }}
          />
        )}
        {route.name === "guide" && (
          <Guide
            qid={route.q}
            answers={answers}
            editing={editing}
            direction={direction}
            onAnswer={handleAnswer}
            onBack={handleBack}
            onCancelEdit={() => {
              setEditing(false);
              navigate({ name: "result" });
            }}
          />
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
      {route.name !== "guide" && <Footer />}
    </div>
  );
}
