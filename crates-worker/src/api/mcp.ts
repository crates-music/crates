// Port of MCPManifestController, MCPOAuthController, MCPWebController and
// MCPCorsConfiguration — the ChatGPT / Claude Desktop integration.
//
// These live at the host root (/.well-known/mcp, /mcp/**), not under /v1.

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from '../env';
import { createOrUpdateUser } from './auth';
import { findOrCreateAlbumBySpotifyId, spotifyAlbumToDto } from '../lib/catalog';
import { handelize } from '../lib/handle';
import {
  generateApiKey,
  generateCodeChallenge,
  generateCodeVerifier,
  retrieveAndRemoveCodeVerifier,
  storeCodeVerifier,
  validateApiKey,
} from '../lib/mcp-auth';
import { getServiceToken, spSearchAlbums, tokenRequest } from '../lib/spotify';
import type { UserRow } from '../lib/dto';

export const mcpRoutes = new Hono<{ Bindings: Env }>();

// MCPCorsConfiguration: chatgpt.com, claude.ai, *.openai.com, *.anthropic.com and any
// localhost port, with credentials, cached for an hour.
const ALLOWED_ORIGIN = /^https:\/\/(chatgpt\.com|claude\.ai|([\w-]+\.)*openai\.com|([\w-]+\.)*anthropic\.com)$|^https?:\/\/localhost(:\d+)?$/;

export const mcpCors = cors({
  origin: (origin) => (origin && ALLOWED_ORIGIN.test(origin) ? origin : undefined),
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowHeaders: ['Authorization', 'Content-Type', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  maxAge: 3600,
});

mcpRoutes.use('*', mcpCors);

const SCOPE = 'crates:full';

// ---------- manifest ----------

const baseUrl = (env: Env) => env.CRATES_MCP_BASE_URL;

export function mcpManifest(env: Env) {
  const base = baseUrl(env);
  return {
    name: 'crates',
    version: '1.0.0',
    description: 'AI-powered music crate creation and management for Spotify libraries',
    servers: [{ url: base }],
    tools: [
      {
        name: 'getUserLibrary',
        description: "Get user's recent library albums for AI taste analysis",
        method: 'GET',
        path: '/mcp/web/library',
        parameters: {
          limit: {
            type: 'integer',
            description: 'Number of recent albums to return (default 100)',
            required: false,
            defaultValue: 100,
          },
        },
      },
      {
        name: 'getUserCrates',
        description: "List all user's crates (public and private) with optional search",
        method: 'GET',
        path: '/mcp/web/crates',
        parameters: {
          search: {
            type: 'string',
            description: 'Optional search term to filter crates by name',
            required: false,
            defaultValue: null,
          },
        },
      },
      {
        name: 'createCrateWithAlbums',
        description:
          'Create a new crate and add multiple albums in one operation. Provide album references (title + artist), backend handles matching.',
        method: 'POST',
        path: '/mcp/web/crates',
        parameters: {
          name: { type: 'string', description: 'Crate name', required: true, defaultValue: null },
          description: { type: 'string', description: 'Crate description', required: false, defaultValue: null },
          isPublic: {
            type: 'boolean',
            description: 'Make crate public for sharing',
            required: false,
            defaultValue: false,
          },
          albums: {
            type: 'array',
            description: "Array of album references with 'title' and 'artist' fields",
            required: false,
            defaultValue: null,
          },
        },
      },
      {
        name: 'addAlbumsToCrate',
        description:
          'Add multiple albums to existing crate (additive). Provide album references (title + artist), backend handles matching.',
        method: 'PUT',
        path: '/mcp/web/crates/{crateId}/albums',
        parameters: {
          crateId: { type: 'string', description: 'The crate ID', required: true, defaultValue: null },
          albums: {
            type: 'array',
            description: "Array of album references with 'title' and 'artist' fields",
            required: true,
            defaultValue: null,
          },
        },
      },
    ],
    oauth: {
      authorizationUrl: `${base}/mcp/auth/authorize`,
      tokenUrl: `${base}/mcp/auth/token`,
      clientId: null,
      scopes: [SCOPE],
      type: 'oauth2',
    },
    baseUrl: base,
    transport: 'http',
  };
}

// ---------- OAuth proxy (/mcp/auth) ----------

// Step 1: the AI client sends the user here; we bounce to Spotify with PKCE, carrying
// the client's own state and redirect URI through in our state parameter.
mcpRoutes.get('/auth/authorize', async (c) => {
  const clientRedirectUri = c.req.query('redirect_uri');
  const state = c.req.query('state');
  if (!clientRedirectUri || !state) return c.json({ error: 'redirect_uri and state are required' }, 400);

  const internalState = `${state}|${clientRedirectUri}`;
  const verifier = generateCodeVerifier();
  await storeCodeVerifier(c.env, internalState, verifier);

  const params = new URLSearchParams({
    client_id: c.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: c.env.CRATES_MCP_REDIRECT_URI,
    scope: 'user-library-read',
    state: internalState,
    code_challenge: await generateCodeChallenge(verifier),
    code_challenge_method: 'S256',
  });
  return c.redirect(`https://accounts.spotify.com/authorize?${params}`, 302);
});

// Step 2: Spotify comes back here; exchange the code, mint an API key, and hand it to
// the AI client as its "authorization code".
mcpRoutes.get('/auth/callback', async (c) => {
  const code = c.req.query('code');
  const internalState = c.req.query('state');
  if (!code || !internalState) return c.text('Invalid request', 400);

  const separator = internalState.indexOf('|');
  if (separator < 0) return c.text('Invalid state parameter', 400);
  const originalState = internalState.slice(0, separator);
  const clientRedirectUri = internalState.slice(separator + 1);

  try {
    const verifier = await retrieveAndRemoveCodeVerifier(c.env, internalState);
    if (!verifier) throw new Error(`Code verifier not found or expired for state: ${internalState}`);

    const tokenResponse = await tokenRequest(c.env, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: c.env.CRATES_MCP_REDIRECT_URI,
      code_verifier: verifier,
    });

    const { userId } = await createOrUpdateUser(c.env, tokenResponse, code);
    const user = await c.env.DB.prepare('SELECT spotify_id FROM spotify_user WHERE id = ?')
      .bind(userId)
      .first<{ spotify_id: string }>();
    const apiKey = await generateApiKey(c.env, user!.spotify_id, SCOPE);

    const callback = new URL(clientRedirectUri);
    callback.searchParams.set('code', apiKey);
    callback.searchParams.set('state', originalState);
    return c.redirect(callback.toString(), 302);
  } catch (e) {
    console.error('mcp oauth callback failed', String(e));
    return c.text('OAuth flow failed', 500);
  }
});

// Step 3: the client trades that "code" for an access token — which is the same key.
mcpRoutes.post('/auth/token', async (c) => {
  const body = await c.req.parseBody().catch(() => ({}) as Record<string, unknown>);
  const code = String((body as Record<string, unknown>).code ?? c.req.query('code') ?? '');
  if (!code || !(await validateApiKey(c.env, code))) return c.body(null, 400);
  return c.json({ access_token: code, token_type: 'Bearer', expires_in: 86400, scope: SCOPE });
});

// ---------- web API (/mcp/web) ----------

/** Bearer key -> the SpotifyUser it was issued for. Null means 401. */
async function authedUser(c: { env: Env; req: { header: (n: string) => string | undefined } }): Promise<UserRow | null> {
  const header = c.req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  const key = await validateApiKey(c.env, header.slice(7));
  if (!key) return null;
  return c.env.DB.prepare('SELECT * FROM spotify_user WHERE spotify_id = ?').bind(key.user_id).first<UserRow>();
}

/** LibraryServiceImpl.formatReleaseYear — pre-1980 albums collapse to a decade. */
function formatReleaseYear(releaseDate: number | null): string {
  if (releaseDate == null) return 'Unknown';
  const year = new Date(releaseDate).getUTCFullYear();
  return year < 1980 ? `${Math.floor(year / 10) * 10}s` : String(year);
}

// GET /mcp/web/library?limit=100
mcpRoutes.get('/web/library', async (c) => {
  const user = await authedUser(c);
  if (!user) return c.body(null, 401);
  const limit = Number.parseInt(c.req.query('limit') ?? '', 10) || 100;

  const res = await c.env.DB.prepare(
    `SELECT a.name AS album, a.release_date,
            (SELECT ar.name FROM album_to_artist ata JOIN artist ar ON ar.id = ata.artist_id
              WHERE ata.album_id = a.id ORDER BY ar.id LIMIT 1) AS artist
       FROM library_album la JOIN album a ON a.id = la.album_id
      WHERE la.spotify_user_id = ? AND la.state = 'ACTIVE'
      ORDER BY la.added_at DESC LIMIT ?`,
  )
    .bind(user.id, limit)
    .all<{ album: string; release_date: number | null; artist: string | null }>();

  return c.json(
    (res.results ?? []).map((r) => ({
      artist: r.artist ?? 'Unknown Artist',
      album: r.album,
      year: formatReleaseYear(r.release_date),
    })),
  );
});

// GET /mcp/web/crates?search= — all of the user's active crates, public and private
mcpRoutes.get('/web/crates', async (c) => {
  const user = await authedUser(c);
  if (!user) return c.body(null, 401);
  const search = c.req.query('search')?.trim();

  const where = search
    ? `c.user_id = ? AND c.state = 'ACTIVE' AND LOWER(c.name) LIKE ?`
    : `c.user_id = ? AND c.state = 'ACTIVE'`;
  const binds: unknown[] = search ? [user.id, `%${search.toLowerCase()}%`] : [user.id];

  const res = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.description, c.public,
            (SELECT count(*) FROM crate_album ca WHERE ca.crate_id = c.id) AS album_count
       FROM crate c WHERE ${where} ORDER BY c.id LIMIT 100`,
  )
    .bind(...binds)
    .all<{ id: number; name: string; description: string | null; public: number; album_count: number }>();

  return c.json(
    (res.results ?? []).map((r) => ({
      crateId: String(r.id),
      name: r.name,
      description: r.description,
      isPublic: !!r.public,
      albumCount: r.album_count,
    })),
  );
});

interface AlbumReference {
  title?: string;
  artist?: string;
  albumId?: number | null;
}

interface MatchResult {
  requestedTitle: string;
  requestedArtist: string;
  matched: boolean;
  actualTitle: string | null;
  actualArtist: string | null;
  message: string;
  matchedAlbum: null;
}

/**
 * CrateActionServiceImpl.findBestAlbumMatch: exact title+artist first, then a
 * substring match either direction, else the first candidate.
 */
function findBestAlbumMatch(ref: AlbumReference, candidates: ReturnType<typeof spotifyAlbumToDto>[]) {
  const wantTitle = (ref.title ?? '').toLowerCase().trim();
  const wantArtist = (ref.artist ?? '').toLowerCase().trim();
  const artistOf = (a: (typeof candidates)[number]) => (a.artists[0]?.name ?? '').toLowerCase().trim();

  for (const album of candidates) {
    if (album.name.toLowerCase().trim() === wantTitle && artistOf(album) === wantArtist) return album;
  }
  for (const album of candidates) {
    const title = album.name.toLowerCase().trim();
    const artist = artistOf(album);
    if (
      (title.includes(wantTitle) || wantTitle.includes(title)) &&
      (artist.includes(wantArtist) || wantArtist.includes(artist))
    ) {
      return album;
    }
  }
  return candidates[0] ?? null;
}

/** Resolve album references to album ids, searching Spotify for the unresolved ones. */
async function resolveAlbums(
  env: Env,
  refs: AlbumReference[],
): Promise<{ matchResults: MatchResult[]; albumIds: number[] }> {
  const matchResults: MatchResult[] = [];
  const albumIds: number[] = [];

  for (const ref of refs) {
    const title = ref.title ?? '';
    const artist = ref.artist ?? '';
    if (ref.albumId != null) {
      albumIds.push(ref.albumId);
      matchResults.push({
        requestedTitle: title,
        requestedArtist: artist,
        matched: true,
        actualTitle: title,
        actualArtist: artist,
        message: 'Using existing album from library',
        matchedAlbum: null,
      });
      continue;
    }

    try {
      const token = await getServiceToken(env);
      const res = await spSearchAlbums(token, `${artist} ${title}`, 0, 5);
      const candidates = res.albums.items.map(spotifyAlbumToDto);
      if (candidates.length === 0) {
        matchResults.push({
          requestedTitle: title,
          requestedArtist: artist,
          matched: false,
          actualTitle: null,
          actualArtist: null,
          message: `No albums found matching: ${artist} - ${title}`,
          matchedAlbum: null,
        });
        continue;
      }
      const best = findBestAlbumMatch(ref, candidates);
      if (!best) {
        matchResults.push({
          requestedTitle: title,
          requestedArtist: artist,
          matched: false,
          actualTitle: null,
          actualArtist: null,
          message: `No good matches found for: ${artist} - ${title}`,
          matchedAlbum: null,
        });
        continue;
      }
      const actualArtist = best.artists[0]?.name ?? 'Unknown Artist';
      const stored = await findOrCreateAlbumBySpotifyId(env, best.spotifyId);
      albumIds.push(stored.id);
      matchResults.push({
        requestedTitle: title,
        requestedArtist: artist,
        matched: true,
        actualTitle: best.name,
        actualArtist,
        message: `Successfully matched: ${actualArtist} - ${best.name}`,
        matchedAlbum: null,
      });
    } catch (e) {
      matchResults.push({
        requestedTitle: title,
        requestedArtist: artist,
        matched: false,
        actualTitle: null,
        actualArtist: null,
        message: `Error matching album: ${String(e)}`,
        matchedAlbum: null,
      });
    }
  }

  return { matchResults, albumIds };
}

async function addAlbumIds(env: Env, crateId: number, userId: number, albumIds: number[]): Promise<void> {
  if (albumIds.length === 0) return;
  const now = Date.now();
  await env.DB.batch(
    albumIds.flatMap((albumId) => [
      env.DB.prepare('INSERT OR IGNORE INTO crate_album (crate_id, album_id, created_at) VALUES (?, ?, ?)').bind(
        crateId,
        albumId,
        now,
      ),
      env.DB.prepare('UPDATE library_album SET crated = 1 WHERE album_id = ? AND spotify_user_id = ?').bind(
        albumId,
        userId,
      ),
    ]),
  );
  await env.DB.prepare('UPDATE crate SET updated_at = ? WHERE id = ?').bind(now, crateId).run();
}

const publicUrlFor = (user: UserRow, crateHandle: string) =>
  `https://crates.music/${user.handle && user.handle.length > 0 ? user.handle : handelize(user.spotify_id)}/${crateHandle}`;

// POST /mcp/web/crates
mcpRoutes.post('/web/crates', async (c) => {
  const user = await authedUser(c);
  if (!user) return c.body(null, 401);

  try {
    const body = await c.req.json<{
      name?: string;
      description?: string;
      isPublic?: boolean;
      albums?: AlbumReference[];
    }>();

    const now = Date.now();
    const handle = handelize(body.name ?? '');
    const isPublic = !!body.isPublic;
    const row = await c.env.DB.prepare(
      `INSERT INTO crate (name, handle, user_id, state, public, description, trending_score, last_trending_update, created_at, updated_at)
       VALUES (?, ?, ?, 'ACTIVE', ?, ?, 0, ?, ?, ?) RETURNING id`,
    )
      .bind(body.name ?? '', handle, user.id, isPublic ? 1 : 0, body.description ?? null, now, now, now)
      .first<{ id: number }>();
    const crateId = row!.id;

    const { matchResults, albumIds } = await resolveAlbums(c.env, body.albums ?? []);
    await addAlbumIds(c.env, crateId, user.id, albumIds);

    const albumsAdded = matchResults.filter((m) => m.matched).length;
    const albumsFailed = matchResults.length - albumsAdded;
    const publicUrl = isPublic ? publicUrlFor(user, handle) : null;

    return c.json({
      crateId: String(crateId),
      crateName: body.name ?? '',
      description: body.description ?? null,
      handle,
      isPublic,
      totalAlbums: albumsAdded,
      albumsAdded,
      albumsFailed,
      matchResults,
      userMessage:
        `Created '${body.name ?? ''}' with ${albumsAdded} albums successfully added` +
        (albumsFailed > 0 ? ` (${albumsFailed} failed to match)` : '') +
        (publicUrl != null ? `. Share: ${publicUrl}` : ''),
      publicUrl,
    });
  } catch (e) {
    console.error('mcp create crate failed', String(e));
    return c.body(null, 500);
  }
});

// PUT /mcp/web/crates/{crateId}/albums — additive
mcpRoutes.put('/web/crates/:crateId/albums', async (c) => {
  const user = await authedUser(c);
  if (!user) return c.body(null, 401);

  try {
    const crateId = Number(c.req.param('crateId'));
    const crate = await c.env.DB.prepare(
      `SELECT id, name, handle, description, public, user_id FROM crate WHERE id = ? AND state = 'ACTIVE'`,
    )
      .bind(crateId)
      .first<{
        id: number;
        name: string;
        handle: string;
        description: string | null;
        public: number;
        user_id: number;
      }>();
    if (!crate) throw new Error(`crate not found: ${crateId}`);
    // AccessServiceImpl.assertAccess — owner or public crate, same as the Java.
    if (crate.user_id !== user.id && !crate.public) return c.body(null, 401);

    const body = await c.req.json<{ albums?: AlbumReference[] }>();
    const { matchResults, albumIds } = await resolveAlbums(c.env, body.albums ?? []);
    await addAlbumIds(c.env, crateId, user.id, albumIds);

    const albumsAdded = matchResults.filter((m) => m.matched).length;
    const albumsFailed = matchResults.length - albumsAdded;
    const totalRow = await c.env.DB.prepare('SELECT count(*) AS n FROM crate_album WHERE crate_id = ?')
      .bind(crateId)
      .first<{ n: number }>();
    const totalAlbums = totalRow?.n ?? 0;
    const isPublic = !!crate.public;
    const publicUrl = isPublic ? publicUrlFor(user, crate.handle) : null;

    return c.json({
      crateId: String(crateId),
      crateName: crate.name,
      description: crate.description,
      handle: crate.handle,
      isPublic,
      totalAlbums,
      albumsAdded,
      albumsFailed,
      matchResults,
      userMessage:
        `Added ${albumsAdded} albums to '${crate.name}'` +
        (albumsFailed > 0 ? ` (${albumsFailed} failed to match)` : '') +
        ` (total: ${totalAlbums} albums)` +
        (publicUrl != null ? `. Share: ${publicUrl}` : ''),
      publicUrl,
    });
  } catch (e) {
    console.error('mcp add albums failed', String(e));
    return c.body(null, 500);
  }
});
