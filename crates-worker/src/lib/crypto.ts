// Token crypto — replaces util/EncryptionConverter.java (AES-ECB) with
// AES-GCM: base64(iv[12] || ciphertext || tag[16]), key = UTF-8 bytes of
// CRATES_ENCRYPTION_KEY. The Postgres->D1 export re-encrypts legacy values
// into this format.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const keyCache = new Map<string, Promise<CryptoKey>>();

function gcmKey(secret: string, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  const cacheKey = `${usage}:${secret}`;
  let key = keyCache.get(cacheKey);
  if (!key) {
    key = crypto.subtle.importKey('raw', encoder.encode(secret), 'AES-GCM', false, [usage]);
    keyCache.set(cacheKey, key);
  }
  return key;
}

export async function encryptGcm(secret: string, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await gcmKey(secret, 'encrypt');
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext)));
  const packed = new Uint8Array(iv.length + ct.length);
  packed.set(iv);
  packed.set(ct, iv.length);
  return btoa(String.fromCharCode(...packed));
}

export async function decryptGcm(secret: string, packedB64: string): Promise<string> {
  const packed = Uint8Array.from(atob(packedB64), (ch) => ch.charCodeAt(0));
  const key = await gcmKey(secret, 'decrypt');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: packed.slice(0, 12) }, key, packed.slice(12));
  return decoder.decode(plain);
}

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** RandomStringUtils.randomAlphanumeric equivalent — used for auth tokens. */
export function randomAlphanumeric(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (const b of bytes) out += ALPHANUMERIC[b % ALPHANUMERIC.length];
  return out;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
