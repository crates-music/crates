#!/usr/bin/env node
// Usage report from the tracking tables (migrations/0002_usage_tracking.sql).
//   npm run usage            -> production D1
//   npm run usage -- --local -> local D1
//
// "Active" = made any authenticated app or MCP request that UTC day.
// "Returning" = active, and signed up more than 7 days before that day.

import { execFileSync } from 'node:child_process';

const target = process.argv.includes('--local') ? '--local' : '--remote';

function query(sql) {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'crates', target, ...(process.env.D1_PERSIST ? ['--persist-to', process.env.D1_PERSIST] : []), '--json', '--command', sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out.slice(out.indexOf('[')))[0].results;
}

function table(title, rows) {
  console.log(`\n${title}`);
  if (rows.length === 0) return console.log('  (no data yet)');
  const cols = Object.keys(rows[0]);
  const width = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c] ?? '').length)));
  const line = (vals) => '  ' + vals.map((v, i) => String(v ?? '').padStart(width[i])).join('  ');
  console.log(line(cols));
  rows.forEach((r) => console.log(line(cols.map((c) => r[c]))));
}

const ACTIVE = `SELECT DISTINCT a.user_id, a.day, u.created_at FROM user_activity a JOIN spotify_user u ON u.id = a.user_id`;
const returning = (t = '') => `${t}created_at < (unixepoch(${t}day) - 7 * 86400) * 1000`;

const [since] = query('SELECT min(day) AS since FROM user_activity');
console.log(`Crates usage (${target.slice(2)}), tracking since ${since?.since ?? 'n/a'}`);

const [headline] = query(`
  WITH a AS (${ACTIVE})
  SELECT
    (SELECT count(DISTINCT user_id) FROM a WHERE day = date('now', '-1 day')) AS dau_yesterday,
    (SELECT count(DISTINCT user_id) FROM a WHERE day > date('now', '-7 days')) AS wau_7d,
    (SELECT count(DISTINCT user_id) FROM a WHERE day > date('now', '-30 days')) AS mau_30d,
    (SELECT count(DISTINCT user_id) FROM a WHERE day > date('now', '-30 days') AND ${returning()}) AS returning_mau_30d,
    (SELECT count(*) FROM event WHERE type = 'album_play' AND at > (unixepoch('now') - 30 * 86400) * 1000) AS plays_30d,
    (SELECT count(DISTINCT user_id) FROM event WHERE type = 'album_play' AND at > (unixepoch('now') - 30 * 86400) * 1000) AS players_30d`);
table('Headline (rolling windows)', [headline]);

table(
  'Daily (last 14 days)',
  query(`
    WITH a AS (${ACTIVE}),
    p AS (SELECT date(at / 1000, 'unixepoch') AS day, count(*) AS plays, count(DISTINCT user_id) AS players
            FROM event WHERE type = 'album_play' GROUP BY day)
    SELECT a.day, count(DISTINCT a.user_id) AS active, sum(${returning('a.')}) AS returning_users,
           coalesce(p.plays, 0) AS plays, coalesce(p.players, 0) AS players
      FROM a LEFT JOIN p ON p.day = a.day
     WHERE a.day > date('now', '-14 days')
     GROUP BY a.day ORDER BY a.day`),
);

table(
  'Weekly (weeks starting Monday, last 8)',
  query(`
    WITH a AS (${ACTIVE}),
    w AS (SELECT user_id, date(day, '-6 days', 'weekday 1') AS week, min(created_at) AS created_at FROM a GROUP BY user_id, week),
    p AS (SELECT date(at / 1000, 'unixepoch', '-6 days', 'weekday 1') AS week, count(*) AS plays, count(DISTINCT user_id) AS players
            FROM event WHERE type = 'album_play' GROUP BY week)
    SELECT w.week, count(*) AS active,
           sum(w.created_at < (unixepoch(w.week) - 7 * 86400) * 1000) AS returning_users,
           coalesce(p.plays, 0) AS plays, coalesce(p.players, 0) AS players
      FROM w LEFT JOIN p ON p.week = w.week
     WHERE w.week > date('now', '-63 days')
     GROUP BY w.week ORDER BY w.week`),
);

table(
  'Events (last 30 days)',
  query(`
    SELECT type, count(*) AS events, count(DISTINCT user_id) AS users
      FROM event WHERE at > (unixepoch('now') - 30 * 86400) * 1000
     GROUP BY type ORDER BY events DESC`),
);

table(
  'Activity by surface (last 30 days)',
  query(`
    SELECT source, count(DISTINCT user_id) AS users, count(*) AS user_days
      FROM user_activity WHERE day > date('now', '-30 days')
     GROUP BY source`),
);
