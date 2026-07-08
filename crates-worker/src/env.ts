export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: Fetcher;
  // Secrets (wrangler secret put / .dev.vars):
  // SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, CRATES_ENCRYPTION_KEY (phase 3)
}
