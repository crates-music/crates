import { Hono } from 'hono';
import type { Env } from './env';
import { api } from './api/routes';
import { mcpCors, mcpManifest, mcpRoutes } from './api/mcp';
import { publicSite } from './public/site';

// Hostnames served by the SSR public site; everything else (app.crates.music,
// localhost, *.workers.dev) gets the SPA + API. In local dev, use
// http://crates.localhost:8787 to hit the public site (browsers resolve
// *.localhost to 127.0.0.1).
const PUBLIC_SITE_HOSTS = new Set(['crates.music', 'crates.page', 'crates.localhost']);

const app = new Hono<{ Bindings: Env }>();

// Legacy crates.page host: permanent redirect to crates.music (port of
// RedirectMiddleware in crates-public/main.go).
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.hostname === 'crates.page') {
    return c.redirect(`https://crates.music${url.pathname}${url.search}`, 301);
  }
  await next();
});

app.all('*', (c) => {
  const { hostname } = new URL(c.req.url);
  if (PUBLIC_SITE_HOSTS.has(hostname)) {
    return publicSite.fetch(c.req.raw, c.env, c.executionCtx);
  }
  return appHost.fetch(c.req.raw, c.env, c.executionCtx);
});

// app.crates.music: JSON API + Angular SPA static assets.
// Prod serves the API under /api (environment.prod.ts: baseUri = .../api); dev Angular
// talks to the bare /v1. Mount both so the same Worker serves either config.
const appHost = new Hono<{ Bindings: Env }>();
appHost.route('/api/v1', api);
appHost.route('/v1', api);
// MCP lives at the host root, not under /v1 (MCPManifestController + /mcp/**).
appHost.route('/mcp', mcpRoutes);
appHost.get('/.well-known/mcp', mcpCors, (c) => c.json(mcpManifest(c.env)));
appHost.options('/.well-known/mcp', mcpCors, (c) => c.body(null, 204));
// Unmatched API paths must 404 as JSON, not fall through to the SPA's index.html.
appHost.all('/api/*', (c) => c.json({ error: 'not found' }, 404));
appHost.all('/v1/*', (c) => c.json({ error: 'not found' }, 404));
appHost.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export { LibrarySyncWorkflow } from './workflows/library-sync';

// TrendingServiceImpl.calculateTrendingScores as one set-based statement:
// score = (views7d*5 + views30d*2) * max(0.1, 1 - daysSinceLastActivity/90),
// rounded to 4 places; last activity = latest view, else crate creation.
// Timestamps are epoch ms; integer division by 86400000 floors to whole days
// (matching ChronoUnit.DAYS).
const TRENDING_SQL = `
UPDATE crate SET
  trending_score = ROUND(
    ((SELECT count(*) FROM crate_view cv WHERE cv.crate_id = crate.id AND cv.viewed_at > ?2) * 5.0 +
     (SELECT count(*) FROM crate_view cv WHERE cv.crate_id = crate.id AND cv.viewed_at > ?3) * 2.0)
    * MAX(0.1, 1.0 - (((?1 - COALESCE(
        (SELECT MAX(cv.viewed_at) FROM crate_view cv WHERE cv.crate_id = crate.id),
        crate.created_at, ?1)) / 86400000) / 90.0)),
    4),
  last_trending_update = ?1
WHERE crate.state = 'ACTIVE' AND crate.public = 1
  AND crate.user_id IN (SELECT id FROM spotify_user WHERE private_profile = 0)`;

export default {
  fetch: app.fetch,

  // Hourly: trending recompute + expired MCP API key cleanup.
  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    const now = Date.now();
    const trending = await env.DB.prepare(TRENDING_SQL)
      .bind(now, now - 7 * 86_400_000, now - 30 * 86_400_000)
      .run();
    const cleanup = await env.DB.prepare('DELETE FROM mcp_api_key WHERE expires_at < ?').bind(now).run();
    console.log(
      JSON.stringify({
        event: 'scheduled_run',
        cratesScored: trending.meta.changes,
        expiredKeysDeleted: cleanup.meta.changes,
      }),
    );
  },
} satisfies ExportedHandler<Env>;
