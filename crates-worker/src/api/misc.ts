// Ports of SearchController (unified search), AlbumController (GLOBAL /
// LIBRARY album search), and FeedbackController.

import { Hono } from 'hono';
import { currentUser, requireAuth, type AuthVars } from '../lib/auth';
import { spotifyAlbumToDto } from '../lib/catalog';
import { userDto, type UserRow } from '../lib/dto';
import { pageParams, springPage } from '../lib/page';
import { getServiceToken, spSearchAlbums } from '../lib/spotify';
import { libraryAlbums, searchUsers, unifiedSearchCrates } from '../lib/user-queries';

export const searchRoutes = new Hono<AuthVars>();
searchRoutes.use('*', requireAuth);

// GET /v1/search?q= — UnifiedSearchResponse { users, crates }
searchRoutes.get('/', async (c) => {
  const q = c.req.query('q') ?? '';
  const { page, size } = pageParams(c.req.query());
  const [{ users }, { crates }] = await Promise.all([
    searchUsers(c.env.DB, q, page, size),
    unifiedSearchCrates(c.env.DB, q, page, size),
  ]);
  const publicUsers = users.map((u: UserRow) => {
    const full = userDto(u);
    return {
      id: full.id,
      spotifyId: full.spotifyId,
      displayName: full.displayName,
      handle: full.handle,
      bio: full.bio,
      privateProfile: full.privateProfile,
      images: full.images,
    };
  });
  return c.json({ users: publicUsers, crates });
});

// AlbumController — GET /v1/album?search=&searchType=GLOBAL|LIBRARY (public in Java)
export const albumRoutes = new Hono<AuthVars>();

albumRoutes.get('/', requireAuth, async (c) => {
  const { page, size } = pageParams(c.req.query());
  const search = c.req.query('search') ?? '';
  const searchType = c.req.query('searchType');
  if (searchType === 'LIBRARY') {
    const { albums, total } = await libraryAlbums(c.env.DB, currentUser(c).id, {
      page,
      size,
      sort: null,
      search,
    });
    return c.json(springPage(albums, page, size, total));
  }
  const token = await getServiceToken(c.env);
  const res = await spSearchAlbums(token, search, page * size, size);
  return c.json(springPage(res.albums.items.map(spotifyAlbumToDto), page, size, res.albums.total));
});

// FeedbackController — POST /v1/feedback, 201
export const feedbackRoutes = new Hono<AuthVars>();
feedbackRoutes.use('*', requireAuth);

feedbackRoutes.post('/', async (c) => {
  const body = await c.req.json<{ message?: string }>();
  const message = body.message?.trim();
  if (!message) return c.json({ error: 'Message is required' }, 400);
  if (message.length > 2000) return c.json({ error: 'Message must be 2000 characters or less' }, 400);
  await c.env.DB.prepare('INSERT INTO feedback (user_id, message, created_at) VALUES (?, ?, ?)')
    .bind(currentUser(c).id, message, Date.now())
    .run();
  return c.body(null, 201);
});
