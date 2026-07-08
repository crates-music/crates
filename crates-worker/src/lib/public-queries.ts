// D1 queries for the public surface — port of the read paths behind
// PublicController.java (CrateRepository, CrateAlbumRepository,
// SpotifyUserRepository, CrateDecoratorImpl, ViewTrackingService).

import {
  type ArtistDto,
  type CrateAlbumDto,
  type CrateDto,
  type CrateRow,
  type GenreDto,
  type ImageDto,
  type UserRow,
  crateDto,
  iso,
  parseImages,
} from './dto';

// Crate + owner + decoration (albumCount, cover image) in one row.
// Cover = most recently added album's images (CrateDecoratorImpl orders
// crate_album by createdAt DESC and takes the widest image; images JSON is
// already width-desc).
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

export interface PageOpts {
  page: number;
  size: number;
  sort: { prop: string; desc: boolean } | null;
  search?: string;
}

const CRATE_SORT_COLUMNS: Record<string, string> = {
  name: 'c.name COLLATE NOCASE',
  createdAt: 'c.created_at',
  updatedAt: 'c.updated_at',
};

function crateOrderBy(sort: PageOpts['sort']): string {
  const col = sort ? CRATE_SORT_COLUMNS[sort.prop] : undefined;
  if (!col) return 'c.id ASC'; // deterministic stand-in for Spring "unsorted"
  return `${col} ${sort!.desc ? 'DESC' : 'ASC'}`;
}

const like = (term: string) => `%${term.toLowerCase()}%`;

/** UserServiceImpl.findByHandleOrSpotifyId: handle first, then spotify_id. */
export async function findUserByHandleOrSpotifyId(db: D1Database, username: string): Promise<UserRow | null> {
  const byHandle = await db
    .prepare('SELECT * FROM spotify_user WHERE handle = ?')
    .bind(username)
    .first<UserRow>();
  if (byHandle) return byHandle;
  return db.prepare('SELECT * FROM spotify_user WHERE spotify_id = ?').bind(username).first<UserRow>();
}

async function crateQuery(
  db: D1Database,
  where: string,
  binds: unknown[],
  orderBy: string,
  page: number,
  size: number,
): Promise<{ crates: CrateDto[]; total: number }> {
  const [rows, count] = await Promise.all([
    db
      .prepare(`${CRATE_SELECT} WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
      .bind(...binds, size, page * size)
      .all<CrateRow>(),
    db
      .prepare(`SELECT count(*) AS n FROM crate c JOIN spotify_user u ON u.id = c.user_id WHERE ${where}`)
      .bind(...binds)
      .first<{ n: number }>(),
  ]);
  return { crates: (rows.results ?? []).map(crateDto), total: count?.n ?? 0 };
}

/** CrateRepository.findPublicByUser / findPublicByUserAndNameLike */
export function publicCratesByUser(db: D1Database, userId: number, opts: PageOpts) {
  let where = `c.state = 'ACTIVE' AND c.user_id = ? AND c.public = 1`;
  const binds: unknown[] = [userId];
  if (opts.search) {
    where += ` AND LOWER(c.name) LIKE ?`;
    binds.push(like(opts.search));
  }
  return crateQuery(db, where, binds, crateOrderBy(opts.sort), opts.page, opts.size);
}

/** CrateRepository.findAllPublicCrates */
export function allPublicCrates(db: D1Database, opts: PageOpts) {
  const where = `c.state = 'ACTIVE' AND c.public = 1 AND u.private_profile = 0`;
  return crateQuery(db, where, [], crateOrderBy(opts.sort), opts.page, opts.size);
}

/** CrateRepository.findAllPublicCratesByTrending (fixed ordering) */
export function trendingCrates(db: D1Database, page: number, size: number) {
  const where = `c.state = 'ACTIVE' AND c.public = 1 AND u.private_profile = 0`;
  return crateQuery(db, where, [], 'c.trending_score DESC, c.created_at DESC', page, size);
}

/** CrateRepository.findByUserAndHandle (state ACTIVE) */
export async function findCrateByUserAndHandle(
  db: D1Database,
  userId: number,
  handle: string,
): Promise<CrateDto | null> {
  const row = await db
    .prepare(`${CRATE_SELECT} WHERE c.state = 'ACTIVE' AND c.user_id = ? AND c.handle = ?`)
    .bind(userId, handle)
    .first<CrateRow>();
  return row ? crateDto(row) : null;
}

export async function findCrateById(db: D1Database, id: number): Promise<{ id: number; public: number } | null> {
  return db.prepare('SELECT id, public FROM crate WHERE id = ?').bind(id).first<{ id: number; public: number }>();
}

// ---------- crate albums ----------

interface CrateAlbumRow {
  ca_id: number;
  ca_created_at: number | null;
  id: number;
  spotify_id: string;
  upc: string | null;
  href: string;
  name: string;
  popularity: number;
  release_date: number | null;
  images: string | null;
}

const ALBUM_SORT_COLUMNS: Record<string, string> = {
  createdAt: 'ca.created_at',
  'album.name': 'a.name COLLATE NOCASE',
  'album.releaseDate': 'a.release_date',
};

/**
 * CrateServiceImpl.getPublicAlbums / searchPublicAlbums, including the
 * artistName special case (native GROUP BY MIN(artist.name) queries).
 */
export async function crateAlbums(
  db: D1Database,
  crateId: number,
  opts: PageOpts,
): Promise<{ albums: CrateAlbumDto[]; total: number }> {
  const binds: unknown[] = [crateId];
  let where = 'ca.crate_id = ?';
  if (opts.search) {
    where += ` AND (LOWER(a.name) LIKE ? OR EXISTS (
      SELECT 1 FROM album_to_artist sata JOIN artist sar ON sar.id = sata.artist_id
       WHERE sata.album_id = a.id AND LOWER(sar.name) LIKE ?))`;
    binds.push(like(opts.search), like(opts.search));
  }

  const artistSort = opts.sort?.prop === 'artistName';
  const dir = opts.sort?.desc ? 'DESC' : 'ASC';
  let sql: string;
  if (artistSort) {
    sql = `SELECT ca.id AS ca_id, ca.created_at AS ca_created_at, a.*
             FROM crate_album ca
             JOIN album a ON a.id = ca.album_id
             LEFT JOIN album_to_artist ata ON ata.album_id = a.id
             LEFT JOIN artist ar ON ar.id = ata.artist_id
            WHERE ${where}
            GROUP BY ca.id
            ORDER BY MIN(ar.name) COLLATE NOCASE ${dir}
            LIMIT ? OFFSET ?`;
  } else {
    const col = opts.sort ? ALBUM_SORT_COLUMNS[opts.sort.prop] : undefined;
    const orderBy = col ? `${col} ${dir}` : 'ca.id ASC';
    sql = `SELECT ca.id AS ca_id, ca.created_at AS ca_created_at, a.*
             FROM crate_album ca
             JOIN album a ON a.id = ca.album_id
            WHERE ${where}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?`;
  }

  const [rows, count] = await Promise.all([
    db.prepare(sql).bind(...binds, opts.size, opts.page * opts.size).all<CrateAlbumRow>(),
    db
      .prepare(`SELECT count(*) AS n FROM crate_album ca JOIN album a ON a.id = ca.album_id WHERE ${where}`)
      .bind(...binds)
      .first<{ n: number }>(),
  ]);

  const albumRows = rows.results ?? [];
  const artistsByAlbum = await artistsForAlbums(db, albumRows.map((r) => r.id));

  const albums = albumRows.map((r) => ({
    id: r.ca_id,
    album: {
      id: r.id,
      spotifyId: r.spotify_id,
      upc: r.upc,
      href: r.href,
      name: r.name,
      popularity: r.popularity,
      releaseDate: iso(r.release_date),
      addedAt: null,
      artists: artistsByAlbum.get(r.id) ?? [],
      images: parseImages(r.images),
      genres: [] as GenreDto[],
    },
    createdAt: iso(r.ca_created_at),
  }));
  return { albums, total: count?.n ?? 0 };
}

/** Hydrate artists (with genres) for a page of albums — two IN queries, no N+1. */
async function artistsForAlbums(db: D1Database, albumIds: number[]): Promise<Map<number, ArtistDto[]>> {
  const map = new Map<number, ArtistDto[]>();
  if (albumIds.length === 0) return map;
  const ph = albumIds.map(() => '?').join(',');

  const artists = await db
    .prepare(
      `SELECT ata.album_id, ar.id, ar.spotify_id, ar.spotify_uri, ar.name, ar.popularity, ar.images
         FROM album_to_artist ata JOIN artist ar ON ar.id = ata.artist_id
        WHERE ata.album_id IN (${ph}) ORDER BY ata.album_id, ar.id`,
    )
    .bind(...albumIds)
    .all<{
      album_id: number;
      id: number;
      spotify_id: string;
      spotify_uri: string;
      name: string;
      popularity: number;
      images: string | null;
    }>();

  const artistRows = artists.results ?? [];
  const artistIds = [...new Set(artistRows.map((a) => a.id))];
  const genresByArtist = new Map<number, GenreDto[]>();
  if (artistIds.length > 0) {
    const gph = artistIds.map(() => '?').join(',');
    const genres = await db
      .prepare(
        `SELECT atg.artist_id, g.id, g.name
           FROM artist_to_genre atg JOIN genre g ON g.id = atg.genre_id
          WHERE atg.artist_id IN (${gph}) ORDER BY atg.artist_id, g.id`,
      )
      .bind(...artistIds)
      .all<{ artist_id: number; id: number; name: string }>();
    for (const g of genres.results ?? []) {
      if (!genresByArtist.has(g.artist_id)) genresByArtist.set(g.artist_id, []);
      genresByArtist.get(g.artist_id)!.push({ id: g.id, name: g.name });
    }
  }

  for (const a of artistRows) {
    if (!map.has(a.album_id)) map.set(a.album_id, []);
    map.get(a.album_id)!.push({
      id: a.id,
      spotifyId: a.spotify_id,
      spotifyUri: a.spotify_uri,
      name: a.name,
      popularity: a.popularity,
      genres: genresByArtist.get(a.id) ?? [],
      images: parseImages(a.images) as ImageDto[],
    });
  }
  return map;
}

// ---------- view tracking ----------

/**
 * ViewTrackingService.recordView for anonymous views: rolling 1-hour dedup by
 * IP, plus the calendar-hour unique index as a second guard (INSERT OR IGNORE).
 * Never throws — view tracking is best-effort.
 */
export async function recordAnonymousView(
  db: D1Database,
  crateId: number,
  ip: string | null,
  userAgent: string | null,
  referrer: string | null,
): Promise<void> {
  try {
    const oneHourAgo = Date.now() - 3_600_000;
    if (ip) {
      const dup = await db
        .prepare(
          'SELECT 1 AS x FROM crate_view WHERE crate_id = ? AND ip_address = ? AND viewer_id IS NULL AND viewed_at > ? LIMIT 1',
        )
        .bind(crateId, ip, oneHourAgo)
        .first();
      if (dup) return;
    }
    await db
      .prepare(
        `INSERT OR IGNORE INTO crate_view (crate_id, viewer_id, viewed_at, ip_address, user_agent, referrer)
         VALUES (?, NULL, ?, ?, ?, ?)`,
      )
      .bind(crateId, Date.now(), ip, userAgent, referrer)
      .run();
  } catch (e) {
    console.error('recordAnonymousView failed', { crateId, error: String(e) });
  }
}
