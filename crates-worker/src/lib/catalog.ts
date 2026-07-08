// Catalog find-or-create — port of AlbumServiceImpl / ArtistServiceImpl /
// GenreServiceImpl. Albums/artists are a shared global catalog keyed by
// spotify_id; artist genres are fetched from Spotify the first time an
// artist is seen (genres_fetched flag).

import type { Env } from '../env';
import { iso, parseImages, type AlbumDto, type ArtistDto, type GenreDto } from './dto';
import {
  getServiceToken,
  spGetAlbum,
  spGetArtist,
  type SpotifyAlbum,
  type SpotifyArtistFull,
  type SpotifyImage,
} from './spotify';

const imagesJson = (images: SpotifyImage[] | undefined): string | null => {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return JSON.stringify(sorted.map((i) => ({ id: null, url: i.url, width: i.width, height: i.height })));
};

/** SpotifyAlbumMapper.mapReleaseDate — year/month/day precision to epoch ms (UTC). */
export function parseReleaseDate(releaseDate: string, precision: string): number {
  if (precision === 'year') return Date.parse(`${releaseDate}-01-01T00:00:00Z`);
  if (precision === 'month') return Date.parse(`${releaseDate}-01T00:00:00Z`);
  return Date.parse(`${releaseDate}T00:00:00Z`);
}

export async function findOrCreateGenre(db: D1Database, name: string): Promise<number> {
  const existing = await db.prepare('SELECT id FROM genre WHERE name = ?').bind(name).first<{ id: number }>();
  if (existing) return existing.id;
  await db.prepare('INSERT OR IGNORE INTO genre (name) VALUES (?)').bind(name).run();
  const row = await db.prepare('SELECT id FROM genre WHERE name = ?').bind(name).first<{ id: number }>();
  return row!.id;
}

interface ArtistRow {
  id: number;
  spotify_id: string;
  spotify_uri: string;
  name: string;
  popularity: number;
  genres_fetched: number;
  images: string | null;
}

/**
 * ArtistServiceImpl.findOrCreate: if genres already fetched, return as-is;
 * otherwise fetch the full artist from Spotify (genres + images) and
 * create/backfill.
 */
export async function findOrCreateArtist(
  env: Env,
  simple: { id: string; uri?: string; name?: string },
): Promise<number> {
  const existing = await env.DB.prepare('SELECT * FROM artist WHERE spotify_id = ?')
    .bind(simple.id)
    .first<ArtistRow>();
  if (existing?.genres_fetched) return existing.id;

  let full: SpotifyArtistFull | null = null;
  try {
    full = await spGetArtist(await getServiceToken(env), simple.id);
  } catch (e) {
    // Java's refresh path returns the existing artist as-is on fetch failure.
    if (existing) return existing.id;
    throw e;
  }

  let artistId: number;
  if (existing) {
    await env.DB.prepare(
      'UPDATE artist SET name = ?, popularity = ?, images = ?, genres_fetched = 1 WHERE id = ?',
    )
      .bind(full.name, full.popularity ?? 0, imagesJson(full.images), existing.id)
      .run();
    artistId = existing.id;
  } else {
    const res = await env.DB.prepare(
      `INSERT INTO artist (spotify_id, spotify_uri, name, popularity, genres_fetched, images)
       VALUES (?, ?, ?, ?, 1, ?)
       ON CONFLICT (spotify_id) DO UPDATE SET genres_fetched = 1
       RETURNING id`,
    )
      .bind(full.id, full.uri, full.name, full.popularity ?? 0, imagesJson(full.images))
      .first<{ id: number }>();
    artistId = res!.id;
  }

  for (const genreName of full.genres ?? []) {
    const genreId = await findOrCreateGenre(env.DB, genreName);
    await env.DB.prepare('INSERT OR IGNORE INTO artist_to_genre (artist_id, genre_id) VALUES (?, ?)')
      .bind(artistId, genreId)
      .run();
  }
  return artistId;
}

export interface AlbumRow {
  id: number;
  spotify_id: string;
  upc: string | null;
  href: string;
  name: string;
  popularity: number;
  release_date: number | null;
  images: string | null;
}

/** Insert an album (from a Spotify payload) plus its artist/genre joins. */
export async function insertAlbumFromSpotify(env: Env, album: SpotifyAlbum): Promise<AlbumRow> {
  const artistIds: number[] = [];
  for (const artist of album.artists ?? []) {
    artistIds.push(await findOrCreateArtist(env, artist));
  }
  const row = await env.DB.prepare(
    `INSERT INTO album (spotify_id, upc, href, name, popularity, release_date, images)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (spotify_id) DO UPDATE SET popularity = excluded.popularity
     RETURNING *`,
  )
    .bind(
      album.id,
      album.external_ids?.upc ?? null,
      album.href,
      album.name,
      album.popularity ?? 0,
      parseReleaseDate(album.release_date, album.release_date_precision),
      imagesJson(album.images),
    )
    .first<AlbumRow>();
  for (const artistId of artistIds) {
    await env.DB.prepare('INSERT OR IGNORE INTO album_to_artist (album_id, artist_id) VALUES (?, ?)')
      .bind(row!.id, artistId)
      .run();
  }
  for (const genreName of album.genres ?? []) {
    const genreId = await findOrCreateGenre(env.DB, genreName);
    await env.DB.prepare('INSERT OR IGNORE INTO album_to_genre (album_id, genre_id) VALUES (?, ?)')
      .bind(row!.id, genreId)
      .run();
  }
  return row!;
}

/** AlbumServiceImpl.findOrCreate(spotifyAlbumId) — D1 first, then Spotify. */
export async function findOrCreateAlbumBySpotifyId(env: Env, spotifyAlbumId: string): Promise<AlbumRow> {
  const existing = await env.DB.prepare('SELECT * FROM album WHERE spotify_id = ?')
    .bind(spotifyAlbumId)
    .first<AlbumRow>();
  if (existing) return existing;
  const album = await spGetAlbum(await getServiceToken(env), spotifyAlbumId);
  return insertAlbumFromSpotify(env, album);
}

/** Map a raw Spotify album payload straight to the API Album DTO (GLOBAL search). */
export function spotifyAlbumToDto(album: SpotifyAlbum): AlbumDto {
  const images = parseImages(imagesJson(album.images));
  return {
    id: null as unknown as number, // not persisted — matches Java mapping of unsaved entities
    spotifyId: album.id,
    upc: album.external_ids?.upc ?? null,
    href: album.href,
    name: album.name,
    popularity: album.popularity ?? 0,
    releaseDate: iso(parseReleaseDate(album.release_date, album.release_date_precision)),
    addedAt: null,
    artists: (album.artists ?? []).map(
      (a): ArtistDto => ({
        id: null as unknown as number,
        spotifyId: a.id,
        spotifyUri: a.uri,
        name: a.name,
        popularity: 0,
        genres: [] as GenreDto[],
        images: [],
      }),
    ),
    images,
    genres: (album.genres ?? []).map((name) => ({ id: null as unknown as number, name })),
  };
}
