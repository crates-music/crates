// Spotify Web API client — replaces the Feign clients in spotify/client/.
// Only the endpoints the app actually uses (scope: user-library-read).

import type { Env } from '../env';
import { decryptGcm, encryptGcm } from './crypto';

const ACCOUNTS_URI = 'https://accounts.spotify.com';
const API_BASE = 'https://api.spotify.com/v1';
const SCOPES = 'user-library-read';

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

// ---- Spotify API payload shapes (subset we consume) ----

export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyArtistSimple {
  id: string;
  uri: string;
  name: string;
}

export interface SpotifyArtistFull extends SpotifyArtistSimple {
  popularity?: number;
  genres?: string[];
  images?: SpotifyImage[];
}

export interface SpotifyAlbum {
  id: string;
  href: string;
  name: string;
  popularity?: number;
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  images?: SpotifyImage[];
  artists?: SpotifyArtistSimple[];
  genres?: string[];
  external_ids?: { upc?: string };
}

export interface SpotifyUserProfile {
  id: string;
  href: string;
  uri: string;
  display_name: string | null;
  email?: string;
  country?: string;
  images?: SpotifyImage[];
}

export interface SpotifyPaging<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface SpotifySavedAlbum {
  added_at: string;
  album: SpotifyAlbum;
}

export class SpotifyApiError extends Error {
  constructor(
    public status: number,
    public url: string,
    body: string,
  ) {
    super(`Spotify ${status} on ${url}: ${body.slice(0, 200)}`);
  }
}

// ---- auth endpoints (accounts.spotify.com) ----

export function getAuthUrl(env: Env, state: string): string {
  const params = new URLSearchParams({
    client_id: env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: env.SPOTIFY_REDIRECT_URI,
    scope: SCOPES,
    state,
  });
  return `${ACCOUNTS_URI}/authorize?${params}`;
}

export async function tokenRequest(env: Env, params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${ACCOUNTS_URI}/api/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  if (!res.ok) throw new SpotifyApiError(res.status, '/api/token', await res.text());
  return res.json<TokenResponse>();
}

export const exchangeCode = (env: Env, code: string) =>
  tokenRequest(env, { grant_type: 'authorization_code', code, redirect_uri: env.SPOTIFY_REDIRECT_URI });

export const refreshTokenGrant = (env: Env, refreshToken: string) =>
  tokenRequest(env, { grant_type: 'refresh_token', refresh_token: refreshToken });

/** Client-credentials token for catalog lookups, cached in KV (was an instance field). */
export async function getServiceToken(env: Env): Promise<string> {
  const cached = await env.KV.get('spotify:service-token');
  if (cached) return cached;
  const token = await tokenRequest(env, { grant_type: 'client_credentials' });
  // Expire 5 minutes early, same safety margin as SpotifyAuthImpl.
  await env.KV.put('spotify:service-token', token.access_token, {
    expirationTtl: Math.max(60, token.expires_in - 300),
  });
  return token.access_token;
}

// ---- api.spotify.com ----

async function apiGet<T>(accessToken: string, path: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 429 && attempt < 3) {
      const retryAfter = Number(res.headers.get('Retry-After') ?? '1');
      await new Promise((r) => setTimeout(r, Math.min(retryAfter, 30) * 1000));
      continue;
    }
    if (!res.ok) throw new SpotifyApiError(res.status, path, await res.text());
    return res.json<T>();
  }
}

export const spGetCurrentUser = (token: string) => apiGet<SpotifyUserProfile>(token, '/me');
export const spGetAlbum = (token: string, id: string) => apiGet<SpotifyAlbum>(token, `/albums/${id}`);
export const spGetArtist = (token: string, id: string) => apiGet<SpotifyArtistFull>(token, `/artists/${id}`);
export const spGetArtists = (token: string, ids: string[]) =>
  apiGet<{ artists: SpotifyArtistFull[] }>(token, `/artists?ids=${ids.join(',')}`);
export const spSearchAlbums = (token: string, query: string, offset: number, limit: number) =>
  apiGet<{ albums: SpotifyPaging<SpotifyAlbum> }>(
    token,
    `/search?q=${encodeURIComponent(query)}&type=album&offset=${offset}&limit=${limit}`,
  );
export const spGetSavedAlbums = (token: string, offset: number, limit: number) =>
  apiGet<SpotifyPaging<SpotifySavedAlbum>>(token, `/me/albums?offset=${offset}&limit=${limit}`);
export const spLibraryContains = (token: string, ids: string[]) =>
  apiGet<boolean[]>(token, `/me/albums/contains?ids=${ids.join(',')}`);

// ---- user-context calls with refresh-on-401 (port of SpotifyImpl.executeWithRetry) ----

export interface UserTokenRow {
  token_id: number;
  access_token: string; // GCM-encrypted
  refresh_token: string; // GCM-encrypted
}

/**
 * Run a Spotify call with the user's access token; on 401, refresh the token,
 * persist it (GCM-encrypted), and retry once.
 */
export async function withUserToken<T>(
  env: Env,
  tokenRow: UserTokenRow,
  fn: (accessToken: string) => Promise<T>,
): Promise<T> {
  const accessToken = await decryptGcm(env.CRATES_ENCRYPTION_KEY, tokenRow.access_token);
  try {
    return await fn(accessToken);
  } catch (e) {
    if (!(e instanceof SpotifyApiError) || e.status !== 401) throw e;
    const refreshToken = await decryptGcm(env.CRATES_ENCRYPTION_KEY, tokenRow.refresh_token);
    const refreshed = await refreshTokenGrant(env, refreshToken);
    const encAccess = await encryptGcm(env.CRATES_ENCRYPTION_KEY, refreshed.access_token);
    const expiration = Date.now() + refreshed.expires_in * 1000;
    if (refreshed.refresh_token) {
      // Java ignored rotated refresh tokens; storing them is strictly safer.
      const encRefresh = await encryptGcm(env.CRATES_ENCRYPTION_KEY, refreshed.refresh_token);
      await env.DB.prepare('UPDATE token SET access_token = ?, refresh_token = ?, expiration = ? WHERE id = ?')
        .bind(encAccess, encRefresh, expiration, tokenRow.token_id)
        .run();
    } else {
      await env.DB.prepare('UPDATE token SET access_token = ?, expiration = ? WHERE id = ?')
        .bind(encAccess, expiration, tokenRow.token_id)
        .run();
    }
    return fn(refreshed.access_token);
  }
}
