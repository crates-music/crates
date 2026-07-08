// D1 queries behind the authenticated endpoints — ports of CrateRepository
// (active-by-user paths), LibraryAlbumRepository (native queries), and
// SpotifyUserRepository.searchUsers.

import type { AlbumRow } from './catalog';
import { crateDto, iso, parseImages, userDto, type AlbumDto, type CrateDto, type CrateRow, type UserRow } from './dto';
import { artistsForAlbums, crateAlbums, type PageOpts } from './public-queries';

const CRATE_SELECT = `
SELECT c.id, c.name, c.handle, c.user_id, c.state, c.public, c.description,
       c.trending_score, c.last_trending_update, c.created_at, c.updated_at,
       (SELECT count(*) FROM crate_album ca WHERE ca.crate_id = c.id) AS album_count,
       (SELECT a.images FROM crate_album ca2 JOIN album a ON a.id = ca2.album_id
         WHERE ca2.crate_id = c.id ORDER BY ca2.created_at DESC, ca2.id DESC LIMIT 1) AS cover_images,
       u.id AS u_id, u.spotify_id AS u_spotify_id, u.display_name AS u_display_name,
       u.handle AS u_handle, u.bio AS u_bio, u.private_profile AS u_private_profile,
       u.images AS u_images
  FROM crate c
  JOIN spotify_user u ON u.id = c.user_id`;

const CRATE_SORT_COLUMNS: Record<string, string> = {
  name: 'c.name COLLATE NOCASE',
  createdAt: 'c.created_at',
  updatedAt: 'c.updated_at',
};

const like = (term: string) => `%${term.toLowerCase()}%`;

/** CrateRepository.findActiveByUser / findActiveByUserAndNameLike */
export async function activeCratesByUser(
  db: D1Database,
  userId: number,
  opts: PageOpts,
): Promise<{ crates: CrateDto[]; total: number }> {
  let where = `c.state = 'ACTIVE' AND c.user_id = ?`;
  const binds: unknown[] = [userId];
  if (opts.search) {
    where += ' AND LOWER(c.name) LIKE ?';
    binds.push(like(opts.search));
  }
  const col = opts.sort ? CRATE_SORT_COLUMNS[opts.sort.prop] : undefined;
  const orderBy = col ? `${col} ${opts.sort!.desc ? 'DESC' : 'ASC'}` : 'c.id ASC';
  const [rows, count] = await Promise.all([
    db
      .prepare(`${CRATE_SELECT} WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
      .bind(...binds, opts.size, opts.page * opts.size)
      .all<CrateRow>(),
    db
      .prepare(`SELECT count(*) AS n FROM crate c WHERE ${where}`)
      .bind(...binds)
      .first<{ n: number }>(),
  ]);
  return { crates: (rows.results ?? []).map(crateDto), total: count?.n ?? 0 };
}

export async function findCrateRowById(db: D1Database, id: number): Promise<CrateRow | null> {
  return db.prepare(`${CRATE_SELECT} WHERE c.id = ?`).bind(id).first<CrateRow>();
}

export { crateAlbums };

// ---------- library albums (LibraryAlbumRepository native queries) ----------

interface LibraryAlbumRow extends AlbumRow {
  added_at: number;
}

/**
 * searchLibraryAlbums port. Returns Album DTOs with addedAt from
 * library_album (LibraryAlbumMapper). The legacy artist-search join could
 * duplicate rows for multi-artist albums; EXISTS dedupes.
 */
export async function libraryAlbums(
  db: D1Database,
  userId: number,
  opts: PageOpts & { excludeCrated?: boolean },
): Promise<{ albums: AlbumDto[]; total: number }> {
  let where = `la.state = 'ACTIVE' AND la.spotify_user_id = ?`;
  const binds: unknown[] = [userId];
  if (opts.excludeCrated) {
    where += ` AND NOT EXISTS (
      SELECT 1 FROM crate_album ca JOIN crate cr ON ca.crate_id = cr.id
       WHERE ca.album_id = la.album_id AND cr.state = 'ACTIVE')`;
  }
  if (opts.search) {
    where += ` AND (LOWER(a.name) LIKE ? OR EXISTS (
      SELECT 1 FROM album_to_artist ata JOIN artist ar ON ar.id = ata.artist_id
       WHERE ata.album_id = a.id AND LOWER(ar.name) LIKE ?))`;
    binds.push(like(opts.search), like(opts.search));
  }
  const [rows, count] = await Promise.all([
    db
      .prepare(
        `SELECT a.*, la.added_at FROM library_album la JOIN album a ON a.id = la.album_id
          WHERE ${where} ORDER BY la.added_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...binds, opts.size, opts.page * opts.size)
      .all<LibraryAlbumRow>(),
    db
      .prepare(`SELECT count(*) AS n FROM library_album la JOIN album a ON a.id = la.album_id WHERE ${where}`)
      .bind(...binds)
      .first<{ n: number }>(),
  ]);
  const albumRows = rows.results ?? [];
  const artistsByAlbum = await artistsForAlbums(db, albumRows.map((r) => r.id));
  const albums = albumRows.map(
    (r): AlbumDto => ({
      id: r.id,
      spotifyId: r.spotify_id,
      upc: r.upc,
      href: r.href,
      name: r.name,
      popularity: r.popularity,
      releaseDate: iso(r.release_date),
      addedAt: iso(r.added_at),
      artists: artistsByAlbum.get(r.id) ?? [],
      images: parseImages(r.images),
      genres: [],
    }),
  );
  return { albums, total: count?.n ?? 0 };
}

// ---------- users ----------

/** SpotifyUserRepository.searchUsers (public profiles only, updated_at desc). */
export async function searchUsers(
  db: D1Database,
  search: string,
  page: number,
  size: number,
): Promise<{ users: UserRow[]; total: number }> {
  const term = like(search);
  const where = `(LOWER(display_name) LIKE ?1 OR LOWER(handle) LIKE ?1 OR LOWER(spotify_id) LIKE ?1)
                 AND private_profile = 0`;
  const [rows, count] = await Promise.all([
    db
      .prepare(`SELECT * FROM spotify_user WHERE ${where} ORDER BY updated_at DESC LIMIT ?2 OFFSET ?3`)
      .bind(term, size, page * size)
      .all<UserRow>(),
    db.prepare(`SELECT count(*) AS n FROM spotify_user WHERE ${where}`).bind(term).first<{ n: number }>(),
  ]);
  return { users: rows.results ?? [], total: count?.n ?? 0 };
}

/** CrateRepository.findAllPublicCratesWithUnifiedSearch (name/description/album/artist). */
export async function unifiedSearchCrates(
  db: D1Database,
  search: string,
  page: number,
  size: number,
): Promise<{ crates: CrateDto[]; total: number }> {
  const term = like(search);
  const where = `c.state = 'ACTIVE' AND c.public = 1 AND u.private_profile = 0
    AND (LOWER(c.name) LIKE ?1 OR LOWER(c.description) LIKE ?1 OR EXISTS (
      SELECT 1 FROM crate_album ca
        JOIN album a ON a.id = ca.album_id
        LEFT JOIN album_to_artist ata ON ata.album_id = a.id
        LEFT JOIN artist ar ON ar.id = ata.artist_id
       WHERE ca.crate_id = c.id AND (LOWER(a.name) LIKE ?1 OR LOWER(ar.name) LIKE ?1)))`;
  const [rows, count] = await Promise.all([
    db
      .prepare(`${CRATE_SELECT} WHERE ${where} ORDER BY c.updated_at DESC LIMIT ?2 OFFSET ?3`)
      .bind(term, size, page * size)
      .all<CrateRow>(),
    db
      .prepare(`SELECT count(*) AS n FROM crate c JOIN spotify_user u ON u.id = c.user_id WHERE ${where}`)
      .bind(term)
      .first<{ n: number }>(),
  ]);
  return { crates: (rows.results ?? []).map(crateDto), total: count?.n ?? 0 };
}

// ---------- library entity ----------

export interface LibraryRow {
  id: number;
  spotify_user_id: number;
  state: string;
  created_at: number | null;
  updated_at: number | null;
}

export async function findLibraryByUserId(db: D1Database, userId: number): Promise<LibraryRow | null> {
  return db.prepare('SELECT * FROM library WHERE spotify_user_id = ?').bind(userId).first<LibraryRow>();
}

export async function findOrCreateLibrary(db: D1Database, userId: number): Promise<LibraryRow> {
  const existing = await findLibraryByUserId(db, userId);
  if (existing) return existing;
  const now = Date.now();
  return (await db
    .prepare(
      `INSERT INTO library (spotify_user_id, state, created_at, updated_at)
       VALUES (?, 'IMPORTING', ?, ?) ON CONFLICT (spotify_user_id) DO UPDATE SET updated_at = excluded.updated_at
       RETURNING *`,
    )
    .bind(userId, now, now)
    .first<LibraryRow>())!;
}

export function libraryDto(row: LibraryRow, user: UserRow) {
  return {
    id: row.id,
    spotifyUser: userDto(user),
    state: row.state,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}
