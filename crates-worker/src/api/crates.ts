// Port of CrateController + the owner paths of CrateServiceImpl.
// AccessService semantics: owner OR public crate may read; mutations happen
// through the same assertAccess check (matching the Java behavior).

import { Hono } from 'hono';
import { currentUser, requireAuth, type AuthVars } from '../lib/auth';
import { findOrCreateAlbumBySpotifyId } from '../lib/catalog';
import { crateDto, type CrateDto } from '../lib/dto';
import { handelize } from '../lib/handle';
import { echoedSort, pageParams, springPage } from '../lib/page';
import { crateAlbums } from '../lib/public-queries';
import { activeCratesByUser, findCrateRowById } from '../lib/user-queries';

export const crateRoutes = new Hono<AuthVars>();
crateRoutes.use('*', requireAuth);

const notFound = (c: { json: (o: object, s: 404) => Response }) => c.json({ error: 'not found' }, 404);
const unauthorized = (c: { json: (o: object, s: 401) => Response }) => c.json({ error: 'unauthorized' }, 401);

/** AccessServiceImpl.assertAccess: owner or public crate. */
const hasAccess = (crate: CrateDto, userId: number) => crate.user.id === userId || crate.publicCrate;

async function loadCrate(c: Parameters<typeof currentUser>[0], id: number) {
  const row = await findCrateRowById(c.env.DB, id);
  return row ? crateDto(row) : null;
}

// GET /v1/crate — current user's active crates
crateRoutes.get('/', async (c) => {
  const { page, size, sort } = pageParams(c.req.query());
  const search = c.req.query('search')?.trim() || undefined;
  const { crates, total } = await activeCratesByUser(c.env.DB, currentUser(c).id, { page, size, sort, search });
  return c.json(springPage(crates, page, size, total, sort));
});

// POST /v1/crate
crateRoutes.post('/', async (c) => {
  const body = await c.req.json<{ name?: string; description?: string }>();
  if (!body.name?.trim()) return c.json({ error: 'name is required' }, 400);
  const now = Date.now();
  const row = await c.env.DB.prepare(
    `INSERT INTO crate (name, handle, user_id, state, public, description, trending_score, last_trending_update, created_at, updated_at)
     VALUES (?, ?, ?, 'ACTIVE', 1, ?, 0, ?, ?, ?) RETURNING id`,
  )
    .bind(body.name, handelize(body.name), currentUser(c).id, body.description ?? null, now, now, now)
    .first<{ id: number }>();
  return c.json(await loadCrate(c, row!.id));
});

crateRoutes.get('/:id', async (c) => {
  const crate = await loadCrate(c, Number(c.req.param('id')));
  if (!crate) return notFound(c);
  if (!hasAccess(crate, currentUser(c).id)) return unauthorized(c);
  return c.json(crate);
});

// PUT /v1/crate/{id} — name (re-handelized), description, publicCrate
crateRoutes.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const crate = await loadCrate(c, id);
  if (!crate) return notFound(c);
  if (!hasAccess(crate, currentUser(c).id)) return unauthorized(c);
  const body = await c.req.json<{ name?: string; description?: string | null; publicCrate?: boolean }>();
  const name = body.name ?? null;
  await c.env.DB.prepare(
    `UPDATE crate SET
       name = COALESCE(?, name),
       handle = COALESCE(?, handle),
       description = ?,
       public = ?,
       updated_at = ?
     WHERE id = ?`,
  )
    .bind(name, name ? handelize(name) : null, body.description ?? null, body.publicCrate ? 1 : 0, Date.now(), id)
    .run();
  return c.json(await loadCrate(c, id));
});

// DELETE /v1/crate/{id} — archive
crateRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const crate = await loadCrate(c, id);
  if (!crate) return notFound(c);
  if (!hasAccess(crate, currentUser(c).id)) return unauthorized(c);
  await c.env.DB.prepare(`UPDATE crate SET state = 'ARCHIVED' WHERE id = ?`).bind(id).run();
  return c.body(null, 200);
});

// GET /v1/crate/{id}/albums
crateRoutes.get('/:id/albums', async (c) => {
  const crate = await loadCrate(c, Number(c.req.param('id')));
  if (!crate) return notFound(c);
  if (!hasAccess(crate, currentUser(c).id)) return unauthorized(c);
  const { page, size, sort } = pageParams(c.req.query());
  const search = c.req.query('search')?.trim() || undefined;
  const { albums, total } = await crateAlbums(c.env.DB, crate.id, { page, size, sort, search });
  return c.json(springPage(albums, page, size, total, echoedSort(sort)));
});

async function addAlbumsToCrate(
  c: Parameters<typeof currentUser>[0],
  crateId: number,
  spotifyIds: string[],
): Promise<Response> {
  const crate = await loadCrate(c, crateId);
  if (!crate) return notFound(c);
  if (!hasAccess(crate, currentUser(c).id)) return unauthorized(c);
  const now = Date.now();
  for (const spotifyId of spotifyIds) {
    const album = await findOrCreateAlbumBySpotifyId(c.env, spotifyId);
    await c.env.DB.prepare(
      'INSERT OR IGNORE INTO crate_album (crate_id, album_id, created_at) VALUES (?, ?, ?)',
    )
      .bind(crateId, album.id, now)
      .run();
    // libraryAlbumService.markCrated
    await c.env.DB.prepare(
      'UPDATE library_album SET crated = 1 WHERE album_id = ? AND spotify_user_id = ?',
    )
      .bind(album.id, currentUser(c).id)
      .run();
  }
  await c.env.DB.prepare('UPDATE crate SET updated_at = ? WHERE id = ?').bind(now, crateId).run();
  return c.json(await loadCrate(c, crateId));
}

// POST /v1/crate/{id}/album — body is an Album DTO; only spotifyId is used
crateRoutes.post('/:id/album', async (c) => {
  const body = await c.req.json<{ spotifyId?: string }>();
  if (!body.spotifyId) return c.json({ error: 'spotifyId is required' }, 400);
  return addAlbumsToCrate(c, Number(c.req.param('id')), [body.spotifyId]);
});

// POST /v1/crate/{id}/albums — body { albums: [{spotifyId}...] }
crateRoutes.post('/:id/albums', async (c) => {
  const body = await c.req.json<{ albums?: { spotifyId?: string }[] }>();
  const ids = (body.albums ?? []).map((a) => a.spotifyId).filter((s): s is string => !!s);
  return addAlbumsToCrate(c, Number(c.req.param('id')), ids);
});

// DELETE /v1/crate/{crateId}/album/{albumId}
crateRoutes.delete('/:id/album/:albumId', async (c) => {
  const id = Number(c.req.param('id'));
  const crate = await loadCrate(c, id);
  if (!crate) return notFound(c);
  if (!hasAccess(crate, currentUser(c).id)) return unauthorized(c);
  await c.env.DB.prepare('DELETE FROM crate_album WHERE crate_id = ? AND album_id = ?')
    .bind(id, Number(c.req.param('albumId')))
    .run();
  await c.env.DB.prepare('UPDATE crate SET updated_at = ? WHERE id = ?').bind(Date.now(), id).run();
  return c.json(await loadCrate(c, id));
});
