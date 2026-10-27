// Port of HandleServiceImpl.handelize — slugifies crate names and
// auto-generated user handles.

const COMBINING_MARKS = /[\u0300-\u036f]/g;
const UNSAFE_CHARS = /[^a-zA-Z0-9\s-]/g;
const WHITESPACE = /\s+/g;
const MULTIPLE_HYPHENS = /-+/g;

export function handelize(name: string | null | undefined): string {
  if (!name || !name.trim()) return 'untitled';
  const ascii = name.normalize('NFD').replace(COMBINING_MARKS, '');
  let result = ascii
    .replace(UNSAFE_CHARS, '')
    .replace(WHITESPACE, '-')
    .replace(MULTIPLE_HYPHENS, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
  if (!result) return 'untitled';
  if (result.length > 50) result = result.slice(0, 50).replace(/-+$/g, '');
  return result;
}

/**
 * A crate handle for `name` that is free for this user: handelize(name), or the first
 * free `-2`, `-3`, ... suffix. crate has UNIQUE (user_id, handle), and inserting a
 * taken handle was a 500 ("Jazz" after "jazz", "Hip-Hop" after "Hip Hop").
 * excludeCrateId lets a rename keep the crate's own handle.
 */
export async function uniqueCrateHandle(
  db: D1Database,
  userId: number,
  name: string | null | undefined,
  excludeCrateId?: number,
): Promise<string> {
  const base = handelize(name);
  // Handles are [a-z0-9-] only, so LIKE has no wildcards to escape.
  const rows = await db
    .prepare('SELECT handle FROM crate WHERE user_id = ? AND (handle = ? OR handle LIKE ?) AND id != ?')
    .bind(userId, base, `${base}-%`, excludeCrateId ?? -1)
    .all<{ handle: string }>();
  const taken = new Set((rows.results ?? []).map((r) => r.handle));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}
