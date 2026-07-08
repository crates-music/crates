// Postgres -> D1 export/transform for the Cloudflare migration.
// See docs/cloudflare-migration/01-schema-and-data.md.
//
// Reads the live crates Postgres DB and emits chunked SQL files to scripts/out/,
// applying the schema transforms:
//   - image/album_to_image/artist_to_image/spotify_user_to_image denormalized into
//     an `images` JSON TEXT column on album/artist/spotify_user
//   - timestamps -> epoch milliseconds, booleans -> 0/1
//   - token.access_token / token.refresh_token: AES-ECB -> AES-GCM re-encryption
//   - mcp_api_key.api_key (AES-ECB) -> api_key_hash (SHA-256 hex of plaintext)
//
// Usage:
//   PG_URL=postgres://crates:cratesforfun@localhost:5432/crates \
//   CRATES_ENCRYPTION_KEY=<prod key> \
//   node scripts/export-pg-to-d1.mjs
//
// Import (remote or --local):
//   wrangler d1 migrations apply crates --remote
//   for f in scripts/out/*.sql; do wrangler d1 execute crates --remote --file "$f"; done

import pg from 'pg';
import { createCipheriv, createDecipheriv, createHash, randomBytes, webcrypto } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'out');
const PG_URL = process.env.PG_URL ?? 'postgres://crates:cratesforfun@localhost:5432/crates';
const KEY_STR = process.env.CRATES_ENCRYPTION_KEY;
if (!KEY_STR) {
  console.error('CRATES_ENCRYPTION_KEY is required (the existing backend secret).');
  process.exit(1);
}
const KEY = Buffer.from(KEY_STR, 'utf8');
if (![16, 24, 32].includes(KEY.length)) {
  console.error(`CRATES_ENCRYPTION_KEY must be 16/24/32 bytes, got ${KEY.length}`);
  process.exit(1);
}
const BITS = KEY.length * 8;

const ROWS_PER_INSERT = 100;
const ROWS_PER_FILE = 50_000;

// ---------- crypto ----------

// Legacy: Java AES/ECB/PKCS5Padding, base64 (util/EncryptionConverter.java)
function decryptEcb(b64) {
  const d = createDecipheriv(`aes-${BITS}-ecb`, KEY, null);
  return Buffer.concat([d.update(Buffer.from(b64, 'base64')), d.final()]).toString('utf8');
}

// New: AES-GCM, base64(iv[12] || ciphertext || tag[16]) — WebCrypto-decryptable in the Worker.
function encryptGcm(plaintext) {
  const iv = randomBytes(12);
  const c = createCipheriv(`aes-${BITS}-gcm`, KEY, iv);
  const ct = Buffer.concat([c.update(plaintext, 'utf8'), c.final()]);
  return Buffer.concat([iv, ct, c.getAuthTag()]).toString('base64');
}

const sha256Hex = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

// Prove the Worker will be able to read what we write: decrypt a GCM sample with
// WebCrypto exactly as src/ will, and round-trip our own ECB to confirm PKCS5/PKCS7
// compatibility with the Java converter.
async function cryptoSelfTest() {
  const sample = 'crypto-self-test-' + randomBytes(8).toString('hex');
  const packed = Buffer.from(encryptGcm(sample), 'base64');
  const k = await webcrypto.subtle.importKey('raw', KEY, 'AES-GCM', false, ['decrypt']);
  const plain = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: packed.subarray(0, 12) },
    k,
    packed.subarray(12),
  );
  if (Buffer.from(plain).toString('utf8') !== sample) throw new Error('GCM self-test failed');
  const e = createCipheriv(`aes-${BITS}-ecb`, KEY, null);
  const ecb = Buffer.concat([e.update(sample, 'utf8'), e.final()]).toString('base64');
  if (decryptEcb(ecb) !== sample) throw new Error('ECB self-test failed');
}

// ---------- SQL emission ----------

const sqlLit = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error(`non-finite number: ${v}`);
    return String(v);
  }
  if (typeof v === 'boolean') return v ? '1' : '0';
  return `'${String(v).replaceAll('\u0000', '').replaceAll("'", "''")}'`;
};

let fileSeq = 0;
const manifest = {};

function emitTable(table, columns, rows) {
  manifest[table] = rows.length;
  for (let f = 0; f * ROWS_PER_FILE < rows.length || (f === 0 && rows.length === 0); f++) {
    const slice = rows.slice(f * ROWS_PER_FILE, (f + 1) * ROWS_PER_FILE);
    if (rows.length > 0 && slice.length === 0) break;
    const parts = ['PRAGMA defer_foreign_keys = on;'];
    for (let i = 0; i < slice.length; i += ROWS_PER_INSERT) {
      const values = slice
        .slice(i, i + ROWS_PER_INSERT)
        .map((r) => `(${columns.map((c) => sqlLit(r[c])).join(',')})`)
        .join(',\n');
      parts.push(`INSERT INTO ${table} (${columns.join(',')}) VALUES\n${values};`);
    }
    const name = `${String(++fileSeq).padStart(3, '0')}_${table}${f > 0 ? `_${f}` : ''}.sql`;
    writeFileSync(join(OUT_DIR, name), parts.join('\n') + '\n');
    console.log(`  ${name}: ${slice.length} rows`);
    if (rows.length === 0) break;
  }
}

// ---------- main ----------

async function main() {
  await cryptoSelfTest();
  console.log(`crypto self-test ok (AES-${BITS})`);
  mkdirSync(OUT_DIR, { recursive: true });

  // Naive TIMESTAMP columns hold UTC in prod; parse as UTC -> epoch ms.
  pg.types.setTypeParser(1114, (v) => Date.parse(v.replace(' ', 'T') + 'Z'));
  pg.types.setTypeParser(1184, (v) => Date.parse(v)); // timestamptz (unused, but safe)
  pg.types.setTypeParser(20, (v) => Number(v)); // int8
  pg.types.setTypeParser(1700, (v) => Number(v)); // numeric (trending_score)

  const db = new pg.Client({ connectionString: PG_URL });
  await db.connect();
  const q = async (sql) => (await db.query(sql)).rows;

  // Image maps: entity id -> JSON array ordered by width desc.
  async function imageMap(joinTable, ownerCol) {
    const rows = await q(
      `SELECT j.${ownerCol} AS owner_id, i.url, i.width, i.height
         FROM ${joinTable} j JOIN image i ON i.id = j.image_id
        ORDER BY j.${ownerCol}, i.width DESC NULLS LAST`,
    );
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.owner_id)) map.set(r.owner_id, []);
      map.get(r.owner_id).push({ url: r.url, width: r.width, height: r.height });
    }
    return map;
  }
  console.log('loading image joins...');
  const albumImages = await imageMap('album_to_image', 'album_id');
  const artistImages = await imageMap('artist_to_image', 'artist_id');
  const userImages = await imageMap('spotify_user_to_image', 'spotify_user_id');
  const imagesJson = (map, id) => (map.has(id) ? JSON.stringify(map.get(id)) : null);

  // Wipe file first (000_) so a full re-import is just `for f in out/*.sql`.
  const wipeOrder = [
    'feedback', 'mcp_api_key', 'crate_view', 'library_album', 'library', 'crate_album',
    'crate', 'album_to_genre', 'artist_to_genre', 'album_to_artist', 'album', 'artist',
    'genre', 'spotify_user', 'token',
  ];
  writeFileSync(
    join(OUT_DIR, '000_wipe.sql'),
    'PRAGMA defer_foreign_keys = on;\n' + wipeOrder.map((t) => `DELETE FROM ${t};`).join('\n') + '\n',
  );

  console.log('exporting tables...');

  emitTable(
    'token',
    ['id', 'auth_token', 'code', 'access_token', 'refresh_token', 'expiration'],
    (await q('SELECT id, auth_token, code, access_token, refresh_token, expiration FROM token')).map((r) => ({
      ...r,
      access_token: encryptGcm(decryptEcb(r.access_token)),
      refresh_token: encryptGcm(decryptEcb(r.refresh_token)),
    })),
  );

  emitTable(
    'spotify_user',
    ['id', 'spotify_id', 'country', 'href', 'display_name', 'email', 'spotify_uri', 'token_id',
     'handle', 'bio', 'private_profile', 'email_opt_in', 'images', 'created_at', 'updated_at'],
    (await q('SELECT * FROM spotify_user')).map((r) => ({ ...r, images: imagesJson(userImages, r.id) })),
  );

  emitTable('genre', ['id', 'name'], await q('SELECT id, name FROM genre'));

  emitTable(
    'artist',
    ['id', 'spotify_id', 'spotify_uri', 'name', 'popularity', 'genres_fetched', 'images'],
    (await q('SELECT * FROM artist')).map((r) => ({ ...r, images: imagesJson(artistImages, r.id) })),
  );

  emitTable(
    'album',
    ['id', 'spotify_id', 'upc', 'href', 'name', 'popularity', 'release_date', 'images'],
    (await q('SELECT * FROM album')).map((r) => ({ ...r, images: imagesJson(albumImages, r.id) })),
  );

  emitTable('album_to_artist', ['album_id', 'artist_id'], await q('SELECT album_id, artist_id FROM album_to_artist'));
  emitTable('artist_to_genre', ['artist_id', 'genre_id'], await q('SELECT artist_id, genre_id FROM artist_to_genre'));
  emitTable('album_to_genre', ['album_id', 'genre_id'], await q('SELECT album_id, genre_id FROM album_to_genre'));

  emitTable(
    'crate',
    ['id', 'name', 'handle', 'user_id', 'state', 'public', 'description', 'trending_score',
     'last_trending_update', 'created_at', 'updated_at'],
    await q('SELECT id, name, handle, user_id, state, "public", description, trending_score, last_trending_update, created_at, updated_at FROM crate'),
  );

  emitTable('crate_album', ['id', 'crate_id', 'album_id', 'created_at'],
    await q('SELECT id, crate_id, album_id, created_at FROM crate_album'));

  emitTable('library', ['id', 'spotify_user_id', 'state', 'created_at', 'updated_at'],
    await q('SELECT id, spotify_user_id, state, created_at, updated_at FROM library'));

  emitTable(
    'library_album',
    ['id', 'album_id', 'spotify_user_id', 'state', 'added_at', 'created_at', 'archived_at', 'crated'],
    await q('SELECT id, album_id, spotify_user_id, state, added_at, created_at, archived_at, crated FROM library_album'),
  );

  emitTable(
    'crate_view',
    ['id', 'crate_id', 'viewer_id', 'viewed_at', 'ip_address', 'user_agent', 'referrer'],
    await q('SELECT id, crate_id, viewer_id, viewed_at, ip_address, user_agent, referrer FROM crate_view'),
  );

  const mcpRows = [];
  for (const r of await q('SELECT id, api_key, user_id, scope, created_at, expires_at FROM mcp_api_key')) {
    try {
      mcpRows.push({ ...r, api_key_hash: sha256Hex(decryptEcb(r.api_key)) });
    } catch (e) {
      console.warn(`  WARN mcp_api_key id=${r.id} failed to decrypt, skipping: ${e.message}`);
    }
  }
  emitTable('mcp_api_key', ['id', 'api_key_hash', 'user_id', 'scope', 'created_at', 'expires_at'], mcpRows);

  emitTable('feedback', ['id', 'user_id', 'message', 'created_at'],
    await q('SELECT id, user_id, message, created_at FROM feedback'));

  await db.end();
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('\nrow counts (verify against D1 after import):');
  console.table(manifest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
