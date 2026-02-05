import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function toB64Url(value: Buffer) {
  return value.toString("base64url");
}

function fromB64Url(value: string) {
  return Buffer.from(value, "base64url");
}

function getMasterKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }

  return key;
}

function encryptWithKey(key: Buffer, plaintext: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const data = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, tag, data };
}

function decryptWithKey(key: Buffer, iv: Buffer, tag: Buffer, data: Buffer) {
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

export function encryptSecret(plaintext: string) {
  const masterKey = getMasterKey();
  const dataKey = randomBytes(32);

  const wrapped = encryptWithKey(masterKey, dataKey);
  const payload = encryptWithKey(dataKey, Buffer.from(plaintext, "utf8"));

  return [
    VERSION,
    toB64Url(wrapped.iv),
    toB64Url(wrapped.tag),
    toB64Url(wrapped.data),
    toB64Url(payload.iv),
    toB64Url(payload.tag),
    toB64Url(payload.data)
  ].join(".");
}

export function decryptSecret(ciphertext: string) {
  const [
    version,
    wrappedIvB64,
    wrappedTagB64,
    wrappedDataB64,
    payloadIvB64,
    payloadTagB64,
    payloadDataB64
  ] = ciphertext.split(".");

  if (
    version !== VERSION ||
    !wrappedIvB64 ||
    !wrappedTagB64 ||
    !wrappedDataB64 ||
    !payloadIvB64 ||
    !payloadTagB64 ||
    !payloadDataB64
  ) {
    throw new Error("Invalid encrypted payload format");
  }

  const masterKey = getMasterKey();
  const dataKey = decryptWithKey(
    masterKey,
    fromB64Url(wrappedIvB64),
    fromB64Url(wrappedTagB64),
    fromB64Url(wrappedDataB64)
  );

  const plaintext = decryptWithKey(
    dataKey,
    fromB64Url(payloadIvB64),
    fromB64Url(payloadTagB64),
    fromB64Url(payloadDataB64)
  );

  return plaintext.toString("utf8");
}
