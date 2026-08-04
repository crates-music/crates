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
60 KB. The largest chunk is ~24 MB; whether remote `execute --file` accepts that is
the one thing still unverified, and the first remote import will settle it. If it
balks, re-export with a smaller `ROWS_PER_FILE` in `export-pg-to-d1.mjs`.

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
