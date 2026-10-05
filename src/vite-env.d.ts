/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" turns on AI tailoring in local development. Set in .env.development only. */
  readonly VITE_AI_TAILORING?: string;
}
