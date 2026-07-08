import { Hono } from 'hono';
import type { Env } from '../env';

// JSON API for app.crates.music. Route-for-route port of the Spring controllers
// (crates-backend/src/main/java/page/crates/controller/) lands here in phases 2-3.
export const api = new Hono<{ Bindings: Env }>();

api.get('/health', async (c) => {
  const row = await c.env.DB.prepare('SELECT count(*) AS crates FROM crate').first<{ crates: number }>();
  return c.json({ status: 'ok', crates: row?.crates ?? 0 });
});
