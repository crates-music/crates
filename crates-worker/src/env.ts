import type { LibrarySyncParams } from './workflows/library-sync';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: Fetcher;
  LIBRARY_SYNC: Workflow<LibrarySyncParams>;

  // Vars (wrangler.jsonc "vars", overridable per environment)
  SPOTIFY_REDIRECT_URI: string; // where Spotify redirects back (this Worker's /v1/auth/callback)
  CRATES_AUTH_CALLBACK_URI: string; // the Angular app's /auth/callback
  CRATES_MCP_BASE_URL: string; // public origin advertised in the MCP manifest
  CRATES_MCP_REDIRECT_URI: string; // Spotify redirect for the MCP OAuth proxy

  // Secrets (wrangler secret put / .dev.vars)
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  CRATES_ENCRYPTION_KEY: string;
}
