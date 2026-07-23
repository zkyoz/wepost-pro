import { createDecipheriv } from "node:crypto";

function keyFrom(value: string) {
  const key = Buffer.from(value, "base64");
  if (key.length !== 32)
    throw new Error("SOCIAL_TOKEN_ENCRYPTION_KEY doit contenir 32 octets.");
  return key;
}

export function decryptSocialToken(payload: string, encodedKey: string) {
  const [version, iv, tag, encrypted] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !encrypted)
    throw new Error("EncryptedTokenInvalid");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    keyFrom(encodedKey),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
