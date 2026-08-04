// Artist genre backfill, shared by the library-sync Workflow and auto-categorize.
//
// Java did this two different ways: LibrarySyncServiceImpl fetched one artist per
// call inline during import, and GenreEnrichmentServiceImpl.backfillArtistGenres did
// the same one-at-a-time for auto-categorize. Both become batched `GET /artists?ids=`
// (50 per call) here, per decision 10 in the migration plan.

import type { Env } from '../env';
import { findOrCreateGenre } from './catalog';
import { getServiceToken, spGetArtists } from './spotify';

/** Spotify's /artists endpoint takes at most 50 ids. */
export const ARTIST_BATCH = 50;

/** D1 allows at most 100 bound parameters per statement; leave room for the LIMIT bind. */
const ID_CHUNK = 90;

/**
 * Fill in genres/images for artists with genres_fetched = 0, oldest first.
 *
 * Pass artistIds to restrict the backfill to a specific set (auto-categorize only
 * cares about the artists on the albums it is about to categorize); omit it to take
 * whatever needs enriching (the sync Workflow's behavior).
 *
 * Returns the number of artists processed — 0 means there was nothing left to do.
 */
export async function enrichArtistGenres(
  env: Env,
  opts: { artistIds?: number[]; limit?: number } = {},
): Promise<number> {
  const limit = opts.limit ?? ARTIST_BATCH;
  let rows: { id: number; spotify_id: string }[];

  if (opts.artistIds) {
    if (opts.artistIds.length === 0) return 0;
    // D1 allows 100 bound parameters per statement, so the id list has to be walked in
    // slices — a library's worth of artists would be thousands of binds.
    rows = [];
    for (let i = 0; i < opts.artistIds.length && rows.length < limit; i += ID_CHUNK) {
      const batch = opts.artistIds.slice(i, i + ID_CHUNK);
      const ph = batch.map(() => '?').join(',');
      const res = await env.DB.prepare(
        `SELECT id, spotify_id FROM artist WHERE genres_fetched = 0 AND id IN (${ph}) LIMIT ?`,
      )
        .bind(...batch, limit - rows.length)
        .all<{ id: number; spotify_id: string }>();
      rows.push(...(res.results ?? []));
    }
  } else {
    const res = await env.DB.prepare('SELECT id, spotify_id FROM artist WHERE genres_fetched = 0 LIMIT ?')
      .bind(limit)
      .all<{ id: number; spotify_id: string }>();
    rows = res.results ?? [];
  }

  if (rows.length === 0) return 0;

  const serviceToken = await getServiceToken(env);
  const byId = new Map(rows.map((a) => [a.spotify_id, a.id]));
  const res = await spGetArtists(serviceToken, rows.map((a) => a.spotify_id));
  const seen = new Set<string>();

  for (const full of res.artists) {
    if (!full) continue;
    seen.add(full.id);
    const artistId = byId.get(full.id)!;
    const images =
      full.images && full.images.length > 0
        ? JSON.stringify(
            [...full.images]
              .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
              .map((i) => ({ id: null, url: i.url, width: i.width, height: i.height })),
          )
        : null;
    await env.DB.prepare('UPDATE artist SET name = ?, popularity = ?, images = ?, genres_fetched = 1 WHERE id = ?')
      .bind(full.name, full.popularity ?? 0, images, artistId)
      .run();
    for (const genreName of full.genres ?? []) {
      const genreId = await findOrCreateGenre(env.DB, genreName);
      await env.DB.prepare('INSERT OR IGNORE INTO artist_to_genre (artist_id, genre_id) VALUES (?, ?)')
        .bind(artistId, genreId)
        .run();
    }
  }

  // Artists Spotify no longer returns: mark fetched so we don't loop forever.
  for (const a of rows) {
    if (!seen.has(a.spotify_id)) {
      await env.DB.prepare('UPDATE artist SET genres_fetched = 1 WHERE id = ?').bind(a.id).run();
    }
  }

  return rows.length;
}
