import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";
import { readR2Environment } from "./demo-r2-env.mjs";
import { copyVerifiedMedia } from "./demo-r2-copy.mjs";
import { LocalMediaLoader } from "../../apps/worker/dist/social/media_loader.js";

const directory = new URL("../../.demo/", import.meta.url);
const require = createRequire(
  new URL("../../apps/worker/package.json", import.meta.url),
);
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { Pool } = require("pg");
const command = process.argv[2] ?? "check";
let stage = "configuration";
if (!["check", "plan", "copy"].includes(command))
  throw new Error("UseCheckPlanOrCopy");

async function main() {
  const base = parseEnv(
    await readFile(new URL("runtime.env", directory), "utf8"),
  );
  const env = await readR2Environment(base, new URL("r2.env", directory));
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    maxAttempts: 2,
  });
  const pool = new Pool({
    host: base.DB_HOST,
    port: Number(base.DB_PORT),
    user: base.DB_USER,
    password: base.DB_PASSWORD,
    database: base.DB_DATABASE,
    connectionTimeoutMillis: 5000,
  });
  const bucket = env.R2_BUCKET;
  const send = (operation) =>
    s3.send(operation, { abortSignal: AbortSignal.timeout(15000) });
  try {
    stage = "bucket-access";
    await send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
    if (command === "check") {
      console.log(
        JSON.stringify({
          bucket,
          authenticatedAccess: true,
          publicAccessRequired: false,
        }),
      );
      return;
    }
    stage = "database-inventory";
    const { rows } = await pool.query(
      "SELECT id, storage_key, size_bytes, checksum, mime_type FROM media_assets WHERE scan_status = 'clean' ORDER BY id",
    );
    if (
      rows.length > 100 ||
      rows.reduce((n, r) => n + Number(r.size_bytes), 0) > 100 * 1024 * 1024
    )
      throw new Error("DemoMigrationScopeTooLarge");
    const loader = new LocalMediaLoader(
      fileURLToPath(new URL("media/", directory)),
    );
    stage = "media-integrity";
    const results = await copyVerifiedMedia(
      rows,
      {
        readLocal: (key) => loader.load(key),
        async readRemote(key) {
          try {
            const object = await send(
              new GetObjectCommand({ Bucket: bucket, Key: key }),
            );
            return object.Body
              ? Buffer.from(await object.Body.transformToByteArray())
              : null;
          } catch (error) {
            if (
              error.name === "NoSuchKey" ||
              error.$metadata?.httpStatusCode === 404
            )
              return null;
            throw error;
          }
        },
        writeRemote: (key, bytes, contentType) =>
          send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: bytes,
              ContentType: contentType,
              CacheControl: "private, no-store",
              IfNoneMatch: "*",
            }),
          ),
      },
      command === "copy",
    );
    console.log(
      JSON.stringify({
        bucket,
        command,
        results,
        localFilesDeleted: 0,
        databaseRowsChanged: 0,
      }),
    );
  } finally {
    s3.destroy();
    await pool.end();
  }
}
main().catch((error) => {
  // No SDK error body, signed URL, environment or credentials in the output.
  console.error(
    JSON.stringify({
      event: "demo.r2.failed",
      stage,
      errorName: error.name,
      systemCode: /^[A-Z_0-9]+$/.test(error.code ?? "")
        ? error.code
        : undefined,
      httpStatus: error.$metadata?.httpStatusCode,
      reason: /^(R2|Demo|LocalMedia|RemoteMedia)/.test(error.message)
        ? error.message
        : "CheckLocalConfigurationAndBucketPermissions",
    }),
  );
  process.exitCode = 1;
});
