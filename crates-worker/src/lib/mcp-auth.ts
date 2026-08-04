// MCP auth — port of PKCEServiceImpl and MCPAuthServiceImpl.
//
// Two things had to change shape for Workers:
//   - PKCE verifiers lived in a ConcurrentHashMap with a cleanup thread. An isolate
//     cannot hold that across requests, so they go in KV under a 10-minute TTL, which
//     also retires the cleanup scheduler.
//   - API keys were stored AES-ECB encrypted and looked up *by encrypted value*, which
//     only worked because ECB is deterministic. GCM is not, so the key is stored as a
//     SHA-256 hash and looked up by hash (migration plan, decision 7). The plaintext is
//     only ever seen at issuance.

import type { Env } from '../env';
import { sha256Hex } from './crypto';

const CODE_VERIFIER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
const CODE_VERIFIER_LENGTH = 128;
const VERIFIER_TTL_SECONDS = 10 * 60;
const API_KEY_BYTES = 32;
const API_KEY_TTL_SECONDS = 24 * 3600;

const base64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function generateCodeVerifier(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_VERIFIER_LENGTH));
  let out = '';
  for (const b of bytes) out += CODE_VERIFIER_CHARS[b % CODE_VERIFIER_CHARS.length];
  return out;
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

// The state carries the caller's redirect URI, so it can be long and contain anything.
// Hashing it keeps the KV key bounded and safe to use verbatim.
const verifierKey = async (state: string) => `pkce:${await sha256Hex(state)}`;

export async function storeCodeVerifier(env: Env, state: string, verifier: string): Promise<void> {
  await env.KV.put(await verifierKey(state), verifier, { expirationTtl: VERIFIER_TTL_SECONDS });
}

/** PKCEServiceImpl.retrieveAndRemoveCodeVerifier — single use. */
export async function retrieveAndRemoveCodeVerifier(env: Env, state: string): Promise<string | null> {
  const key = await verifierKey(state);
  const verifier = await env.KV.get(key);
  if (verifier) await env.KV.delete(key);
  return verifier;
}

export interface McpApiKeyRow {
  id: number;
  user_id: string;
  scope: string;
  created_at: number;
  expires_at: number;
}

/** Returns the plaintext key — the only time it exists. Only the hash is stored. */
export async function generateApiKey(env: Env, spotifyUserId: string, scope: string): Promise<string> {
  const apiKey = `crates_${base64Url(crypto.getRandomValues(new Uint8Array(API_KEY_BYTES)))}`;
  const now = Date.now();
  await env.DB.prepare(
    'INSERT INTO mcp_api_key (api_key_hash, user_id, scope, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(await sha256Hex(apiKey), spotifyUserId, scope, now, now + API_KEY_TTL_SECONDS * 1000)
    .run();
  return apiKey;
}

/** Null when unknown or expired; expired rows are deleted on sight, as the Java did. */
export async function validateApiKey(env: Env, apiKey: string): Promise<McpApiKeyRow | null> {
  const row = await env.DB.prepare(
    'SELECT id, user_id, scope, created_at, expires_at FROM mcp_api_key WHERE api_key_hash = ?',
  )
    .bind(await sha256Hex(apiKey))
    .first<McpApiKeyRow>();
  if (!row) return null;
  if (Date.now() > row.expires_at) {
    await env.DB.prepare('DELETE FROM mcp_api_key WHERE id = ?').bind(row.id).run();
    return null;
  }
  return row;
}
