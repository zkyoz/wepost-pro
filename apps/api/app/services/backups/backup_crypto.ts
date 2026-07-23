import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { appendFile, open, stat, writeFile } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'

const MAGIC = Buffer.from('WEPBK01')
const IV_BYTES = 12
const AUTH_TAG_BYTES = 16
const HEADER_BYTES = MAGIC.length + IV_BYTES

export function parseBackupEncryptionKey(value: string) {
  const key = Buffer.from(value, 'base64')
  if (key.length !== 32 || key.toString('base64') !== value) {
    throw new Error('backup_encryption_key_invalid')
  }
  return key
}

export async function encryptBackupFile(inputPath: string, outputPath: string, key: Buffer) {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  await writeFile(outputPath, Buffer.concat([MAGIC, iv]), { mode: 0o600 })
  await pipeline(createReadStream(inputPath), cipher, createWriteStream(outputPath, { flags: 'a' }))
  await appendFile(outputPath, cipher.getAuthTag())
}

export async function decryptBackupFile(inputPath: string, outputPath: string, key: Buffer) {
  const inputStat = await stat(inputPath)
  if (inputStat.size <= HEADER_BYTES + AUTH_TAG_BYTES) {
    throw new Error('backup_ciphertext_invalid')
  }

  const handle = await open(inputPath, 'r')
  const header = Buffer.alloc(HEADER_BYTES)
  const authTag = Buffer.alloc(AUTH_TAG_BYTES)
  try {
    await handle.read(header, 0, HEADER_BYTES, 0)
    await handle.read(authTag, 0, AUTH_TAG_BYTES, inputStat.size - AUTH_TAG_BYTES)
  } finally {
    await handle.close()
  }

  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('backup_ciphertext_invalid')
  }

  const decipher = createDecipheriv('aes-256-gcm', key, header.subarray(MAGIC.length))
  decipher.setAuthTag(authTag)
  await pipeline(
    createReadStream(inputPath, {
      start: HEADER_BYTES,
      end: inputStat.size - AUTH_TAG_BYTES - 1,
    }),
    decipher,
    createWriteStream(outputPath, { mode: 0o600 })
  )
}

export async function checksumFile(path: string) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer)
  return hash.digest('hex')
}
