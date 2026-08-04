// Port of UserController. Private profiles are visible only to their owner;
// /user/current validates the Spotify token live (ExpiredTokenException -> 401).

import { Hono } from 'hono';
import { currentUser, requireAuth, type AuthVars } from '../lib/auth';
import { userDto, type UserRow } from '../lib/dto';
import { pageParams, springPage } from '../lib/page';
import { findUserByHandleOrSpotifyId, publicCratesByUser } from '../lib/public-queries';
import { SpotifyApiError, spGetCurrentUser, withUserToken } from '../lib/spotify';
import { searchUsers } from '../lib/user-queries';

export const userRoutes = new Hono<AuthVars>();
userRoutes.use('*', requireAuth);

const publicUserDto = (row: UserRow) => {
  const full = userDto(row);
  return {
    id: full.id,
    spotifyId: full.spotifyId,
    displayName: full.displayName,
    handle: full.handle,
    bio: full.bio,
    privateProfile: full.privateProfile,
    images: full.images,
  };
};

// GET /v1/user/current — validates the Spotify token with a live /me call.
userRoutes.get('/current', async (c) => {
  const user = currentUser(c);
  try {
    await withUserToken(c.env, user, (token) => spGetCurrentUser(token));
  } catch (e) {
    if (e instanceof SpotifyApiError && (e.status === 401 || e.status === 400)) {
      return c.json({ error: 'expired token' }, 401);
    }
    throw e;
  }
  return c.json(userDto(user));
});

// PUT /v1/user/profile
userRoutes.put('/profile', async (c) => {
  const user = currentUser(c);
  const body = await c.req.json<{
    handle?: string;
    bio?: string;
    email?: string;
    emailOptIn?: boolean;
    privateProfile?: boolean;
  }>();
  if (body.handle != null && body.handle.length > 64) return c.json({ error: 'Handle must be 64 characters or less' }, 400);
  if (body.bio != null && body.bio.length > 280) return c.json({ error: 'Bio must be 280 characters or less' }, 400);

  if (body.handle != null && body.handle.trim()) {
    const handle = body.handle.trim();
    const existing = await c.env.DB.prepare('SELECT id FROM spotify_user WHERE handle = ?')
      .bind(handle)
      .first<{ id: number }>();
    if (existing && existing.id !== user.id) return c.json({ error: 'handle already taken' }, 409);
    await c.env.DB.prepare('UPDATE spotify_user SET handle = ? WHERE id = ?').bind(handle, user.id).run();
  }
  if (body.bio != null) {
    await c.env.DB.prepare('UPDATE spotify_user SET bio = ? WHERE id = ?')
      .bind(body.bio.trim() || null, user.id)
      .run();
  }
  if (body.email != null) {
    await c.env.DB.prepare('UPDATE spotify_user SET email = ? WHERE id = ?')
      .bind(body.email.trim() || null, user.id)
      .run();
  }
  if (body.emailOptIn != null) {
    await c.env.DB.prepare('UPDATE spotify_user SET email_opt_in = ? WHERE id = ?')
      .bind(body.emailOptIn ? 1 : 0, user.id)
      .run();
  }
  if (body.privateProfile != null) {
    await c.env.DB.prepare('UPDATE spotify_user SET private_profile = ? WHERE id = ?')
      .bind(body.privateProfile ? 1 : 0, user.id)
      .run();
  }
  await c.env.DB.prepare('UPDATE spotify_user SET updated_at = ? WHERE id = ?').bind(Date.now(), user.id).run();
  const updated = await c.env.DB.prepare('SELECT * FROM spotify_user WHERE id = ?').bind(user.id).first<UserRow>();
  return c.json(userDto(updated!));
});

// GET /v1/user/search
userRoutes.get('/search', async (c) => {
  const { page, size } = pageParams(c.req.query());
  const search = c.req.query('search') ?? '';
  const { users, total } = await searchUsers(c.env.DB, search, page, size);
  return c.json(springPage(users.map((u) => userDto(u)), page, size, total));
});

async function loadVisibleUser(c: Parameters<typeof currentUser>[0], target: UserRow | null) {
  if (!target) return { error: c.json({ error: 'not found' }, 404) };
  if (target.private_profile && target.id !== currentUser(c).id) {
    return { error: c.json({ error: 'unauthorized' }, 401) };
  }
  return { user: target };
}

// GET /v1/user/profile/{identifier} and /v1/user/handle/{handle} — same semantics
userRoutes.get('/profile/:identifier', async (c) => {
  const target = await findUserByHandleOrSpotifyId(c.env.DB, c.req.param('identifier'));
  const { user, error } = await loadVisibleUser(c, target);
  if (error) return error;
  return c.json(userDto(user!));
});
userRoutes.get('/handle/:identifier', async (c) => {
  const target = await findUserByHandleOrSpotifyId(c.env.DB, c.req.param('identifier'));
  const { user, error } = await loadVisibleUser(c, target);
  if (error) return error;
  return c.json(userDto(user!));
});

// GET /v1/user/{userId} — returns the PublicUser shape
userRoutes.get('/:userId{[0-9]+}', async (c) => {
  const target = await c.env.DB.prepare('SELECT * FROM spotify_user WHERE id = ?')
    .bind(Number(c.req.param('userId')))
    .first<UserRow>();
  const { user, error } = await loadVisibleUser(c, target);
  if (error) return error;
  return c.json(publicUserDto(user!));
});

// GET /v1/user/{userId}/crates — the user's public crates
userRoutes.get('/:userId{[0-9]+}/crates', async (c) => {
  const target = await c.env.DB.prepare('SELECT * FROM spotify_user WHERE id = ?')
    .bind(Number(c.req.param('userId')))
    .first<UserRow>();
  const { user, error } = await loadVisibleUser(c, target);
  if (error) return error;
  const { page, size, sort } = pageParams(c.req.query());
  const search = c.req.query('search')?.trim() || undefined;
  const { crates, total } = await publicCratesByUser(c.env.DB, user!.id, { page, size, sort, search });
  return c.json(springPage(crates, page, size, total, sort));
});
