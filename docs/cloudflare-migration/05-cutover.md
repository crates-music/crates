# Phase 5 — Cutover

Prereqs: phases 1–4 done; `crates.music` / `app.crates.music` DNS zone on Cloudflare
(custom domains for Workers require the zone on the account).

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
