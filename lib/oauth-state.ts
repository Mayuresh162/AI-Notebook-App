import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

function getStateSecret() {
  return (
    process.env.OAUTH_STATE_SECRET ||
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY
  );
}

function signState(nonce: string) {
  const secret = getStateSecret();

  if (!secret) {
    throw new Error("OAuth state secret is required");
  }

  return createHmac("sha256", secret).update(nonce).digest("base64url");
}

export function createOAuthState() {
  const nonce = randomBytes(24).toString("base64url");

  return `${nonce}.${signState(nonce)}`;
}

export function verifyOAuthState(state: string, expectedState?: string) {
  if (!state || !expectedState || state !== expectedState) return false;

  const [nonce, signature] = state.split(".");

  if (!nonce || !signature) return false;

  const expectedSignature = signState(nonce);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
