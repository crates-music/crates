// Port of AuthController + UserServiceImpl.findOrCreateUserForCode:
// Spotify authorization-code flow issuing the app's own opaque session token.

import { Hono } from 'hono';
import type { Env } from '../env';
import { encryptGcm, randomAlphanumeric } from '../lib/crypto';
import { handelize } from '../lib/handle';
import { exchangeCode, spGetCurrentUser, type SpotifyUserProfile, type TokenResponse } from '../lib/spotify';
import { findOrCreateLibrary } from '../lib/user-queries';

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.get('/login', (c) => {
  const params = new URLSearchParams({
    client_id: c.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: c.env.SPOTIFY_REDIRECT_URI,
    scope: 'user-library-read',
    state: crypto.randomUUID(),
  });
  return c.redirect(`https://accounts.spotify.com/authorize?${params}`, 302);
});

authRoutes.get('/callback', async (c) => {
  const { error, code } = c.req.query();
  // Java returns an empty 200 for denied/missing-code (with matching TODOs).
  if (error === 'access_denied' || !code?.trim()) return c.body(null, 200);

  const { authToken, created, userId } = await createOrUpdateUserForCode(c.env, code);

  if (created) {
    console.log(JSON.stringify({ event: 'first_sync_needed', userId }));
    // Library starts in IMPORTING; the sync Workflow (phase 4) picks it up.
    await findOrCreateLibrary(c.env.DB, userId);
  }
  // TODO(phase 4): trigger LIBRARY_SYNC workflow (FIRST_SYNC on created, resync otherwise).

  const callback = new URL(c.env.CRATES_AUTH_CALLBACK_URI);
  callback.searchParams.set('token', authToken);
  return c.redirect(callback.toString(), 302);
});

export async function createOrUpdateUserForCode(
  env: Env,
  code: string,
): Promise<{ authToken: string; created: boolean; userId: number }> {
  const tokenResponse = await exchangeCode(env, code);
  return createOrUpdateUser(env, tokenResponse, code);
}

/**
 * Exchange result -> token row + user upsert. On re-login the old token row
 * is replaced (UserServiceImpl.createOrUpdateUser).
 */
export async function createOrUpdateUser(
  env: Env,
  tokenResponse: TokenResponse,
  code: string,
): Promise<{ authToken: string; created: boolean; userId: number }> {
  const profile: SpotifyUserProfile = await spGetCurrentUser(tokenResponse.access_token);
  const authToken = randomAlphanumeric(256);
  const encAccess = await encryptGcm(env.CRATES_ENCRYPTION_KEY, tokenResponse.access_token);
  const encRefresh = await encryptGcm(env.CRATES_ENCRYPTION_KEY, tokenResponse.refresh_token ?? '');
  const expiration = Date.now() + tokenResponse.expires_in * 1000;

  const tokenRow = await env.DB.prepare(
    `INSERT INTO token (auth_token, code, access_token, refresh_token, expiration)
     VALUES (?, ?, ?, ?, ?) RETURNING id`,
  )
    .bind(authToken, code, encAccess, encRefresh, expiration)
    .first<{ id: number }>();

  const now = Date.now();
  const existing = await env.DB.prepare('SELECT id, token_id FROM spotify_user WHERE spotify_id = ?')
    .bind(profile.id)
    .first<{ id: number; token_id: number | null }>();

  if (existing) {
    await env.DB.prepare('UPDATE spotify_user SET token_id = ?, updated_at = ? WHERE id = ?')
      .bind(tokenRow!.id, now, existing.id)
      .run();
    if (existing.token_id) {
      await env.DB.prepare('DELETE FROM token WHERE id = ?').bind(existing.token_id).run();
    }
    return { authToken, created: false, userId: existing.id };
  }

  const images =
    profile.images && profile.images.length > 0
      ? JSON.stringify(
          [...profile.images]
            .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
            .map((i) => ({ id: null, url: i.url, width: i.width, height: i.height })),
        )
      : null;
  const user = await env.DB.prepare(
    `INSERT INTO spotify_user (spotify_id, country, href, display_name, email, spotify_uri,
                               token_id, handle, private_profile, email_opt_in, images, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?) RETURNING id`,
  )
    .bind(
      profile.id,
      profile.country ?? null,
      profile.href,
      profile.display_name ?? profile.id,
      profile.email ?? null,
      profile.uri,
      tokenRow!.id,
      handelize(profile.id),
      images,
      now,
      now,
    )
    .first<{ id: number }>();
  return { authToken, created: true, userId: user!.id };
}
