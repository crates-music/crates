import { Hono } from 'hono';
import type { Env } from './env';
import { api } from './api/routes';
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
// Unmatched API paths must 404 as JSON, not fall through to the SPA's index.html.
appHost.all('/api/*', (c) => c.json({ error: 'not found' }, 404));
appHost.all('/v1/*', (c) => c.json({ error: 'not found' }, 404));
appHost.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default {
  fetch: app.fetch,

  // Hourly (see wrangler.jsonc triggers): trending recompute + MCP key cleanup.
  // Implemented in phase 4 — see docs/cloudflare-migration/04-background-work.md.
  async scheduled(_controller: ScheduledController, _env: Env, _ctx: ExecutionContext): Promise<void> {
    // no-op until phase 4
  },
} satisfies ExportedHandler<Env>;
