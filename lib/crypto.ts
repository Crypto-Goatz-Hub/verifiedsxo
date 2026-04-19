import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALG = "aes-256-gcm"

function getKey(): Buffer {
  const keyB64 = process.env.DATA_ENCRYPTION_KEY
  if (!keyB64) throw new Error("DATA_ENCRYPTION_KEY not set")
  const buf = Buffer.from(keyB64, "base64")
  if (buf.length !== 32) throw new Error("DATA_ENCRYPTION_KEY must decode to 32 bytes")
  return buf
}

/** Encrypts a string → base64url payload containing iv + authTag + ciphertext */
export function encrypt(plain: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALG, key, iv)
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ct]).toString("base64url")
}

/** Decrypts a payload produced by `encrypt`. Throws if tampered. */
export function decrypt(payload: string): string {
  const key = getKey()
  const buf = Buffer.from(payload, "base64url")
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const ct = buf.subarray(28)
  const decipher = createDecipheriv(ALG, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8")
}
