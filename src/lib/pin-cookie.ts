export const PARENT_UNLOCK_COOKIE = "mf_parent_unlock";

export type UnlockPayload = {
  sub: string;
  fam: string;
  exp: number;
};

function bytesToB64url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function b64urlToBytes(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function sign(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bytesToB64url(new Uint8Array(signature));
}

export async function signUnlock(sub: string, fam: string, secret: string, nowSeconds = Date.now() / 1000, lifetimeSeconds = 60 * 60 * 12) {
  const payload: UnlockPayload = {
    sub,
    fam,
    exp: Math.floor(nowSeconds) + lifetimeSeconds,
  };
  const body = bytesToB64url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await sign(secret, body)}`;
}

export async function readUnlock(token: string | undefined, secret: string, nowSeconds = Date.now() / 1000) {
  if (!token || !secret) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = await sign(secret, body);
  if (expected.length !== signature.length) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  if (mismatch !== 0) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as UnlockPayload;
    if (!payload.sub || !payload.fam || payload.exp <= nowSeconds) return null;
    return payload;
  } catch {
    return null;
  }
}
