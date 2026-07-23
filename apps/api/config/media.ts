import env from '#start/env'

const defaultMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']

const mediaConfig = {
  driver: env.get('MEDIA_STORAGE_DRIVER') ?? 'local',
  maxBytes: env.get('MEDIA_MAX_BYTES') ?? 20 * 1024 * 1024,
  signedUrlTtlSeconds: env.get('MEDIA_SIGNED_URL_TTL_SECONDS') ?? 300,
  abandonedUploadMinutes: env.get('MEDIA_ABANDONED_UPLOAD_MINUTES') ?? 60,
  agencyQuotaBytes: env.get('MEDIA_AGENCY_QUOTA_BYTES') ?? 10 * 1024 * 1024 * 1024,
  allowedMimeTypes: (env.get('MEDIA_ALLOWED_MIME_TYPES') ?? defaultMimeTypes.join(','))
    .split(',')
    .map((mime) => mime.trim())
    .filter(Boolean),
  r2: {
    accountId: env.get('R2_ACCOUNT_ID'),
    bucket: env.get('R2_BUCKET'),
    accessKeyId: env.get('R2_ACCESS_KEY_ID'),
    secretAccessKey: env.get('R2_SECRET_ACCESS_KEY'),
    environmentPrefix: env.get('R2_ENVIRONMENT_PREFIX') ?? env.get('NODE_ENV'),
  },
}

export default mediaConfig
