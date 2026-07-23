import mediaConfig from '#config/media'
import env from '#start/env'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import encryption from '@adonisjs/core/services/encryption'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export type SignedRequest = {
  url: string
  method: 'GET' | 'PUT'
  headers: Record<string, string>
  expiresAt: string
}

export interface MediaStorage {
  signUpload(key: string, mimeType: string): Promise<SignedRequest>
  signRead(key: string): Promise<SignedRequest>
  read(key: string): Promise<{ bytes: Buffer; contentType: string } | null>
  delete(key: string): Promise<void>
}

type LocalObject = { bytes: Buffer; contentType: string }
const localObjects = new Map<string, LocalObject>()

function localToken(key: string, purpose: 'upload' | 'read') {
  return encryption.encrypt(
    JSON.stringify({ key, purpose }),
    mediaConfig.signedUrlTtlSeconds,
    `media:${purpose}`
  )
}

export function verifyLocalToken(token: string, purpose: 'upload' | 'read') {
  const value = encryption.decrypt(token, `media:${purpose}`)
  if (typeof value !== 'string') return null
  try {
    const payload = JSON.parse(value) as { key: string; purpose: string }
    return payload.purpose === purpose && payload.key && !payload.key.includes('..')
      ? payload.key
      : null
  } catch {
    return null
  }
}

class LocalMediaStorage implements MediaStorage {
  async signUpload(key: string, mimeType: string) {
    const expiresAt = new Date(Date.now() + mediaConfig.signedUrlTtlSeconds * 1000).toISOString()
    const token = encodeURIComponent(localToken(key, 'upload'))
    return {
      url: `${env.get('APP_URL')}/api/v1/media/local-upload?token=${token}`,
      method: 'PUT' as const,
      headers: { 'Content-Type': mimeType },
      expiresAt,
    }
  }

  async signRead(key: string) {
    const expiresAt = new Date(Date.now() + mediaConfig.signedUrlTtlSeconds * 1000).toISOString()
    const token = encodeURIComponent(localToken(key, 'read'))
    return {
      url: `${env.get('APP_URL')}/api/v1/media/local-read?token=${token}`,
      method: 'GET' as const,
      headers: {},
      expiresAt,
    }
  }

  async read(key: string) {
    return localObjects.get(key) ?? null
  }

  async delete(key: string) {
    localObjects.delete(key)
  }
}

class R2MediaStorage implements MediaStorage {
  private client: S3Client
  private bucket: string

  constructor() {
    const { accountId, bucket, accessKeyId, secretAccessKey } = mediaConfig.r2
    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error('Configuration Cloudflare R2 incomplète.')
    }
    this.bucket = bucket
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  }

  private expiry() {
    return new Date(Date.now() + mediaConfig.signedUrlTtlSeconds * 1000).toISOString()
  }

  async signUpload(key: string, mimeType: string) {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: mimeType })
    return {
      url: await getSignedUrl(this.client, command, { expiresIn: mediaConfig.signedUrlTtlSeconds }),
      method: 'PUT' as const,
      headers: { 'Content-Type': mimeType },
      expiresAt: this.expiry(),
    }
  }

  async signRead(key: string) {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key })
    return {
      url: await getSignedUrl(this.client, command, { expiresIn: mediaConfig.signedUrlTtlSeconds }),
      method: 'GET' as const,
      headers: {},
      expiresAt: this.expiry(),
    }
  }

  async read(key: string) {
    const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    if (!object.Body) return null
    return {
      bytes: Buffer.from(await object.Body.transformToByteArray()),
      contentType: object.ContentType ?? 'application/octet-stream',
    }
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }
}

let storage: MediaStorage | undefined

export function getMediaStorage() {
  storage ??= mediaConfig.driver === 'r2' ? new R2MediaStorage() : new LocalMediaStorage()
  return storage
}

export function putLocalObject(key: string, object: LocalObject) {
  localObjects.set(key, object)
}

export function getLocalObject(key: string) {
  return localObjects.get(key)
}

export function resetLocalMediaStorage() {
  localObjects.clear()
  storage = undefined
}
