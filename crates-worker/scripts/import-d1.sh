#!/usr/bin/env bash
# Import scripts/out/*.sql into D1, in the FK-safe order the export emits them.
#
#   scripts/import-d1.sh --local     # load the prod copy into local dev
#   scripts/import-d1.sh --remote    # load it into the real D1
#
# 000_wipe.sql clears every table first, so this is re-runnable: a failed or partial
# run is fixed by running it again, not by hand-repairing rows.
#
# Wrangler has no `d1 import`; `d1 execute --file` is the only path, and it is the
# reason the export caps statements at 60 KB (D1 rejects anything over 100 KB).

set -euo pipefail

MODE="${1:---local}"
if [[ "$MODE" != "--local" && "$MODE" != "--remote" ]]; then
  echo "usage: $0 --local|--remote" >&2
  exit 64
fi

cd "$(dirname "$0")/.."

shopt -s nullglob
files=(scripts/out/*.sql)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "no SQL files in scripts/out/ — run 'node --env-file=.dev.vars scripts/export-pg-to-d1.mjs' first" >&2
  exit 1
fi

echo "importing ${#files[@]} files into D1 ($MODE)"
started=$SECONDS

for f in "${files[@]}"; do
  printf '  %-34s ' "$(basename "$f")"
  if out=$(npx wrangler d1 execute crates "$MODE" --file "$f" 2>&1); then
    echo "ok"
  else
    echo "FAILED"
    echo "$out" | tail -20 >&2
    exit 1
  fi
done

echo "done in $((SECONDS - started))s"
echo
echo "verify: compare counts against scripts/out/manifest.json, e.g."
echo "  npx wrangler d1 execute crates $MODE --command 'SELECT count(*) FROM album'"
echo "  npx wrangler d1 execute crates $MODE --command 'PRAGMA foreign_key_check'"
