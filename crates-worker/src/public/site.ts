// Server-rendered public site for crates.music — port of the crates-public Go
// service (main.go), reading D1 directly instead of calling the backend API.

import { Hono } from 'hono';
import type { Env } from '../env';
import { clientIp } from '../api/public';
import { userDto } from '../lib/dto';
import { goPage } from '../lib/page';
import {
  allPublicCrates,
  crateAlbums,
  findCrateByUserAndHandle,
  findUserByHandleOrSpotifyId,
  publicCratesByUser,
  recordAnonymousView,
  trendingCrates,
} from '../lib/public-queries';
import { errorPage } from './layout';
import { privacyPolicyPage, termsOfServicePage } from './legal';
import { cratePage, homePage, profilePage, type FeaturedCrate } from './pages';
import { classifyRequest, shouldBlockRequest } from './validation';

export const publicSite = new Hono<{ Bindings: Env }>();

const canonicalUrl = (path: string) => 'https://crates.music' + path;

const notFoundPage = (c: { html: (h: unknown, s: 404) => Response | Promise<Response> }) =>
  c.html(
    errorPage('Not Found', "The page you're looking for doesn't exist or isn't available."),
    404,
  );

// Go-style pagination defaults (main.go getPageFromQuery/getSizeFromQuery).
const intParam = (v: string | undefined, fallback: number, max = 100): number => {
  const n = parseInt(v ?? '', 10);
  if (!Number.isFinite(n) || n < (fallback === 0 ? 0 : 1) || (max && n > max)) return fallback;
  return n;
};

// BotFilteringMiddleware port: classify by first path segment + user agent,
// serve the 404 page early for suspicious/attack traffic.
publicSite.use('*', async (c, next) => {
  const path = new URL(c.req.url).pathname;
  const skip =
    path === '/health' || path === '/' || path === '/static' || path.startsWith('/static/') || path.startsWith('/api/');
  if (!skip) {
    const username = path.split('/')[1] ?? '';
    const classification = classifyRequest(username, c.req.header('User-Agent') ?? '');
    if (shouldBlockRequest(classification)) {
      return notFoundPage(c);
    }
  }
  // LoggingMiddleware port (structured request log + correlation id).
  const correlationId = c.req.header('X-Correlation-ID') ?? 'pub-' + Math.random().toString(36).slice(2, 10);
  c.header('X-Correlation-ID', correlationId);
  const start = Date.now();
  await next();
  console.log(
    JSON.stringify({
      correlationId,
      method: c.req.method,
      uri: path,
      status: c.res.status,
      durationMs: Date.now() - start,
      event: 'http_request_complete',
    }),
  );
});

publicSite.get('/health', (c) => c.json({ status: 'ok' }));

// Static assets live in the Worker's assets bundle under /static/. The SPA
// fallback would otherwise turn missing files into index.html — guard on
// content type so missing statics 404 properly.
publicSite.get('/static/*', async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);
  if (res.ok && (res.headers.get('Content-Type') ?? '').includes('text/html')) {
    return c.notFound();
  }
  return res;
});

publicSite.get('/', async (c) => {
  let crates: Awaited<ReturnType<typeof trendingCrates>>['crates'] = [];
  try {
    ({ crates } = await trendingCrates(c.env.DB, 0, 6));
  } catch (e) {
    console.warn('trending crates failed, falling back to recent', String(e));
    try {
      ({ crates } = await allPublicCrates(c.env.DB, {
        page: 0,
        size: 6,
        sort: { prop: 'createdAt', desc: true },
      }));
    } catch (e2) {
      console.warn('recent crates fallback failed, continuing with empty list', String(e2));
    }
  }
  const featured: FeaturedCrate[] = crates.map((crate) => ({
    id: crate.id,
    name: crate.name,
    handle: crate.handle,
    ownerName: crate.user.handle || crate.user.spotifyId,
    ownerSpotifyId: crate.user.spotifyId,
    imageUri: crate.imageUri,
    createdAt: crate.createdAt,
  }));
  return c.html(homePage(featured));
});

publicSite.get('/privacy-policy', (c) => c.html(privacyPolicyPage(canonicalUrl('/privacy-policy'))));
publicSite.get('/terms-of-service', (c) => c.html(termsOfServicePage(canonicalUrl('/terms-of-service'))));

// AJAX endpoints used by static/js/app.js and the inline Alpine code.
// Go returned 500 {"error": ...} on any backend failure — same here.
publicSite.get('/api/:username/crates', async (c) => {
  try {
    const user = await findUserByHandleOrSpotifyId(c.env.DB, c.req.param('username'));
    if (!user || user.private_profile) throw new Error('user unavailable');
    const page = intParam(c.req.query('page'), 0);
    const size = intParam(c.req.query('size'), 20);
    const search = c.req.query('search')?.trim() || undefined;
    const { crates, total } = await publicCratesByUser(c.env.DB, user.id, {
      page,
      size,
      sort: { prop: 'updatedAt', desc: true },
      search,
    });
    return c.json(goPage(crates, page, size, total));
  } catch (e) {
    console.error('user crates api failed', String(e));
    return c.json({ error: 'Failed to fetch crates' }, 500);
  }
});

publicSite.get('/api/:username/:handle/albums', async (c) => {
  try {
    const user = await findUserByHandleOrSpotifyId(c.env.DB, c.req.param('username'));
    if (!user || user.private_profile) throw new Error('user unavailable');
    const crate = await findCrateByUserAndHandle(c.env.DB, user.id, c.req.param('handle'));
    if (!crate || !crate.publicCrate) throw new Error('crate unavailable');
    const page = intParam(c.req.query('page'), 0);
    const size = intParam(c.req.query('size'), 20);
    const search = c.req.query('search')?.trim() || undefined;
    const { albums, total } = await crateAlbums(c.env.DB, crate.id, {
      page,
      size,
      sort: { prop: 'createdAt', desc: true },
      search,
    });
    return c.json(goPage(albums, page, size, total));
  } catch (e) {
    console.error('crate albums api failed', String(e));
    return c.json({ error: 'Failed to fetch albums' }, 500);
  }
});

// Profile page — /{username}
publicSite.get('/:username', async (c) => {
  const userRow = await findUserByHandleOrSpotifyId(c.env.DB, c.req.param('username'));
  if (!userRow || userRow.private_profile) return notFoundPage(c);
  const { crates, total } = await publicCratesByUser(c.env.DB, userRow.id, {
    page: 0,
    size: 12,
    sort: { prop: 'updatedAt', desc: true },
  });
  return c.html(
    profilePage({
      user: userDto(userRow, { maskEmail: true }),
      crates,
      hasMoreCrates: total > crates.length,
      ogURL: canonicalUrl(new URL(c.req.url).pathname),
    }),
  );
});

// Crate page — /{username}/{handle}
publicSite.get('/:username/:handle', async (c) => {
  const userRow = await findUserByHandleOrSpotifyId(c.env.DB, c.req.param('username'));
  if (!userRow || userRow.private_profile) return notFoundPage(c);
  const crate = await findCrateByUserAndHandle(c.env.DB, userRow.id, c.req.param('handle'));
  if (!crate || !crate.publicCrate) return notFoundPage(c);

  // Analytics — fire-and-forget (was a goroutine calling the backend).
  c.executionCtx.waitUntil(
    recordAnonymousView(
      c.env.DB,
      crate.id,
      clientIp(c.req.raw.headers),
      c.req.header('User-Agent') ?? null,
      c.req.header('Referer') ?? null,
    ),
  );

  const { albums, total } = await crateAlbums(c.env.DB, crate.id, {
    page: 0,
    size: 20,
    sort: { prop: 'createdAt', desc: true },
  });
  return c.html(
    cratePage({
      user: userDto(userRow, { maskEmail: true }),
      crate,
      albums,
      hasMore: total > albums.length,
      totalAlbums: total,
      ogURL: canonicalUrl(new URL(c.req.url).pathname),
    }),
  );
});

publicSite.notFound((c) => notFoundPage(c));
