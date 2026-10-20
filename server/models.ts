// The Claude models Blueprint may run, and which one each try uses.
//
// Every AI step answers first on the fast model (Haiku), except tailoring, which
// starts on Sonnet (see STARTS_ON_ESCALATION). When an answer fails the step's
// checks, the one retry goes to the escalation model (Sonnet), which costs about
// 20 times more per token, so it runs only when it's needed. If the retry fails
// too, the step falls back to the rules, as before.
//
// No other model can be configured: an unknown name in .env stops the dev
// server with a message, so nothing quietly runs on a pricier model.
// This file imports nothing, so vite.config.ts can use it directly.

export const FAST_MODEL = "claude-haiku-5-5";
export const ESCALATION_MODEL = "claude-sonnet-5-5";
export const ALLOWED_MODELS = [FAST_MODEL, ESCALATION_MODEL] as const;
export type ClaudeModel = (typeof ALLOWED_MODELS)[number];

/** Which try a call is: the first answer, or the retry after it failed a check. */
export type Attempt = "first" | "retry";

export type ModelChoice = { model: string; escalationModel?: string };

export function isAllowedModel(name: string): name is ClaudeModel {
  return (ALLOWED_MODELS as readonly string[]).includes(name);
}

/** Reads the model settings from .env. Empty means the default; anything outside the two models throws. */
export function resolveModels(env: { model?: string; escalationModel?: string }): { model: ClaudeModel; escalationModel: ClaudeModel } {
  const model = env.model?.trim() || FAST_MODEL;
  const escalationModel = env.escalationModel?.trim() || ESCALATION_MODEL;
  const settings: [string, string][] = [
    ["ANTHROPIC_MODEL", model],
    ["ANTHROPIC_ESCALATION_MODEL", escalationModel],
  ];
  for (const [name, value] of settings) {
    if (!isAllowedModel(value)) throw new Error(`${name} in .env is "${value}". Blueprint runs only ${ALLOWED_MODELS.join(" or ")}.`);
  }
  return { model: model as ClaudeModel, escalationModel: escalationModel as ClaudeModel };
}

/**
 * Steps whose first try goes straight to the escalation model. In live runs,
 * Haiku's tailored workflow ran past the output limit both times, costing about
 * two minutes before the Sonnet retry, so tailoring starts on Sonnet.
 */
export const STARTS_ON_ESCALATION: readonly string[] = ["tailor"];

/** The models a step uses: Haiku first for most steps, the escalation model for both tries in the steps above. */
export function startingModels(step: string, env: ModelChoice): ModelChoice {
  return STARTS_ON_ESCALATION.includes(step) && env.escalationModel ? { model: env.escalationModel, escalationModel: env.escalationModel } : env;
}

/** The model a try runs on. Without an escalation model, the retry stays on the first model. */
export function modelFor(env: ModelChoice, attempt: Attempt = "first"): string {
  return attempt === "retry" ? (env.escalationModel ?? env.model) : env.model;
}
