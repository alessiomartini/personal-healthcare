// Uses the Web Crypto API (globalThis.crypto) instead of Node's `crypto` module
// so this file works in both the Edge middleware runtime and the Node runtime.

export const SESSION_COOKIE = "health_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  const len = Math.max(bufA.length, bufB.length, 1);
  let diff = bufA.length === bufB.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    const byteA = bufA[i] ?? 0;
    const byteB = bufB[i] ?? 0;
    diff |= byteA ^ byteB;
  }
  return diff === 0;
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Define it in your .env file (see .env.example)."
    );
  }
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(signature);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    throw new Error(
      "APP_PASSWORD is not set. Define it in your .env file (see .env.example)."
    );
  }
  return constantTimeEqual(candidate, expected);
}

export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${expiresAt}`;
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = await sign(payload);
  if (!constantTimeEqual(signature, expected)) return false;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  return true;
}
