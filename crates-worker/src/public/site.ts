import { Hono } from 'hono';
import type { Env } from '../env';

// Server-rendered public site for crates.music — replaces the crates-public Go
// service. Pages (home, profile, crate, legal, error) are ported to Hono JSX in
// phase 2 — see docs/cloudflare-migration/02-public-surface.md.
export const publicSite = new Hono<{ Bindings: Env }>();

publicSite.get('/health', (c) => c.json({ status: 'ok' }));

publicSite.get('/', (c) =>
  c.html('<!doctype html><title>crates</title><p>crates.music — SSR port lands in phase 2</p>'),
);
