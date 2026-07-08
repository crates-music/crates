export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: Fetcher;

  // Vars (wrangler.jsonc "vars", overridable per environment)
  SPOTIFY_REDIRECT_URI: string; // where Spotify redirects back (this Worker's /v1/auth/callback)
  CRATES_AUTH_CALLBACK_URI: string; // the Angular app's /auth/callback

  // Secrets (wrangler secret put / .dev.vars)
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  CRATES_ENCRYPTION_KEY: string;
}
