# Phase 1 — D1 Schema & Data Pipeline

## Schema principles

- Fresh squashed baseline in `crates-worker/migrations/0001_init.sql`; the Flyway history
  (18 files, Postgres-specific) is not replayed.
- `SERIAL`/`BIGSERIAL` → `INTEGER PRIMARY KEY` (rowid alias). **Existing IDs are preserved
  verbatim** in the import so FKs keep working.
- All timestamps → INTEGER epoch **milliseconds**. Booleans → INTEGER 0/1.
- `VARCHAR(n)` → TEXT (length limits enforced at the API layer, as the entity annotations
  did).
- `ILIKE` queries → `LIKE` with `LOWER()` on both sides (SQLite `LIKE` is only
  case-insensitive for ASCII; `LOWER()` keeps behavior explicit).
- Postgres `date_trunc('hour', viewed_at)` dedup index → expression index on
  `(viewed_at / 3600000)`.

## Tables (final)

Migrated (IDs preserved): `token`, `spotify_user`, `genre`, `artist`, `album`,
`album_to_artist`, `artist_to_genre`, `album_to_genre`, `crate`, `crate_album`, `library`,
`library_album`, `crate_view`, `feedback`, `mcp_api_key` (transformed — see below).

Not migrated: `image`, `album_to_image`, `artist_to_image`, `spotify_user_to_image`
(denormalized into an `images` TEXT column holding a JSON array
`[{"url","width","height"}]`, ordered width desc), plus Flyway bookkeeping.

## Crypto transforms during export

Secret: `CRATES_ENCRYPTION_KEY` (32 UTF-8 chars → AES-256 key; unchanged).

| Column | Old (Java `EncryptionConverter`) | New |
|---|---|---|
| `token.access_token`, `token.refresh_token` | AES/ECB/PKCS5, base64 | AES-256-GCM, `base64(iv[12] ‖ ct ‖ tag[16])`; decrypted in-Worker via WebCrypto |
| `mcp_api_key.api_key` | AES/ECB (deterministic, unique-indexed for lookup) | `api_key_hash` = SHA-256 hex of plaintext key; plaintext never stored |
| `token.auth_token` | plaintext | plaintext (parity). Optional hardening later: hash it the same way. |

Rationale: WebCrypto has no ECB mode (deliberately). GCM is non-deterministic, so
lookup-by-encrypted-value (how MCP keys are validated today) must become hash lookup;
Spotify tokens are only ever decrypted, never looked up by value, so GCM works there.

## Export/transform script

`crates-worker/scripts/export-pg-to-d1.mjs` — runs on a host with Postgres access:

1. Reads Postgres (`PG_URL`), with the `timestamp` OID parser overridden to treat values
   as UTC (prod stores naive UTC timestamps).
2. Applies transforms: image denormalization, epoch-ms timestamps, 0/1 booleans,
   ECB→GCM re-encryption, api-key hashing.
3. Emits chunked SQL files to `scripts/out/` (`NNN_<table>.sql`, ~50k rows per file,
   multi-row INSERTs of 100), ordered to satisfy FKs:
   token → spotify_user → genre → artist → album → joins → crate → crate_album →
   library → library_album → crate_view → mcp_api_key → feedback.

Import:

```bash
wrangler d1 migrations apply crates --remote        # schema first
for f in scripts/out/*.sql; do
  wrangler d1 execute crates --remote --file "$f"
done
```

Same commands with `--local` load a full prod copy into local dev, which is how phase-2
parity testing works.

## Verification

- Row counts per table match the source (script prints expected counts; compare with
  `SELECT count(*)` via `wrangler d1 execute`).
- Spot-check GCM round-trip: script self-tests by decrypting a re-encrypted token with
  WebCrypto (`node:crypto.webcrypto`) before writing output.
- Spot-check FK integrity: `PRAGMA foreign_key_check` after import.
