// Phase 2 parity harness — docs/cloudflare-migration/02-public-surface.md.
//
// Diffs the Worker's public surface against production for the same real entities:
//   - JSON: https://app.crates.music/api/v1/public/*  vs  worker /api/v1/public/*
//   - HTML: https://crates.music/*                    vs  worker with Host: crates.music
//
// Sample entities come from the local D1 copy of prod, so the URLs exercised are ones
// that actually get traffic (top crates by view count, plus handle-less users whose
// public URLs fall back to spotifyId).
//
// Usage:
//   npx wrangler dev            # in another shell
//   node scripts/parity-check.mjs [--worker http://127.0.0.1:8787] [--crates N]
//                                 [--include-view-recording] [--out report.json]
//
// By default this only calls endpoints that are side-effect-free on production. The
// crate-detail page and its JSON endpoint both insert a crate_view row in prod
// (PublicController.isPublicCrate -> viewTrackingService.recordView, and the Go crate
// page's goroutine), so they are opt-in behind --include-view-recording.

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const WORKER = flag('--worker', 'http://127.0.0.1:8787').replace(/\/$/, '');
// The Worker routes by hostname, and fetch() refuses to send a Host header — so reach
// the SSR site through crates.localhost, which resolves to 127.0.0.1 and is already in
// PUBLIC_SITE_HOSTS (src/index.ts).
const WORKER_SITE = WORKER.replace(/\/\/[^:/]+/, '//crates.localhost');
const CRATE_SAMPLES = Number(flag('--crates', '6'));
const INCLUDE_VIEW_RECORDING = args.includes('--include-view-recording');
const OUT = flag('--out', null);

const PROD_APP = 'https://app.crates.music';
const PROD_SITE = 'https://crates.music';
const UA = 'crates-parity-check/1.0';

// Recomputed hourly on prod by the trending cron, so it drifts from any snapshot.
const VOLATILE = new Set(['trendingScore', 'lastTrendingUpdate']);

// Differences that are understood and deliberate. Each one still appears in the report;
// they just don't count as failures, so a real regression isn't buried under known noise.
// See the results table in docs/cloudflare-migration/02-public-surface.md.
const ACCEPTED = [
  {
    why: 'epoch-ms storage truncates prod microseconds',
    match: (d) => d.kind === 'VALUE' && /(^|\.)(createdAt|updatedAt)$/.test(d.path),
  },
  {
    why: 'prod collections are unordered Hibernate Sets (no @OrderBy) — worker orders width-desc/id',
    match: (d) => d.kind === 'ORDER' && /\.(images|genres|artists)$/.test(d.path),
  },
  {
    why: 'prod list order is unspecified (JPQL has no ORDER BY, request sends no sort)',
    match: (d) => (d.kind === 'ORDER' || d.kind.startsWith('ONLY_IN_')) && d.path === '.content',
  },
  {
    why: 'og/twitter image follows images[0], which prod picks arbitrarily; worker picks the largest',
    match: (d) => d.kind === 'VALUE' && /^\.(ogImage|twitterImage|artwork\[\d+\])$/.test(d.path),
  },
  {
    // CrateDecoratorImpl orders crate_album by createdAt DESC with no tiebreaker, and
    // bulk-added albums share a timestamp to the microsecond — so prod picks arbitrarily
    // among them and can even disagree with its own albums-list query. The worker breaks
    // the tie on id DESC, which is stable.
    why: 'crate cover is chosen among createdAt ties that prod resolves arbitrarily',
    match: (d) => d.kind === 'VALUE' && /(^|\.)imageUri$/.test(d.path),
  },
  {
    // Only the worker's own inline Alpine code reads these, and it uses content/last.
    why: 'Go unmarshalled into narrower structs; the worker returns full DTOs (superset)',
    match: (d, c) => c.name.startsWith('site:api') && ['EXTRA_KEY', 'MISSING_KEY', 'TYPE'].includes(d.kind),
  },
];

const acceptedReason = (d, c) => ACCEPTED.find((r) => r.match(d, c))?.why ?? null;

// ---------- sample selection ----------

function d1(sql) {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'crates', '--local', '--json', '--command', sql],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
  );
  return JSON.parse(out)[0].results;
}

function samples() {
  const crates = d1(`
    SELECT c.handle crate_handle, coalesce(u.handle, u.spotify_id) username,
           (SELECT count(*) FROM crate_album ca WHERE ca.crate_id = c.id) albums
      FROM crate c JOIN spotify_user u ON u.id = c.user_id
     WHERE c.state = 'ACTIVE' AND c.public = 1 AND u.private_profile = 0
     ORDER BY (SELECT count(*) FROM crate_view v WHERE v.crate_id = c.id) DESC LIMIT ${CRATE_SAMPLES}`);
  const users = [...new Set(crates.map((c) => c.username))];
  return { crates, users };
}

// ---------- cases ----------

function buildCases({ crates, users }) {
  const cases = [];
  const json = (name, path, opts = {}) =>
    cases.push({ name, kind: 'json', prod: PROD_APP + '/api' + path, worker: WORKER + '/api' + path, ...opts });
  const html = (name, path, opts = {}) =>
    cases.push({ name, kind: 'html', prod: PROD_SITE + path, worker: WORKER_SITE + path, ...opts });

  json('crates:page0', '/v1/public/crates?page=0&size=10');
  json('crates:page1', '/v1/public/crates?page=1&size=10');
  json('crates:trending', '/v1/public/crates/trending?page=0&size=10');

  for (const u of users) {
    json(`user:${u}`, `/v1/public/user/${encodeURIComponent(u)}`);
    json(`user:${u}:crates`, `/v1/public/user/${encodeURIComponent(u)}/crates?page=0&size=10`);
    json(`user:${u}:crates:sortName`, `/v1/public/user/${encodeURIComponent(u)}/crates?page=0&size=10&sort=name,asc`);
    html(`site:/${u}`, `/${encodeURIComponent(u)}`);
    html(`site:api:${u}:crates`, `/api/${encodeURIComponent(u)}/crates`, { kind: 'json' });
  }

  for (const c of crates) {
    const base = `/v1/public/user/${encodeURIComponent(c.username)}/crate/${encodeURIComponent(c.crate_handle)}`;
    json(`crate:${c.username}/${c.crate_handle}:albums`, `${base}/albums?page=0&size=20`);
    // The four sorts the frontend actually emits (album-sort.model.ts SORT_PARAM_MAP).
    // artistName is the hand-ported GROUP BY query — the likeliest place to drift.
    for (const [label, param] of [
      ['sortArtist', 'artistName,asc'],
      ['sortAlbumName', 'album.name,asc'],
      ['sortRelease', 'album.releaseDate,desc'],
      ['sortRecent', 'createdAt,desc'],
    ]) {
      json(`crate:${c.username}/${c.crate_handle}:albums:${label}`, `${base}/albums?page=0&size=20&sort=${encodeURIComponent(param)}`);
    }
    html(`site:api:${c.username}/${c.crate_handle}:albums`, `/api/${encodeURIComponent(c.username)}/${encodeURIComponent(c.crate_handle)}/albums`, { kind: 'json' });

    if (INCLUDE_VIEW_RECORDING) {
      json(`crate:${c.username}/${c.crate_handle}`, base, { recordsView: true });
      html(`site:/${c.username}/${c.crate_handle}`, `/${encodeURIComponent(c.username)}/${encodeURIComponent(c.crate_handle)}`, { recordsView: true });
    }
  }

  html('site:/', '/');
  html('site:/privacy-policy', '/privacy-policy');
  html('site:/terms-of-service', '/terms-of-service');
  return cases;
}

// ---------- fetching ----------

async function get(url) {
  const headers = { 'User-Agent': UA, Accept: '*/*' };
  const res = await fetch(url, { headers, redirect: 'manual' });
  const body = await res.text();
  return { status: res.status, contentType: res.headers.get('content-type') ?? '', body };
}

// ---------- comparison ----------

function diffJson(a, b, path = '', out = []) {
  const ta = a === null ? 'null' : Array.isArray(a) ? 'array' : typeof a;
  const tb = b === null ? 'null' : Array.isArray(b) ? 'array' : typeof b;
  if (ta !== tb) {
    out.push({ path, kind: 'TYPE', prod: `${ta}`, worker: `${tb}` });
    return out;
  }
  if (ta === 'array') {
    // Positional comparison is worthless when the two sides order a list differently —
    // every element then mismatches every field. Arrays of identified objects are
    // matched by id, with ordering reported once as its own finding.
    const identified = (arr) => arr.length > 0 && arr.every((o) => o && typeof o === 'object' && !Array.isArray(o) && 'id' in o);
    if (identified(a) && identified(b)) {
      const ia = a.map((o) => o.id);
      const ib = b.map((o) => o.id);
      const sa = new Set(ia);
      const sb = new Set(ib);
      const onlyProd = ia.filter((id) => !sb.has(id));
      const onlyWorker = ib.filter((id) => !sa.has(id));
      if (onlyProd.length) out.push({ path, kind: 'ONLY_IN_PROD', prod: onlyProd.slice(0, 8), worker: undefined });
      if (onlyWorker.length) out.push({ path, kind: 'ONLY_IN_WORKER', prod: undefined, worker: onlyWorker.slice(0, 8) });
      if (!onlyProd.length && !onlyWorker.length && ia.join() !== ib.join()) {
        out.push({ path, kind: 'ORDER', prod: ia.slice(0, 8), worker: ib.slice(0, 8) });
      }
      const byId = new Map(b.map((o) => [o.id, o]));
      for (const item of a) {
        if (byId.has(item.id)) diffJson(item, byId.get(item.id), `${path}[id=${item.id}]`, out);
      }
      return out;
    }
    if (a.length !== b.length) out.push({ path: `${path}.length`, kind: 'SHAPE', prod: a.length, worker: b.length });
    for (let i = 0; i < Math.min(a.length, b.length); i++) diffJson(a[i], b[i], `${path}[${i}]`, out);
    return out;
  }
  if (ta === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (!(k in a)) out.push({ path: `${path}.${k}`, kind: 'EXTRA_KEY', prod: undefined, worker: b[k] });
      else if (!(k in b)) out.push({ path: `${path}.${k}`, kind: 'MISSING_KEY', prod: a[k], worker: undefined });
      else if (VOLATILE.has(k)) continue;
      else diffJson(a[k], b[k], `${path}.${k}`, out);
    }
    return out;
  }
  if (a !== b) out.push({ path, kind: 'VALUE', prod: a, worker: b });
  return out;
}

const metaTag = (html, attr, value) => {
  const tag = html.match(new RegExp(`<meta[^>]*${attr}=["']${value}["'][^>]*>`, 'i'))?.[0];
  return tag?.match(/content=["']([^"']*)["']/i)?.[1] ?? null;
};

// Go templates and Hono JSX will never be byte-identical; compare what the SSR service
// exists to produce (per 02-public-surface.md: titles, meta tags, album lists).
function htmlSignature(body) {
  return {
    title: body.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? null,
    description: metaTag(body, 'name', 'description'),
    ogTitle: metaTag(body, 'property', 'og:title'),
    ogDescription: metaTag(body, 'property', 'og:description'),
    ogImage: metaTag(body, 'property', 'og:image'),
    ogUrl: metaTag(body, 'property', 'og:url'),
    ogType: metaTag(body, 'property', 'og:type'),
    twitterCard: metaTag(body, 'name', 'twitter:card'),
    twitterTitle: metaTag(body, 'name', 'twitter:title'),
    twitterImage: metaTag(body, 'name', 'twitter:image'),
    canonical: body.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)?.[0]?.match(/href=["']([^"']*)["']/i)?.[1] ?? null,
    albums: [...body.matchAll(/open\.spotify\.com\/album\/([A-Za-z0-9]+)/g)].map((m) => m[1]),
    // Only artwork inside <img> tags — i.e. what the page actually renders. Counting
    // every i.scdn.co occurrence also picks up the JSON the page embeds for Alpine,
    // where the Worker carries full artist DTOs (with their images) and the Go service
    // carried narrow structs. That is a payload-size difference, not a visible one.
    artwork: [...body.matchAll(/<img[^>]*>/g)]
      .flatMap((tag) => [...tag[0].matchAll(/i\.scdn\.co\/image\/([A-Za-z0-9]+)/g)].map((m) => m[1])),
  };
}

function compare(c, prod, worker) {
  const diffs = [];
  if (prod.status !== worker.status) {
    diffs.push({ path: '(status)', kind: 'STATUS', prod: prod.status, worker: worker.status });
    return diffs; // body comparison is meaningless once statuses diverge
  }
  if (c.kind === 'json') {
    let a, b;
    try {
      a = JSON.parse(prod.body);
      b = JSON.parse(worker.body);
    } catch {
      diffs.push({ path: '(body)', kind: 'PARSE', prod: prod.body.slice(0, 120), worker: worker.body.slice(0, 120) });
      return diffs;
    }
    return diffJson(a, b);
  }
  const a = htmlSignature(prod.body);
  const b = htmlSignature(worker.body);
  return diffJson(a, b);
}

// ---------- run ----------

const { crates, users } = samples();
const cases = buildCases({ crates, users });
console.log(
  `${cases.length} cases over ${crates.length} crates / ${users.length} users` +
    (INCLUDE_VIEW_RECORDING ? '  (INCLUDING view-recording endpoints)' : '  (skipping view-recording endpoints)'),
);

const report = [];
let clean = 0;
for (const c of cases) {
  let prod, worker;
  try {
    [prod, worker] = await Promise.all([get(c.prod), get(c.worker)]);
  } catch (e) {
    report.push({ name: c.name, error: String(e.message ?? e) });
    console.log(`ERROR  ${c.name}: ${e.message ?? e}`);
    continue;
  }
  const all = compare(c, prod, worker);
  const accepted = [];
  const diffs = [];
  for (const d of all) {
    const why = acceptedReason(d, c);
    if (why) accepted.push({ ...d, why });
    else diffs.push(d);
  }
  if (diffs.length === 0) {
    clean++;
    console.log(`ok     ${c.name}${accepted.length ? `  (${accepted.length} accepted)` : ''}`);
  } else {
    console.log(
      `DIFF   ${c.name}  [${diffs.length} unexpected, ${accepted.length} accepted]` +
        (c.recordsView ? '  (recorded a prod view)' : ''),
    );
    for (const d of diffs.slice(0, 6)) {
      console.log(`         ${d.kind} ${d.path}  prod=${JSON.stringify(d.prod)?.slice(0, 70)}  worker=${JSON.stringify(d.worker)?.slice(0, 70)}`);
    }
    if (diffs.length > 6) console.log(`         ... ${diffs.length - 6} more`);
  }
  report.push({ name: c.name, prodUrl: c.prod, status: prod.status, diffs, accepted });
}

const failing = report.filter((r) => r.diffs?.length).length;
const acceptedTotal = report.reduce((n, r) => n + (r.accepted?.length ?? 0), 0);
console.log(
  `\n${clean}/${cases.length} clean | ${failing} with unexpected diffs | ` +
    `${acceptedTotal} accepted deviations | ${report.filter((r) => r.error).length} errored`,
);
if (OUT) {
  writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(`full report: ${OUT}`);
}
