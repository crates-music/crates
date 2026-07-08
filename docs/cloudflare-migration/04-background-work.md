# Phase 4 — Background Work

## Library sync → Cloudflare Workflow

Today (`LibrarySyncServiceImpl`): fire-and-forget `new Thread` per login/sync request,
fully sequential — contains-checks 20 albums/call, saved-albums pages of 25, plus one
`GET /artists/{id}` per artist needing genres. A 2,000-album first sync ≈ 1,200 Spotify
calls over minutes, with no durability or back-pressure.

New: `LibrarySyncWorkflow` (one instance per user; instance id = user id so concurrent
triggers dedupe):

1. **Step: removals pass** (skip on FIRST_SYNC) — page existing `library_album` rows,
   `GET /me/albums/contains` in 20-id batches, archive missing. Batch ~40 calls/step.
2. **Step(s): import pass** — `GET /me/albums` limit 50 (Spotify max; Java used 25),
   upsert album/artist/genre/joins + `library_album` per page via `db.batch()`.
   ~10 pages per step.
3. **Step: artist genre enrichment** — collect artists with `genres_fetched = 0`, fetch
   via **batched `GET /artists?ids=` (50 per call)** instead of one call each: 1,000
   artists = 20 calls, one step.
4. **Step: finalize** — set library state, `updated_at`.

Each step is its own invocation (own subrequest budget), automatically retried, resumable.
Token refresh inside steps reuses the phase-3 refresh wrapper.
Library states (`FIRST_SYNC` → syncing → synced) drive the existing frontend polling
behavior unchanged.

## Cron (one hourly trigger, both jobs in the `scheduled` handler)

- **Trending recompute** — replaces `TrendingServiceImpl` (loads all public crates, 2–3
  count queries each, saves one by one). New: one set-based statement computing weighted
  view counts per crate from `crate_view` (GROUP BY crate_id over time windows) +
  one UPDATE ... FROM. At 2.6k crates / 2k views this is milliseconds.
- **MCP key cleanup** — `DELETE FROM mcp_api_key WHERE expires_at < ?`.
- (PKCE cleanup from `PKCEServiceImpl` disappears — KV TTL handles expiry.)

## KV usage

| Key | Value | TTL |
|---|---|---|
| `pkce:{state}` | code verifier | 10 min |
| `spotify:service-token` | client-credentials access token | expires_in − 5 min |

## Config additions (wrangler.jsonc)

- `workflows` binding: `LIBRARY_SYNC` → class `LibrarySyncWorkflow`
- `triggers.crons`: `["0 * * * *"]`
- KV binding `KV` (namespace created in phase 1 scaffold)
