// Port of PublicController.java — the /v1/public/* JSON API.
// Status contract: 404 user/crate not found, 401 private profile/crate
// (UnauthorizedAccessException), view recording always 200.

import { Hono } from 'hono';
import type { Env } from '../env';
import { userDto } from '../lib/dto';
import { echoedSort, pageParams, springPage } from '../lib/page';
import {
  allPublicCrates,
  crateAlbums,
  findCrateById,
  findCrateByUserAndHandle,
  findUserByHandleOrSpotifyId,
  publicCratesByUser,
  recordAnonymousView,
  trendingCrates,
} from '../lib/public-queries';

export const publicApi = new Hono<{ Bindings: Env }>();

/** Client IP: Cloudflare header first, then the legacy proxy headers. */
export function clientIp(headers: Headers): string | null {
  const cf = headers.get('CF-Connecting-IP');
  if (cf) return cf;
  const xff = headers.get('X-Forwarded-For');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('X-Real-IP');
}

const notFound = (c: { json: (o: object, s: 404) => Response }) => c.json({ error: 'not found' }, 404);
const unauthorized = (c: { json: (o: object, s: 401) => Response }) => c.json({ error: 'unauthorized' }, 401);

publicApi.get('/user/:username', async (c) => {
  const user = await findUserByHandleOrSpotifyId(c.env.DB, c.req.param('username'));
  if (!user) return notFound(c);
  if (user.private_profile) return unauthorized(c);
  return c.json(userDto(user, { maskEmail: true }));
});

publicApi.get('/user/:username/crates', async (c) => {
  const user = await findUserByHandleOrSpotifyId(c.env.DB, c.req.param('username'));
  if (!user) return notFound(c);
  if (user.private_profile) return unauthorized(c);
  const { page, size, sort } = pageParams(c.req.query());
  const search = c.req.query('search')?.trim() || undefined;
  const { crates, total } = await publicCratesByUser(c.env.DB, user.id, { page, size, sort, search });
  return c.json(springPage(crates, page, size, total, sort));
});

publicApi.get('/user/:username/crate/:handle', async (c) => {
  const user = await findUserByHandleOrSpotifyId(c.env.DB, c.req.param('username'));
  if (!user) return notFound(c);
  const crate = await findCrateByUserAndHandle(c.env.DB, user.id, c.req.param('handle'));
  if (!crate) return notFound(c);
  if (user.private_profile || !crate.publicCrate) return unauthorized(c);
  c.executionCtx.waitUntil(
    recordAnonymousView(
      c.env.DB,
      crate.id,
      clientIp(c.req.raw.headers),
      c.req.header('User-Agent') ?? null,
      c.req.header('Referer') ?? null,
    ),
  );
  return c.json(crate);
});

publicApi.get('/user/:username/crate/:handle/albums', async (c) => {
  const user = await findUserByHandleOrSpotifyId(c.env.DB, c.req.param('username'));
  if (!user) return notFound(c);
  const crate = await findCrateByUserAndHandle(c.env.DB, user.id, c.req.param('handle'));
  if (!crate) return notFound(c);
  if (user.private_profile || !crate.publicCrate) return unauthorized(c);
  const { page, size, sort } = pageParams(c.req.query());
  const search = c.req.query('search')?.trim() || undefined;
  const { albums, total } = await crateAlbums(c.env.DB, crate.id, { page, size, sort, search });
  return c.json(springPage(albums, page, size, total, echoedSort(sort)));
});

publicApi.get('/crates', async (c) => {
  // PublicController caps page size at 10 for the global listings.
  const { page, size, sort } = pageParams(c.req.query(), { maxSize: 10 });
  const { crates, total } = await allPublicCrates(c.env.DB, { page, size, sort });
  return c.json(springPage(crates, page, size, total, sort));
});

publicApi.get('/crates/trending', async (c) => {
  const { page, size } = pageParams(c.req.query(), { maxSize: 10 });
  const { crates, total } = await trendingCrates(c.env.DB, page, size);
  return c.json(springPage(crates, page, size, total));
});

publicApi.post('/crate/:crateId/view', async (c) => {
  // Java wraps everything in try/catch and returns 200 no matter what.
  try {
    const crateId = Number(c.req.param('crateId'));
    const crate = await findCrateById(c.env.DB, crateId);
    if (!crate || !crate.public) return c.body(null, 200);
    let body: { ipAddress?: string; userAgent?: string; referrer?: string } | null = null;
    try {
      body = await c.req.json();
    } catch {
      // no body — use request data (direct API call)
    }
    await recordAnonymousView(
      c.env.DB,
      crateId,
      body?.ipAddress ?? clientIp(c.req.raw.headers),
      body?.userAgent ?? c.req.header('User-Agent') ?? null,
      body?.referrer ?? c.req.header('Referer') ?? null,
    );
  } catch (e) {
    console.error('recordCrateView failed', String(e));
  }
  return c.body(null, 200);
});
