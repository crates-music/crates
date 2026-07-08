# Cloudflare Migration Plan

Migrating Crates from DigitalOcean (~$30/mo: Dockerized Spring Boot + Go + PostgreSQL) to
Cloudflare Workers + D1 (~$5/mo Workers Paid).

## Verdict from the audit (2026-07-07)

Feasible with one real redesign (library sync). The app has no file storage, no email, no
WebSockets, a plain relational schema (no JSONB/arrays/triggers/functions), a purely static
Angular SPA, and a small stateless SSR service. Workers Paid removes every free-tier
constraint that mattered (10ms CPU, 100k writes/day, 50 queries/invocation).

Production data: ~1.75M rows, of which 62% is image-URL bookkeeping (`image` +
`album_to_image` + `artist_to_image`), eliminated by denormalizing image URLs onto
`album`/`artist`/`spotify_user` (~660k rows after). ~462 users, 2.6k crates, 2k total
crate views.

## Target architecture

One Worker (`crates-worker/`), routed by hostname:

| Host | Serves |
|---|---|
| `app.crates.music` | Angular SPA as static assets + JSON API under `/api/v1/*` (and `/v1/*` for compat) |
| `crates.music` | Server-rendered public pages (Hono JSX), replaces the Go service |

Resources: one D1 database (`crates`), one KV namespace (PKCE verifiers,
client-credentials Spotify token), one Workflow (library sync), one hourly cron trigger
(trending recompute + MCP key cleanup).

The Angular app is unchanged — `environment.prod.ts` already points at
`https://app.crates.music/api`. The API contract is preserved verbatim.

## Key decisions

1. **Single Worker, hostname routing.** Simplest ops; easy to split later. In local dev,
   `crates.localhost:8787` hits the public site, `localhost:8787` the app (browsers
   resolve `*.localhost` to 127.0.0.1).
2. **TypeScript + Hono.** JSX templates for the SSR pages.
3. **D1 schema is a fresh squashed baseline** (`migrations/0001_init.sql`), not a replay
   of the 18 Flyway migrations. See `01-schema-and-data.md`.
4. **Timestamps become INTEGER epoch milliseconds; booleans INTEGER 0/1.**
5. **Images denormalized** to a JSON TEXT column on `album`, `artist`, `spotify_user`.
   Tables `image`, `album_to_image`, `artist_to_image`, `spotify_user_to_image` are not
   migrated.
6. **Spotify tokens re-encrypted AES-ECB → AES-GCM** during import (WebCrypto has no ECB;
   ECB was weak anyway). Format: `base64(iv[12] || ciphertext || tag[16])`, key = UTF-8
   bytes of `CRATES_ENCRYPTION_KEY` (unchanged secret).
7. **MCP API keys stored as SHA-256 hashes, not encrypted values.** The old scheme relied
   on deterministic ECB for lookup-by-encrypted-value; GCM is non-deterministic, and the
   plaintext key is never needed after issuance. `api_key` → `api_key_hash`.
8. **Auth model preserved:** opaque 256-char `x-crates-auth-token` header → D1 lookup in
   Hono middleware (replaces the `@SpotifyAuthorization` AOP aspect + ThreadLocal).
9. **Dead code not ported:** Last.fm and MusicBrainz clients (unreferenced), Auth0 config
   (was never wired to any JWT validation), dropped social-feature tables.
10. **Library sync becomes a Cloudflare Workflow** with batched `GET /artists?ids=`
    (50/call) genre enrichment — replaces fire-and-forget `new Thread` (see
    `04-background-work.md`).

## Phases

| Phase | Doc | Deliverable |
|---|---|---|
| 1 | [01-schema-and-data.md](01-schema-and-data.md) | Worker scaffold, D1 baseline schema, Postgres→D1 export/transform script |
| 2 | [02-public-surface.md](02-public-surface.md) | `/v1/public/*` on D1 + crates.music SSR pages, parity-checked |
| 3 | [03-authenticated-api.md](03-authenticated-api.md) | OAuth flow, auth middleware, full authenticated API + MCP endpoints |
| 4 | [04-background-work.md](04-background-work.md) | Sync Workflow, trending cron, KV state |
| 5 | [05-cutover.md](05-cutover.md) | Prod import, parallel run, DNS flip, DO decommission |

## Source-of-truth references (existing code)

- API surface: `crates-backend/src/main/java/page/crates/controller/`
- Auth aspect: `security/SpotifyAuthorizationAspect.java`, token issuance in `service/UserServiceImpl.java`
- Encryption: `util/EncryptionConverter.java` (AES/ECB/PKCS5Padding)
- Sync: `service/LibrarySyncServiceImpl.java`, `service/LibraryPageSyncServiceImpl.java`
- Spotify clients: `spotify/client/` (Feign; page size 25 for saved albums, contains-checks 20/call)
- Trending: `service/TrendingServiceImpl.java` (`@Scheduled` hourly)
- Go SSR: `crates-public/main.go` (routes), `backend.go` (public API calls), `templates/`
