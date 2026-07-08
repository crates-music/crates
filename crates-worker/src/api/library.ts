// Port of LibraryController. The sync endpoint marks the library state and
// will start the LIBRARY_SYNC Workflow in phase 4.

import { Hono } from 'hono';
import { currentUser, requireAuth, type AuthVars } from '../lib/auth';
import { spotifyAlbumToDto } from '../lib/catalog';
import type { AlbumDto } from '../lib/dto';
import { pageParams, springPage } from '../lib/page';
import { getServiceToken, spSearchAlbums } from '../lib/spotify';
import { findLibraryByUserId, findOrCreateLibrary, libraryAlbums, libraryDto } from '../lib/user-queries';

export const libraryRoutes = new Hono<AuthVars>();
libraryRoutes.use('*', requireAuth);

// GET /v1/library
libraryRoutes.get('/', async (c) => {
  const user = currentUser(c);
  const library = await findLibraryByUserId(c.env.DB, user.id);
  if (!library) return c.json({ error: 'library not found' }, 404);
  return c.json(libraryDto(library, user));
});

// GET /v1/library/albums?search=&filters=EXCLUDE_CRATED
libraryRoutes.get('/albums', async (c) => {
  const { page, size } = pageParams(c.req.query());
  const search = c.req.query('search')?.trim() || undefined;
  const filters = c.req.queries('filters') ?? [];
  const excludeCrated = filters.some((f) => f.split(',').includes('EXCLUDE_CRATED'));
  const { albums, total } = await libraryAlbums(c.env.DB, currentUser(c).id, {
    page,
    size,
    sort: null,
    search,
    excludeCrated,
  });
  return c.json(springPage(albums, page, size, total));
});

// GET /v1/library/albums/search — hybrid: library matches first, then Spotify
// global results (AlbumServiceImpl.searchHybrid).
libraryRoutes.get('/albums/search', async (c) => {
  const { page, size } = pageParams(c.req.query());
  const search = c.req.query('search')?.trim() ?? '';
  const { albums: libraryResults } = await libraryAlbums(c.env.DB, currentUser(c).id, {
    page,
    size,
    sort: null,
    search,
  });
  const globalFetchSize = Math.max(20, size);
  let globalResults: AlbumDto[] = [];
  try {
    const token = await getServiceToken(c.env);
    const res = await spSearchAlbums(token, search, 0, globalFetchSize);
    globalResults = res.albums.items.map(spotifyAlbumToDto);
  } catch (e) {
    console.warn('global album search failed', String(e));
  }
  const librarySpotifyIds = new Set(libraryResults.map((a) => a.spotifyId));
  const combined = [...libraryResults, ...globalResults.filter((a) => !librarySpotifyIds.has(a.spotifyId))];
  // Java wraps combined content in a PageImpl sized by the combined list.
  return c.json(springPage(combined, page, size, combined.length));
});

// POST /v1/library/sync
libraryRoutes.post('/sync', async (c) => {
  const user = currentUser(c);
  const library = await findOrCreateLibrary(c.env.DB, user.id);
  const inProgress = library.state === 'IMPORTING' ? 'IMPORTING' : 'UPDATING';
  await c.env.DB.prepare('UPDATE library SET state = ?, updated_at = ? WHERE id = ?')
    .bind(inProgress, Date.now(), library.id)
    .run();
  // TODO(phase 4): start LIBRARY_SYNC workflow instance for this user.
  return c.body(null, 200);
});
