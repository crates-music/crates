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

`scripts/parity-check.mjs`, run against a local `wrangler dev` with the phase-1 prod copy
in local D1:

```bash
npx wrangler dev                                   # separate shell
node scripts/parity-check.mjs --crates 6 --out report.json
```

Sample URLs are drawn from local D1 (top crates by view count, including handle-less
users whose public URLs fall back to spotifyId), so it exercises paths that get real
traffic. HTML is compared on the signature the SSR service exists to produce — title,
description, og/twitter tags, canonical, and the sequence of album/artwork ids — because
Go templates and Hono JSX are never byte-identical. Arrays of identified objects are
matched **by id**, with ordering reported as its own finding; positional diffing turns a
single ordering difference into thousands of phantom field mismatches.

By default it calls only endpoints that are side-effect-free on prod. Both
`GET /v1/public/user/{u}/crate/{h}` and the SSR crate page insert a `crate_view` row in
production, so they sit behind `--include-view-recording`.

### Results

**72/72 cases clean, 0 unexpected diffs** (view-recording endpoints excluded — see below).

Fixed as a result of the first run:

| Was | Fix |
|---|---|
| `iso()` always emitted 3 decimals (`...T00:00:00.000Z`); Jackson omits `.000`. Hit every timestamp in every payload | `src/lib/dto.ts` — drop `.000` |
| Page envelope always sent `sort: []`; Spring echoes the requested sort as an array of `Order` objects | `springPage()` takes the sort; `springOrders()` builds the Spring shape |
| …except `CrateServiceImpl.getAlbums` swaps in an *unsorted* PageRequest for the `artistName` sort, so prod echoes `[]` there | `echoedSort()` mirrors that one carve-out |
| SSR `/api/*` returned the full Spring envelope where the Go service returned a narrower object | `goPage()` for those two routes |
| Harness exercised `sort=name,asc`, which no client sends and which prod 500s on | Now tests the four params the frontend actually emits (`album-sort.model.ts`): `createdAt`, `album.name`, `album.releaseDate`, `artistName` |

The remaining ~2,500 differences are classified as accepted deviations in the harness
(`ACCEPTED`), each with a reason. They are reported, not hidden — a new kind of
difference shows up as a failure:

| Accepted deviation | Why it is not a bug |
|---|---|
| `createdAt`/`updatedAt` lose microseconds (`.341151Z` → `.341Z`) | Inherent to the epoch-ms decision; truncation only |
| `images`, `genres`, `artists` ordering | Prod maps these as `Set<Image>`/`Set<Genre>` with **no `@OrderBy`** — Hibernate hash order, arbitrary and unstable. The Worker's order (width-desc) is deterministic where prod isn't |
| Crate list order, and therefore which crates land on page 0 | The JPQL has no `ORDER BY` and no sort is sent, so prod's order is unspecified. `public-queries.ts` uses `c.id ASC` as a deterministic stand-in |
| og:image / twitter:image / rendered artwork | Follows `images[0]`, above. **This one is a fix, not just a deviation:** on 2 of 4 sampled crate pages prod's og:image was the 64px or 300px CDN variant of the right artwork (`ab67616d00004851…` / `…00001e02…`), because the `Set` iteration order happened to surface a small image. The Worker's width-desc ordering serves the 640px variant (`…0000b273…`) every time. `twitter:card` is `summary_large_image`, which wants ≥600px — prod has been emitting undersized social cards |
| Crate cover `imageUri` | `CrateDecoratorImpl` takes the newest `crate_album` by `createdAt` with **no tiebreaker**, and bulk-added albums share a timestamp *to the microsecond* — prod picks arbitrarily and can disagree with its own albums-list query for the same crate. The Worker breaks the tie on `id DESC` |
| SSR `/api/*` returns full DTOs where Go returned narrow structs (`addedAt` zero-time, artist `href: ""`, extra keys) | Superset; only the Worker's own inline Alpine code reads these, and it uses `content`/`last` plus a handful of album fields |

### Crate detail pages

Verified with `--include-view-recording` (58/58 clean over 4 crates). That flag records a
view on prod for each crate page hit — one per crate per IP per hour, so re-runs inside
the hour are free.

One harness correction came out of it: the HTML signature counted every `i.scdn.co`
occurrence, including the JSON the page embeds for Alpine, where the Worker carries full
artist DTOs and Go carried narrow structs. That read as "the Worker renders 88 images vs
prod's 63" when both render exactly 4 `<img>` tags. The signature now looks only inside
`<img>` tags — what the page actually renders.
