function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d’environnement manquante : ${name}`);
  return value;
}

function number(name: string) {
  const value = Number(required(name));
  if (!Number.isFinite(value))
    throw new Error(`Variable numérique invalide : ${name}`);
  return value;
}

export function loadConfig() {
  const facebookDriver = required("FACEBOOK_API_DRIVER");
  const instagramDriver = required("INSTAGRAM_API_DRIVER");
  const linkedinDriver = required("LINKEDIN_API_DRIVER");
  const pinterestDriver = required("PINTEREST_API_DRIVER");
  const tiktokDriver = required("TIKTOK_API_DRIVER");
  const queueName = required("EMAIL_QUEUE_NAME");
  const queuePrefix = `${required("REDIS_KEY_PREFIX")}:queue`;
  return {
    queueName,
    queuePrefix,
    redis: {
      host: required("REDIS_HOST"),
      port: number("REDIS_PORT"),
      password: process.env.REDIS_PASSWORD || undefined,
      db: number("REDIS_QUEUE_DB"),
      maxRetriesPerRequest: null,
    },
    database: {
      host: required("DB_HOST"),
      port: number("DB_PORT"),
      user: required("DB_USER"),
      password: required("DB_PASSWORD"),
      database: required("DB_DATABASE"),
    },
    resendApiKey: required("RESEND_API_KEY"),
    emailFrom: required("EMAIL_FROM"),
    webAppUrl: required("WEB_APP_URL"),
    concurrency: process.env.WORKER_CONCURRENCY
      ? number("WORKER_CONCURRENCY")
      : 5,
    heartbeat: {
      key: `${queuePrefix}:${queueName}:worker-heartbeat`,
      intervalSeconds: process.env.WORKER_HEARTBEAT_INTERVAL_SECONDS
        ? number("WORKER_HEARTBEAT_INTERVAL_SECONDS")
        : 60,
      ttlSeconds: process.env.WORKER_HEARTBEAT_TTL_SECONDS
        ? number("WORKER_HEARTBEAT_TTL_SECONDS")
        : 300,
      uptimeKumaPushUrl: process.env.UPTIME_KUMA_WORKER_PUSH_URL || undefined,
    },
    ai: {
      driver: process.env.AI_PROVIDER_DRIVER || "disabled",
    },
    socialTokenEncryptionKey: required("SOCIAL_TOKEN_ENCRYPTION_KEY"),
    facebook: {
      driver: facebookDriver,
      graphApiVersion: required("FACEBOOK_GRAPH_API_VERSION"),
      appSecret: required("FACEBOOK_APP_SECRET"),
    },
    instagram: {
      driver: instagramDriver,
      graphApiVersion: required("INSTAGRAM_GRAPH_API_VERSION"),
      appSecret: required("INSTAGRAM_APP_SECRET"),
    },
    linkedin: {
      driver: linkedinDriver,
      apiVersion: required("LINKEDIN_API_VERSION"),
    },
    pinterest: {
      driver: pinterestDriver,
      apiBaseUrl: required("PINTEREST_API_BASE_URL"),
    },
    tiktok: {
      driver: tiktokDriver,
      apiBaseUrl: required("TIKTOK_API_BASE_URL"),
    },
    r2: {
      accountId: process.env.R2_ACCOUNT_ID || "",
      bucket: process.env.R2_BUCKET || "",
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  };
}
