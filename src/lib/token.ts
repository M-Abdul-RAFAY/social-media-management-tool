import crypto from "crypto";
import { refreshLongLivedToken } from "./metaApi";

const CRYPTO_SECRET = process.env.CRYPTO_SECRET!;

if (!CRYPTO_SECRET) {
  throw new Error("CRYPTO_SECRET environment variable is required");
}

// Encrypt access token for storage
export function encryptToken(token: string): string {
  const cipher = crypto.createCipher("aes-256-cbc", CRYPTO_SECRET);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// Decrypt access token from storage
export function decryptToken(encryptedToken: string): string {
  const decipher = crypto.createDecipher("aes-256-cbc", CRYPTO_SECRET);
  let decrypted = decipher.update(encryptedToken, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Check if token is expired or will expire soon (within 1 hour)
export function isTokenExpired(expiresAt: Date): boolean {
  const now = new Date();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  return expiresAt.getTime() - now.getTime() < oneHour;
}

// Refresh token if needed
export async function refreshTokenIfNeeded(
  currentToken: string,
  expiresAt: Date,
  appId: string,
  appSecret: string
): Promise<{ token: string; expiresAt: Date } | null> {
  if (!isTokenExpired(expiresAt)) {
    return null; // Token is still valid
  }

  try {
    const refreshResult = await refreshLongLivedToken(
      currentToken,
      appId,
      appSecret
    );
    const newExpiresAt = new Date();
    newExpiresAt.setSeconds(
      newExpiresAt.getSeconds() + refreshResult.expires_in
    );

    return {
      token: refreshResult.access_token,
      expiresAt: newExpiresAt,
    };
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
}

// Generate a secure random string for webhook verification
export function generateWebhookToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return signature === `sha256=${expectedSignature}`;
}
