# Phase 5 — Cutover

Prereqs: phases 1–4 done; `crates.music` / `app.crates.music` DNS zone on Cloudflare
(custom domains for Workers require the zone on the account).

## Already in place

- D1 `crates` (`wrangler d1 info crates`) and the KV namespace both exist on the
  account, and the ids in `wrangler.jsonc` are the real ones.
- `wrangler.jsonc` `vars` hold **production** values; `.dev.vars` overrides them for
  local dev. A deploy therefore cannot accidentally ship a loopback redirect URI.
- `scripts/import-d1.sh --local|--remote` runs the import in FK order, stops on the
  first failure, and is re-runnable (`000_wipe.sql` clears everything first).

**There is no `wrangler d1 import`** — it does not exist in wrangler 4.x, so
`d1 execute --file` is the only path, and it is why the export caps statements at
60 KB. Remote `execute --file` **does** accept the ~24 MB chunks; no re-chunking
needed.

## Rehearsal (done)

Imported into the real D1 and deployed to `*.workers.dev`:

- All 15 table counts match the export manifest; `PRAGMA foreign_key_check` clean;
  D1 reports 142 MB.
- Parity harness run against the **deployed** Worker on the **remote** D1, diffed
  against live production: **51/51 clean, 0 unexpected diffs**
  (`--worker https://<name>.<subdomain>.workers.dev --skip-site`).
- Workflow `crates-library-sync` and the hourly cron are registered; all three
  secrets are set.

**The SSR site cannot be rehearsed on `*.workers.dev`.** This plan originally assumed
a `Host: crates.music` override would work — it does not. Cloudflare's edge returns
**403** for a Host header that doesn't match the hostname it was reached on, so the
`crates.music` half of the Worker is unreachable until the domain is attached. Hence
`--skip-site` on the harness. The SSR code is otherwise identical to what passed 130
local cases against prod, so the residual risk is environmental (assets binding, KV),
not logical — verify it immediately after attaching the domain, while DO is still up.

## Remote sequence

```bash
cd crates-worker
npx wrangler d1 migrations apply crates --remote     # schema
node --env-file=.dev.vars scripts/export-pg-to-d1.mjs # fresh export
./scripts/import-d1.sh --remote                       # data
npx wrangler secret put SPOTIFY_CLIENT_ID             # x3, interactive
npx wrangler secret put SPOTIFY_CLIENT_SECRET
npx wrangler secret put CRATES_ENCRYPTION_KEY         # must be the prod key
npm run deploy                                        # builds .assets, then deploys
```

Before the deploy is useful for login testing, register the deployed origin's
`/api/v1/auth/callback` in the Spotify app — a `*.workers.dev` rehearsal needs its own
entry, and read-only paths (public site, public API) work without it.

Rebuild the Angular app (`cd crates-frontend && yarn build:prod`) if it has changed
since the last `dist/` — `npm run deploy` stages whatever is there, it does not rebuild.

1. **Dress rehearsal**: fresh prod export → import into the real (remote) D1; run the
   phase-2/3 comparison harnesses against the deployed Worker on a temporary
   `*.workers.dev` URL with `Host` overrides. Fix drift.
2. **Freeze + final import**: put DO stack in a quiet window (announce, or just pick 4am —
   462 users), re-run export/import (drop + recreate D1 tables, re-import; it's minutes
   at this size). Verify row counts.
3. **Flip DNS**: attach custom domains `app.crates.music` and `crates.music` (+
   `crates.page` redirect) to the Worker. TTLs are Cloudflare-proxied so the flip is
   effectively instant.
4. **Watch**: `wrangler tail` + Workers analytics for error rates; spot-check login flow,
   a library sync, crate CRUD, public pages, MCP flow. Keep LogRocket/GA (client-side,
   unaffected) as a second signal.
5. **Rollback plan**: DNS back to DO (stack left running but idle for ~2 weeks). D1 writes
   made during the Worker window would be lost on rollback — acceptable at this scale, or
   re-export from D1 (`wrangler d1 export`) if needed.
6. **Decommission**: after the soak, destroy the droplet(s) and managed Postgres; final
   `pg_dump` archived somewhere cold first. Cancel anything DO-billed.

## Post-cutover cleanup

- Retire `crates-backend` deploy scripts / `restart.sh` docs in CLAUDE.md; document the
  new dev loop (`wrangler dev`, `wrangler d1 migrations`).
- D1 Time Travel (30 days on paid) is the backup story; optionally add a weekly
  `wrangler d1 export` GitHub Action for cold backups.
- Consider hashing `token.auth_token` (deferred hardening item from phase 1).
