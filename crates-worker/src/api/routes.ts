import { Hono } from 'hono';
import type { Env } from '../env';
import { SpotifyApiError } from '../lib/spotify';
import { authRoutes } from './auth';
import { crateRoutes } from './crates';
import { libraryRoutes } from './library';
import { albumRoutes, feedbackRoutes, searchRoutes } from './misc';
import { publicApi } from './public';
import { userRoutes } from './users';

// JSON API for app.crates.music. Route-for-route port of the Spring
// controllers (crates-backend/src/main/java/page/crates/controller/).
// Still to port: MCP endpoints and auto-categorize (phase 3b).
export const api = new Hono<{ Bindings: Env }>();

api.route('/public', publicApi);
api.route('/auth', authRoutes);
api.route('/crate', crateRoutes);
api.route('/library', libraryRoutes);
api.route('/user', userRoutes);
api.route('/search', searchRoutes);
api.route('/album', albumRoutes);
api.route('/feedback', feedbackRoutes);

api.get('/health', async (c) => {
  const row = await c.env.DB.prepare('SELECT count(*) AS crates FROM crate').first<{ crates: number }>();
  return c.json({ status: 'ok', crates: row?.crates ?? 0 });
});

api.onError((err, c) => {
  // SpotifyAlbumNotFoundException / SpotifyArtistNotFoundException -> 404
  if (err instanceof SpotifyApiError && err.status === 404) {
    return c.json({ error: 'not found on Spotify' }, 404);
  }
  console.error('api error', c.req.method, c.req.path, String(err));
  return c.json({ error: 'internal error' }, 500);
});
