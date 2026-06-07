import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENCRYPTION_PREFIX = "enc:v1:";

function getEncryptionKey() {
  const secret = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("INTEGRATION_TOKEN_ENCRYPTION_KEY is required");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptToken(token: string) {
  if (!token) return "";
  if (token.startsWith(ENCRYPTION_PREFIX)) return token;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${Buffer.concat([iv, authTag, encrypted]).toString("base64url")}`;
}

export function decryptToken(token: string) {
  if (!token || !token.startsWith(ENCRYPTION_PREFIX)) return token;

  const payload = Buffer.from(token.slice(ENCRYPTION_PREFIX.length), "base64url");
  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}
