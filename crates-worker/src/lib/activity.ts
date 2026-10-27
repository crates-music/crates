// Usage tracking: a daily activity row per user (server-side, every authenticated
// surface) plus raw events posted by the app. See migrations/0002_usage_tracking.sql.

export type ActivitySource = 'app' | 'mcp';

export const EVENT_TYPES = new Set(['app_open', 'page_view', 'album_play']);
export const MAX_EVENTS_PER_REQUEST = 25;
const MAX_PROPS_CHARS = 1000;

const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Per-isolate memo so a busy session (the sync screen polls every second) costs one
// D1 write per user per day per isolate rather than one per request.
const recorded = new Map<string, string>();

/** Mark the user active today. Never throws — tracking must not break requests. */
export async function recordActivity(db: D1Database, userId: number, source: ActivitySource): Promise<void> {
  const day = utcDay(Date.now());
  const key = `${userId}:${source}`;
  if (recorded.get(key) === day) return;
  try {
    await db
      .prepare('INSERT OR IGNORE INTO user_activity (user_id, day, source) VALUES (?, ?, ?)')
      .bind(userId, day, source)
      .run();
    if (recorded.size > 10_000) recorded.clear();
    recorded.set(key, day);
  } catch (e) {
    console.error('recordActivity failed', { userId, source, error: String(e) });
  }
}

export interface IncomingEvent {
  type?: unknown;
  crateId?: unknown;
  albumId?: unknown;
  props?: unknown;
}

const optionalId = (v: unknown): number | null => (Number.isSafeInteger(v) && (v as number) > 0 ? (v as number) : null);

/**
 * Validate and store a batch of app events. Unknown types and malformed entries are
 * dropped rather than failing the batch. Returns the number stored.
 */
export async function recordEvents(db: D1Database, userId: number, events: IncomingEvent[]): Promise<number> {
  const now = Date.now();
  const stmts: D1PreparedStatement[] = [];
  for (const e of events.slice(0, MAX_EVENTS_PER_REQUEST)) {
    if (typeof e?.type !== 'string' || !EVENT_TYPES.has(e.type)) continue;
    let props: string | null = null;
    if (e.props && typeof e.props === 'object' && !Array.isArray(e.props)) {
      props = JSON.stringify(e.props);
      if (props.length > MAX_PROPS_CHARS) props = null;
    }
    stmts.push(
      db
        .prepare('INSERT INTO event (user_id, type, crate_id, album_id, props, at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(userId, e.type, optionalId(e.crateId), optionalId(e.albumId), props, now),
    );
  }
  if (stmts.length > 0) await db.batch(stmts);
  return stmts.length;
}
