// AI features (adaptive questions and workflow tailoring) need a server and an
// API key, so they are switched on only for local development and are never
// part of the published build: `npm run build` ignores .env.development, where
// the switch lives.
export const AI_ENABLED = import.meta.env.VITE_AI_TAILORING === "true";
