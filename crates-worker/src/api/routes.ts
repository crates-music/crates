import { Hono } from 'hono';
import type { Env } from '../env';
import { SpotifyApiError } from '../lib/spotify';
import { authRoutes } from './auth';
import { autoCategorizeRoutes } from './auto-categorize';
import { crateRoutes } from './crates';
import { libraryRoutes } from './library';
import { albumRoutes, eventRoutes, feedbackRoutes, searchRoutes } from './misc';
import { publicApi } from './public';
import { userRoutes } from './users';

// JSON API for app.crates.music. Route-for-route port of the Spring
// controllers (crates-backend/src/main/java/page/crates/controller/).
// The MCP endpoints sit at the host root rather than under /v1 — see index.ts.
export const api = new Hono<{ Bindings: Env }>();

api.route('/public', publicApi);
api.route('/auth', authRoutes);
api.route('/crate', crateRoutes);
api.route('/library', libraryRoutes);
api.route('/user', userRoutes);
api.route('/search', searchRoutes);
api.route('/album', albumRoutes);
api.route('/feedback', feedbackRoutes);
api.route('/events', eventRoutes);
api.route('/auto-categorize', autoCategorizeRoutes);

api.get('/health', async (c) => {
  const row = await c.env.DB.prepare('SELECT count(*) AS crates FROM crate').first<{ crates: number }>();
  return c.json({ status: 'ok', crates: row?.crates ?? 0 });
});

api.onError((err, c) => {
  // SpotifyAlbumNotFoundException / SpotifyArtistNotFoundException -> 404
  if (err instanceof SpotifyApiError && err.status === 404) {
    return c.json({ error: 'not found on Spotify' }, 404);
  }
  // userId is set by requireAuth; it lets a user's report be matched to the log line.
  const userId = (c.var as { user?: { id: number } }).user?.id ?? null;
  console.error('api error', c.req.method, c.req.path, `userId=${userId}`, String(err));
  return c.json({ error: 'internal error' }, 500);
});
