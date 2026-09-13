import { readFile, stat } from "node:fs/promises";
import { parseEnv } from "node:util";

const keys = [
  "R2_ACCOUNT_ID",
  "R2_BUCKET",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_ENVIRONMENT_PREFIX",
];

export function r2LiveEnvironment(base, credentials) {
  if (
    base.NODE_ENV !== "development" ||
    base.DB_HOST !== "127.0.0.1" ||
    base.DB_DATABASE !== "wepost_demo" ||
    base.REDIS_HOST !== "127.0.0.1"
  )
    throw new Error("R2DemoLocalEnvironmentRequired");
  if (Object.keys(credentials).some((key) => !keys.includes(key)))
    throw new Error("R2CredentialsContainUnexpectedSettings");
  for (const key of keys) {
    if (
      !credentials[key] ||
      /\s/.test(credentials[key]) ||
      /^TODO/i.test(credentials[key])
    )
      throw new Error(`R2ConfigurationMissingOrInvalid:${key}`);
  }
  if (
    !/^[a-f0-9]{32}$/.test(credentials.R2_ACCOUNT_ID) ||
    credentials.R2_BUCKET !== "wepost-demo-media" ||
    credentials.R2_ENVIRONMENT_PREFIX !== "bc03-demo"
  )
    throw new Error("R2DemoBucketScopeRequired");
  return {
    ...base,
    ...credentials,
    MEDIA_STORAGE_DRIVER: "r2",
    MEDIA_LOCAL_DIRECTORY: "",
    MEDIA_SIGNED_URL_TTL_SECONDS: "300",
    NUXT_PUBLIC_MEDIA_ORIGIN: `https://${credentials.R2_BUCKET}.${credentials.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    INSTAGRAM_DEMO_IMAGE_URL: "",
    INSTAGRAM_DEMO_IMAGE_SHA256: "",
  };
}

export async function readR2Environment(base, path) {
  if ((await stat(path)).mode & 0o077)
    throw new Error("R2CredentialsFileMustBePrivate");
  return r2LiveEnvironment(base, parseEnv(await readFile(path, "utf8")));
}

// Nuxt needs public runtime settings, never the R2 credentials.
export function withoutR2Secrets(env) {
  return Object.fromEntries(
    Object.entries(env).filter(([key]) => !key.startsWith("R2_")),
  );
}
