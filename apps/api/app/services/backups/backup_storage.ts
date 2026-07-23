import env from '#start/env'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { createReadStream, createWriteStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import type { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

export type BackupObject = {
  key: string
  lastModified: Date
}

export class R2BackupStorage {
  readonly prefix: string
  private readonly bucket: string
  private readonly client: S3Client

  constructor() {
    const accountId = env.get('BACKUP_R2_ACCOUNT_ID')
    const bucket = env.get('BACKUP_R2_BUCKET')
    const accessKeyId = env.get('BACKUP_R2_ACCESS_KEY_ID')
    const secretAccessKey = env.get('BACKUP_R2_SECRET_ACCESS_KEY')
    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error('backup_r2_configuration_missing')
    }

    this.bucket = bucket
    this.prefix = (env.get('BACKUP_R2_PREFIX') ?? `${env.get('NODE_ENV')}/database`).replace(
      /^\/+|\/+$/g,
      ''
    )
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  }

  async upload(filePath: string, key: string, checksum: string) {
    const file = await stat(filePath)
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: createReadStream(filePath),
        ContentLength: file.size,
        ContentType: 'application/octet-stream',
        Metadata: { sha256: checksum, format: 'wepost-aes-256-gcm-v1' },
      })
    )
  }

  async verify(key: string, checksum: string, sizeBytes: number) {
    const object = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
    return object.ContentLength === sizeBytes && object.Metadata?.sha256 === checksum
  }

  async download(key: string, destination: string) {
    const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    if (!object.Body) throw new Error('backup_object_empty')
    await pipeline(object.Body as Readable, createWriteStream(destination, { mode: 0o600 }))
  }

  async list() {
    const objects: BackupObject[] = []
    let continuationToken: string | undefined
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: `${this.prefix}/`,
          ContinuationToken: continuationToken,
        })
      )
      for (const object of page.Contents ?? []) {
        if (object.Key && object.LastModified) {
          objects.push({ key: object.Key, lastModified: object.LastModified })
        }
      }
      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
    } while (continuationToken)
    return objects
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }
}
