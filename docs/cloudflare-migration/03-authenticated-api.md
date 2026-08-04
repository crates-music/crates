# Phase 3 — Authenticated API

## Auth (port of `SpotifyAuthorizationAspect` + `UserServiceImpl`)

- **Login** `GET /v1/auth/login` → 302 to Spotify authorize (scope `user-library-read`,
  random state).
- **Callback** `GET /v1/auth/callback` → exchange code (Basic auth to
  `accounts.spotify.com/api/token`), fetch `/me`, upsert `spotify_user` + `token` row
  (old token row deleted on re-login, as today), generate 256-char alphanumeric
  `auth_token`, 302 to the SPA callback with `?token=`. First-login library sync trigger
  → starts the Workflow (phase 4); until then, synchronous first page + TODO.
- **Middleware**: read `x-crates-auth-token`, look up token→user in D1 (one indexed
  query), attach user to Hono context (`c.set('user', ...)`). 401 on miss — the Angular
  interceptor already handles 401 → re-login.
- **Spotify token refresh**: on 401 from Spotify, refresh with `refresh_token`, GCM
  re-encrypt, update row, retry once (port of `UserTokenServiceImpl` +
  `SpotifyImpl.executeWithRetry`). Feign's 10-attempt exponential retryer becomes a
  small fetch wrapper (3 attempts, jittered backoff, honor `Retry-After` on 429).

## Endpoints to port (contracts unchanged — Angular is untouched)

From the audit of `controller/`:

- **Crates**: POST/GET `/v1/crate`, GET/PUT/DELETE `/v1/crate/{id}`, POST
  `/v1/crate/{id}/album` + `/albums`, DELETE `/v1/crate/{id}/album/{albumId}`, GET
  `/v1/crate/{id}/albums` (search/sort variants incl. artist-name sort)
- **Library**: GET `/v1/library`, GET `/v1/library/albums` (paged/filtered incl.
  uncrated filter — port the native NOT EXISTS queries), GET `/v1/library/albums/search`
  (hybrid DB + Spotify), POST `/v1/library/sync` (starts Workflow)
- **User**: GET `/v1/user/current` (includes live Spotify `/me` validation), PUT
  `/v1/user/profile` (handle/bio/privacy validation: 64-char handle, 280-char bio),
  GET search/profile/handle/{userId}/crates routes
- **Album**: GET `/v1/album` (GLOBAL = Spotify search via client-credentials token from
  KV; LIBRARY = D1)
- **Search**: GET `/v1/search` (users + public crates)
- **Feedback**: POST `/v1/feedback`
- **Auto-categorize**: GET `/v1/auto-categorize/preview`, POST `/v1/auto-categorize` —
  port the strategy engine (`categorization/`, ~1.1k LOC: genre/decade/smart-mix/
  top-artist strategies). Pure in-memory compute; paid-tier CPU (30s) is ample.

## MCP endpoints

- `GET /.well-known/mcp` manifest
- `/mcp/auth`: authorize (PKCE S256, verifier in **KV with 10-min TTL** — replaces the
  in-memory ConcurrentHashMap, which can't work across isolates), callback, token
  (returns opaque `crates_<base64>` API key, 24h expiry, stored as SHA-256 hash)
- `/mcp/web`: library/crates GET+POST/PUT — `Authorization: Bearer` validated by hash
  lookup
- CORS for `/mcp/**` + `/.well-known/**`: chatgpt.com, claude.ai, openai.com,
  anthropic.com, localhost (port of `MCPCorsConfiguration.java`)

## Explicitly not ported

- Auth0 resource-server config (dead — never enforced anything)
- Last.fm / MusicBrainz clients (unreferenced)
- `PUT /me/albums`, follow endpoints on the Spotify client (scopes disabled today)

## Port notes (auto-categorize + MCP)

Both are done. Two things worth knowing:

- **Determinism.** The categorization strategies grouped into `HashMap`s, so proposal
  order — and therefore which crates won ties during selection — followed hash order.
  The port uses insertion-ordered `Map`s, so the same library now always produces the
  same crates. Decade labels used `ZoneId.systemDefault()`; Workers only have UTC.
- **Quirks kept on purpose.** `CrateSelector` compares against `maxAlbumsPerCrate` but
  truncates to `IDEAL_ALBUMS_PER_CRATE`; `DecadeStrategy.CURRENT_YEAR` is hardcoded to
  2025; the duplicate-crate check derives a handle as
  `name.toLowerCase().replace(" ", "-")` rather than the `handelize()` that actually
  builds it, so `R&B/Soul` is looked up as `r&b/soul` but stored as `rbsoul`; and
  `findBestAlbumMatch` returns the first search result when nothing matches, so a
  nonsense MCP request still comes back `matched: true`.

PKCE verifiers now live in KV under a 10-minute TTL rather than a `ConcurrentHashMap`
(an isolate cannot hold state across requests), and the state is hashed for the KV key
because it carries the caller's redirect URI.

## Testing

Comparison harness: replay a recorded set of real requests (with a test user's token)
against both stacks and diff JSON. The backend has ~no tests, so this harness is the
safety net. Add Vitest + Miniflare unit tests for auth middleware, crypto round-trip,
and pagination math.

Auto-categorize and MCP were exercised locally against the prod D1 copy by rewriting one
user's `auth_token` in the local database to a known fixture value (and inserting an
`mcp_api_key` row whose hash matches a known key) — no prod-valid credential is needed,
and the local copy is disposable. Neither surface can be diffed against production
without a real token; see the phase-3 harness note below.
