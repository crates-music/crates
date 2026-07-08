// DTO shapes matching the Spring backend's JSON (MapStruct mappers in
// crates-backend controller/api/). Field names and nesting are contract —
// the Angular app and public site consume these verbatim.

export interface ImageDto {
  id: number | null;
  url: string;
  width: number | null;
  height: number | null;
}

export interface CrateUserDto {
  id: number;
  spotifyId: string;
  displayName: string;
  handle: string | null;
  bio: string | null;
  privateProfile: boolean;
  images: ImageDto[];
}

export interface GenreDto {
  id: number;
  name: string;
}

export interface ArtistDto {
  id: number;
  spotifyId: string;
  spotifyUri: string;
  name: string;
  popularity: number;
  genres: GenreDto[];
  images: ImageDto[];
}

export interface AlbumDto {
  id: number;
  spotifyId: string;
  upc: string | null;
  href: string;
  name: string;
  popularity: number;
  releaseDate: string | null;
  addedAt: string | null;
  artists: ArtistDto[];
  images: ImageDto[];
  genres: GenreDto[];
}

export interface CrateDto {
  id: number;
  name: string;
  handle: string;
  createdAt: string | null;
  updatedAt: string | null;
  state: string;
  imageUri: string | null;
  publicCrate: boolean;
  description: string | null;
  user: CrateUserDto;
  albumCount: number;
  trendingScore: number;
  lastTrendingUpdate: string | null;
}

export interface CrateAlbumDto {
  id: number;
  album: AlbumDto;
  createdAt: string | null;
}

/** Epoch ms -> ISO-8601. (Java emits microsecond precision; millis is equivalent.) */
export const iso = (ms: number | null | undefined): string | null =>
  ms == null ? null : new Date(ms).toISOString();

/** Parse the denormalized `images` JSON column (ordered width desc at export). */
export function parseImages(json: string | null | undefined): ImageDto[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as ImageDto[];
  } catch {
    return [];
  }
}

/** First (largest) image url from an images JSON column. */
export const firstImageUrl = (json: string | null | undefined): string | null =>
  parseImages(json)[0]?.url ?? null;

export interface UserRow {
  id: number;
  spotify_id: string;
  country: string | null;
  href: string;
  display_name: string;
  email: string | null;
  spotify_uri: string;
  handle: string | null;
  bio: string | null;
  private_profile: number;
  email_opt_in: number;
  images: string | null;
  created_at: number;
  updated_at: number;
}

/** Full user shape (GET /v1/public/user/{username} and /v1/user/*). */
export function userDto(row: UserRow, opts: { maskEmail?: boolean } = {}) {
  return {
    id: row.id,
    spotifyId: row.spotify_id,
    href: row.href,
    displayName: row.display_name,
    // The legacy backend returned the raw email on the public profile endpoint;
    // we mask it there deliberately (nothing consumes it publicly).
    email: opts.maskEmail ? null : row.email,
    emailOptIn: !!row.email_opt_in,
    handle: row.handle,
    bio: row.bio,
    privateProfile: !!row.private_profile,
    spotifyUri: row.spotify_uri,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    images: parseImages(row.images),
  };
}

/** Joined crate row produced by CRATE_SELECT in public-queries.ts. */
export interface CrateRow {
  id: number;
  name: string;
  handle: string;
  user_id: number;
  state: string;
  public: number;
  description: string | null;
  trending_score: number;
  last_trending_update: number | null;
  created_at: number | null;
  updated_at: number | null;
  album_count: number;
  cover_images: string | null;
  u_id: number;
  u_spotify_id: string;
  u_display_name: string;
  u_handle: string | null;
  u_bio: string | null;
  u_private_profile: number;
  u_images: string | null;
}

export function crateDto(row: CrateRow): CrateDto {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    state: row.state,
    imageUri: firstImageUrl(row.cover_images),
    publicCrate: !!row.public,
    description: row.description,
    user: {
      id: row.u_id,
      spotifyId: row.u_spotify_id,
      displayName: row.u_display_name,
      handle: row.u_handle,
      bio: row.u_bio,
      privateProfile: !!row.u_private_profile,
      images: parseImages(row.u_images),
    },
    albumCount: row.album_count,
    trendingScore: row.trending_score,
    lastTrendingUpdate: iso(row.last_trending_update),
  };
}
