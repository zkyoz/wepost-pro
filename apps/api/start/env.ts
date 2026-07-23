/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Session
  SESSION_DRIVER: Env.schema.enum(['redis', 'memory'] as const),
  SESSION_COOKIE_NAME: Env.schema.string(),
  SESSION_COOKIE_DOMAIN: Env.schema.string.optional(),
  SESSION_AGE: Env.schema.string(),

  // PostgreSQL
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string(),
  DB_DATABASE: Env.schema.string(),

  // Redis
  REDIS_HOST: Env.schema.string({ format: 'host' }),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),
  REDIS_SESSION_DB: Env.schema.number(),
  REDIS_LIMITER_DB: Env.schema.number(),
  REDIS_QUEUE_DB: Env.schema.number(),
  REDIS_KEY_PREFIX: Env.schema.string(),

  // Asynchronous notification e-mails
  EMAIL_QUEUE_DRIVER: Env.schema.enum(['redis', 'memory'] as const),
  EMAIL_QUEUE_NAME: Env.schema.string(),
  COMMENT_EDIT_WINDOW_MINUTES: Env.schema.number(),

  // Social publishing
  SOCIAL_TOKEN_ENCRYPTION_KEY: Env.schema.string.optional(),
  FACEBOOK_API_DRIVER: Env.schema.enum.optional(['mock', 'facebook'] as const),
  FACEBOOK_APP_ID: Env.schema.string.optional(),
  FACEBOOK_APP_SECRET: Env.schema.string.optional(),
  FACEBOOK_GRAPH_API_VERSION: Env.schema.string.optional(),
  FACEBOOK_OAUTH_REDIRECT_URI: Env.schema.string.optional(),
  FACEBOOK_OAUTH_SUCCESS_URL: Env.schema.string.optional(),
  INSTAGRAM_API_DRIVER: Env.schema.enum.optional(['mock', 'instagram'] as const),
  INSTAGRAM_APP_ID: Env.schema.string.optional(),
  INSTAGRAM_APP_SECRET: Env.schema.string.optional(),
  INSTAGRAM_GRAPH_API_VERSION: Env.schema.string.optional(),
  INSTAGRAM_OAUTH_REDIRECT_URI: Env.schema.string.optional(),
  INSTAGRAM_OAUTH_SUCCESS_URL: Env.schema.string.optional(),
  LINKEDIN_API_DRIVER: Env.schema.enum.optional(['mock', 'linkedin'] as const),
  LINKEDIN_APP_ID: Env.schema.string.optional(),
  LINKEDIN_APP_SECRET: Env.schema.string.optional(),
  LINKEDIN_API_VERSION: Env.schema.string.optional(),
  LINKEDIN_OAUTH_REDIRECT_URI: Env.schema.string.optional(),
  LINKEDIN_OAUTH_SUCCESS_URL: Env.schema.string.optional(),
  PINTEREST_API_DRIVER: Env.schema.enum.optional(['mock', 'pinterest'] as const),
  PINTEREST_APP_ID: Env.schema.string.optional(),
  PINTEREST_APP_SECRET: Env.schema.string.optional(),
  PINTEREST_API_BASE_URL: Env.schema.string.optional(),
  PINTEREST_OAUTH_REDIRECT_URI: Env.schema.string.optional(),
  PINTEREST_OAUTH_SUCCESS_URL: Env.schema.string.optional(),
  TIKTOK_API_DRIVER: Env.schema.enum.optional(['mock', 'tiktok'] as const),
  TIKTOK_CLIENT_KEY: Env.schema.string.optional(),
  TIKTOK_CLIENT_SECRET: Env.schema.string.optional(),
  TIKTOK_API_BASE_URL: Env.schema.string.optional(),
  TIKTOK_OAUTH_REDIRECT_URI: Env.schema.string.optional(),
  TIKTOK_OAUTH_SUCCESS_URL: Env.schema.string.optional(),

  // AI-assisted text generation. A real provider remains TODO until selected.
  AI_PROVIDER_DRIVER: Env.schema.enum.optional(['mock', 'disabled'] as const),
  AI_DAILY_QUOTA: Env.schema.number.optional(),
  NETWORK_TEXT_LIMIT_FACEBOOK: Env.schema.number.optional(),
  NETWORK_TEXT_LIMIT_INSTAGRAM: Env.schema.number.optional(),
  NETWORK_TEXT_LIMIT_LINKEDIN: Env.schema.number.optional(),
  NETWORK_TEXT_LIMIT_PINTEREST: Env.schema.number.optional(),
  NETWORK_TEXT_LIMIT_TIKTOK: Env.schema.number.optional(),

  // Security
  LIMITER_STORE: Env.schema.enum(['redis', 'memory'] as const),
  AUTH_LOGIN_RATE_LIMIT: Env.schema.number.optional(),
  CORS_ORIGINS: Env.schema.string(),

  // Private media storage
  MEDIA_STORAGE_DRIVER: Env.schema.enum.optional(['local', 'r2'] as const),
  MEDIA_MAX_BYTES: Env.schema.number.optional(),
  MEDIA_SIGNED_URL_TTL_SECONDS: Env.schema.number.optional(),
  MEDIA_ABANDONED_UPLOAD_MINUTES: Env.schema.number.optional(),
  MEDIA_AGENCY_QUOTA_BYTES: Env.schema.number.optional(),
  MEDIA_ALLOWED_MIME_TYPES: Env.schema.string.optional(),
  R2_ACCOUNT_ID: Env.schema.string.optional(),
  R2_BUCKET: Env.schema.string.optional(),
  R2_ACCESS_KEY_ID: Env.schema.string.optional(),
  R2_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  R2_ENVIRONMENT_PREFIX: Env.schema.string.optional(),

  // Encrypted PostgreSQL backups. Credentials must be dedicated to the backup bucket.
  BACKUP_ENCRYPTION_KEY: Env.schema.string.optional(),
  BACKUP_R2_ACCOUNT_ID: Env.schema.string.optional(),
  BACKUP_R2_BUCKET: Env.schema.string.optional(),
  BACKUP_R2_ACCESS_KEY_ID: Env.schema.string.optional(),
  BACKUP_R2_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  BACKUP_R2_PREFIX: Env.schema.string.optional(),
  UPTIME_KUMA_BACKUP_PUSH_URL: Env.schema.string.optional(),
  RESTORE_DB_HOST: Env.schema.string.optional({ format: 'host' }),
  RESTORE_DB_PORT: Env.schema.number.optional(),
  RESTORE_DB_USER: Env.schema.string.optional(),
  RESTORE_DB_PASSWORD: Env.schema.string.optional(),
  RESTORE_DB_DATABASE: Env.schema.string.optional(),
})
