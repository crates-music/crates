# Phase 2 — Public Surface (`/v1/public/*` API + crates.music SSR)

Lowest-risk slice: read-only, unauthenticated, easy to diff page-for-page against
production. Proves Worker + D1 + custom domain end to end.

## Public JSON API (port from `PublicController.java`)

| Endpoint | Notes |
|---|---|
| `GET /v1/public/user/{username}` | username = handle or spotify_id; only non-private profiles |
| `GET /v1/public/user/{username}/crates` | paged; search + sort params |
| `GET /v1/public/user/{username}/crate/{handle}` | |
| `GET /v1/public/user/{username}/crate/{handle}/albums` | paged; search + sort (incl. artist-name sort — port the native GROUP BY queries from `CrateAlbumRepository`) |
| `GET /v1/public/crates` | paged, public only |
| `GET /v1/public/crates/trending` | ordered by trending_score |
| `POST /v1/public/crate/{crateId}/view` | insert into `crate_view`; anonymous dedup = unique index on (crate_id, ip, hour-bucket), INSERT OR IGNORE |

These read D1 directly. Pagination mirrors Spring's `Page` JSON shape (the Go service and
Angular both consume it): `content`, `totalElements`, `totalPages`, `number`, `size`.

## SSR pages (port from `crates-public/`, ~950 LOC Go)

Routes → Hono JSX components, served when `Host` is `crates.music` (or `crates.localhost`
in dev):

- `GET /` — home: trending/featured crates (was `home.html`)
- `GET /:username` — profile (was `profile.html`)
- `GET /:username/:handle` — crate detail (was `crate.html`)
- `GET /privacy-policy`, `GET /terms-of-service` — static legal pages
- `GET /api/:username/crates`, `GET /api/:username/:handle/albums` — JSON for Alpine.js
  progressive enhancement (keep `static/js/app.js` working as-is)
- `GET /health`
- Static assets under `/static/*` (css, app.js, images) — served from Worker static
  assets with `run_worker_first` excluding them.

Behavior to preserve from `main.go`:

- Meta/OG/Twitter tags per page (title, og:image = avatar / first album artwork,
  canonical `https://crates.music` URLs) — this is the whole reason the SSR service exists.
- Bot filtering middleware (`validation.go`): suspicious-path and user-agent blocking →
  404 error page.
- View recording on crate pages: fire-and-forget via `ctx.waitUntil()` (replaces the Go
  goroutine), now a direct D1 insert.
- `crates.page` → `https://crates.music` 301 redirect.
- Google Analytics + LogRocket snippets in the base layout.

## Parity check

With a prod data copy in local D1 (phase 1 import `--local`):

1. Crawl N real URLs on https://crates.music (home, top profiles, top crates) and the
   same paths on the Worker; diff rendered titles/meta tags/album lists.
2. Diff JSON responses for the public API endpoints against
   `https://app.crates.music/api/v1/public/...` for the same paths + paging params.
