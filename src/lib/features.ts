// Experimental features, switched on only for local development.
// AI tailoring needs a server and an API key, so it is never part of the
// published build: `npm run build` ignores .env.development, where the switch lives.
export const AI_TAILORING = import.meta.env.VITE_AI_TAILORING === "true";
