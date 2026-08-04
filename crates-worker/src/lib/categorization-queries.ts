// D1 loaders for auto-categorize. Kept apart from user-queries because these return
// the lightweight CatalogAlbum shape the categorization engine works on rather than
// the API DTOs.

import type { CatalogAlbum, CatalogArtist } from './categorization';
import { parseImages } from './dto';

/**
 * IN-clause chunk size. D1 allows at most 100 bound parameters per statement, and some
 * of these queries bind a userId alongside the ids, so leave headroom.
 */
const CHUNK = 80;

const chunked = <T>(items: T[], size = CHUNK): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

interface AlbumBaseRow {
  id: number;
  name: string;
  popularity: number;
  release_date: number | null;
  images: string | null;
}

/**
 * Every ACTIVE library album for a user, newest first.
 * Port of LibraryAlbumRepository.findActiveBySpotifyUser (ORDER BY addedAt DESC),
 * which AutoCategorizeServiceImpl.fetchAllLibraryAlbums paged through in full.
 */
export async function libraryCatalogAlbums(db: D1Database, userId: number): Promise<CatalogAlbum[]> {
  const res = await db
    .prepare(
      `SELECT a.id, a.name, a.popularity, a.release_date, a.images
         FROM library_album la JOIN album a ON a.id = la.album_id
        WHERE la.spotify_user_id = ? AND la.state = 'ACTIVE'
        ORDER BY la.added_at DESC`,
    )
    .bind(userId)
    .all<AlbumBaseRow>();

  const rows = res.results ?? [];
  if (rows.length === 0) return [];

  const albumIds = rows.map((r) => r.id);
  const [genresByAlbum, artistsByAlbum] = await Promise.all([
    albumGenres(db, albumIds),
    albumArtists(db, albumIds),
  ]);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    popularity: r.popularity ?? 0,
    releaseDate: r.release_date,
    images: parseImages(r.images),
    genres: genresByAlbum.get(r.id) ?? [],
    artists: artistsByAlbum.get(r.id) ?? [],
  }));
}

async function albumGenres(db: D1Database, albumIds: number[]): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  for (const batch of chunked(albumIds)) {
    const ph = batch.map(() => '?').join(',');
    const res = await db
      .prepare(
        `SELECT atg.album_id, g.name
           FROM album_to_genre atg JOIN genre g ON g.id = atg.genre_id
          WHERE atg.album_id IN (${ph}) ORDER BY atg.album_id, g.id`,
      )
      .bind(...batch)
      .all<{ album_id: number; name: string }>();
    for (const row of res.results ?? []) {
      const list = map.get(row.album_id);
      if (list) list.push(row.name);
      else map.set(row.album_id, [row.name]);
    }
  }
  return map;
}

async function albumArtists(db: D1Database, albumIds: number[]): Promise<Map<number, CatalogArtist[]>> {
  const map = new Map<number, CatalogArtist[]>();
  const artistIds = new Set<number>();
  const pairs: { albumId: number; artistId: number; name: string }[] = [];

  for (const batch of chunked(albumIds)) {
    const ph = batch.map(() => '?').join(',');
    const res = await db
      .prepare(
        `SELECT ata.album_id, ar.id, ar.name
           FROM album_to_artist ata JOIN artist ar ON ar.id = ata.artist_id
          WHERE ata.album_id IN (${ph}) ORDER BY ata.album_id, ar.id`,
      )
      .bind(...batch)
      .all<{ album_id: number; id: number; name: string }>();
    for (const row of res.results ?? []) {
      pairs.push({ albumId: row.album_id, artistId: row.id, name: row.name });
      artistIds.add(row.id);
    }
  }

  const genresByArtist = await artistGenres(db, [...artistIds]);
  for (const p of pairs) {
    const artist: CatalogArtist = { id: p.artistId, name: p.name, genres: genresByArtist.get(p.artistId) ?? [] };
    const list = map.get(p.albumId);
    if (list) list.push(artist);
    else map.set(p.albumId, [artist]);
  }
  return map;
}

async function artistGenres(db: D1Database, artistIds: number[]): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  for (const batch of chunked(artistIds)) {
    const ph = batch.map(() => '?').join(',');
    const res = await db
      .prepare(
        `SELECT atg.artist_id, g.name
           FROM artist_to_genre atg JOIN genre g ON g.id = atg.genre_id
          WHERE atg.artist_id IN (${ph}) ORDER BY atg.artist_id, g.id`,
      )
      .bind(...batch)
      .all<{ artist_id: number; name: string }>();
    for (const row of res.results ?? []) {
      const list = map.get(row.artist_id);
      if (list) list.push(row.name);
      else map.set(row.artist_id, [row.name]);
    }
  }
  return map;
}

/**
 * Album ids already in any of this user's crates.
 * CrateAlbumRepository.findAlbumIdsInAnyCrate joins crate without filtering on state,
 * so albums sitting in an archived crate count as categorized here too.
 */
export async function albumIdsInAnyCrate(db: D1Database, userId: number, albumIds: number[]): Promise<Set<number>> {
  const found = new Set<number>();
  for (const batch of chunked(albumIds)) {
    const ph = batch.map(() => '?').join(',');
    const res = await db
      .prepare(
        `SELECT DISTINCT ca.album_id
           FROM crate_album ca JOIN crate c ON c.id = ca.crate_id
          WHERE c.user_id = ? AND ca.album_id IN (${ph})`,
      )
      .bind(userId, ...batch)
      .all<{ album_id: number }>();
    for (const row of res.results ?? []) found.add(row.album_id);
  }
  return found;
}
