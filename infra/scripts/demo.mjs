import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const root = fileURLToPath(new URL("../../", import.meta.url));
const demoDirectory = join(root, ".demo");
const environmentFile = join(demoDirectory, "runtime.env");
const composeFile = join(root, "infra/demo/compose.yaml");
const command = process.argv[2] || "check";

if (Number(process.versions.node.split(".")[0]) !== 24) {
  throw new Error(
    "La démonstration utilise Node.js 24. Exécuter nvm use avant de continuer.",
  );
}

function run(program, args, { cwd = root, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, { cwd, env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${program} a échoué (${code})`)),
    );
  });
}

async function configure() {
  await mkdir(demoDirectory, { recursive: true });
  try {
    await readFile(environmentFile);
    return;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const config = {
    NODE_ENV: "development",
    TZ: Intl.DateTimeFormat().resolvedOptions().timeZone,
    HOST: "127.0.0.1",
    PORT: "3333",
    APP_URL: "http://127.0.0.1:3333",
    LOG_LEVEL: "warn",
    APP_KEY: randomBytes(32).toString("hex"),
    SESSION_DRIVER: "redis",
    SESSION_COOKIE_NAME: "wepost_bc03_demo",
    SESSION_COOKIE_DOMAIN: "",
    SESSION_AGE: "8h",
    DB_HOST: "127.0.0.1",
    DB_PORT: "5543",
    DB_USER: "wepost",
    DB_PASSWORD: "wepost-demo-local",
    DB_DATABASE: "wepost_demo",
    REDIS_HOST: "127.0.0.1",
    REDIS_PORT: "6380",
    REDIS_PASSWORD: "",
    REDIS_SESSION_DB: "0",
    REDIS_LIMITER_DB: "1",
    REDIS_QUEUE_DB: "2",
    REDIS_KEY_PREFIX: "wepost:bc03-demo",
    EMAIL_QUEUE_DRIVER: "redis",
    EMAIL_QUEUE_NAME: "wepost-bc03-demo",
    COMMENT_EDIT_WINDOW_MINUTES: "15",
    LIMITER_STORE: "redis",
    AUTH_LOGIN_RATE_LIMIT: "100",
    CORS_ORIGINS: "http://127.0.0.1:3000",
    MEDIA_STORAGE_DRIVER: "local",
    MEDIA_LOCAL_DIRECTORY: join(demoDirectory, "media"),
    SOCIAL_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    AI_PROVIDER_DRIVER: "mock",
    AI_DAILY_QUOTA: "50",
    EMAIL_DELIVERY_DRIVER: "file",
    EMAIL_OUTBOX_DIRECTORY: join(demoDirectory, "outbox"),
    EMAIL_FROM: "WePost Démonstration <notifications@example.invalid>",
    WEB_APP_URL: "http://127.0.0.1:3000",
    WORKER_CONCURRENCY: "5",
    NUXT_PUBLIC_API_BASE: "http://127.0.0.1:3333/api/v1",
    NUXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
    NUXT_DEVTOOLS: "false",
    NUXT_PUBLIC_POSTHOG_KEY: "",
  };
  for (const network of [
    "FACEBOOK",
    "INSTAGRAM",
    "LINKEDIN",
    "PINTEREST",
    "TIKTOK",
  ]) {
    const lower = network.toLowerCase();
    config[`${network}_API_DRIVER`] = "mock";
    config[`${network}_APP_ID`] = `${lower}-demo`;
    config[`${network}_APP_SECRET`] = `${lower}-demo-not-a-real-secret`;
    config[`${network}_OAUTH_REDIRECT_URI`] =
      `http://127.0.0.1:3333/api/v1/social/${lower}/oauth/callback`;
    config[`${network}_OAUTH_SUCCESS_URL`] =
      `http://127.0.0.1:3000/settings/${lower}`;
  }
  Object.assign(config, {
    FACEBOOK_GRAPH_API_VERSION: "v-test",
    INSTAGRAM_GRAPH_API_VERSION: "v-test",
    LINKEDIN_API_VERSION: "mock",
    PINTEREST_API_BASE_URL: "https://api.pinterest.com/v5",
    TIKTOK_API_BASE_URL: "https://open.tiktokapis.com",
    TIKTOK_CLIENT_KEY: "tiktok-demo",
    TIKTOK_CLIENT_SECRET: "tiktok-demo-not-a-real-secret",
  });
  await writeFile(
    environmentFile,
    Object.entries(config)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join("\n") + "\n",
    { flag: "wx", mode: 0o600 },
  );
}

await configure();
const env = {
  ...process.env,
  ...parseEnv(await readFile(environmentFile, "utf8")),
  // SSR and the browser share the Mac's timezone during the local oral demo.
  TZ: Intl.DateTimeFormat().resolvedOptions().timeZone,
  MEDIA_LOCAL_DIRECTORY: join(demoDirectory, "media"),
};
const apiDirectory = join(root, "apps/api");

if (command === "prepare") {
  await run("docker", ["compose", "-f", composeFile, "up", "-d", "--wait"]);
  await run(process.execPath, ["ace.js", "migration:run", "--force"], {
    cwd: apiDirectory,
    env,
  });
  await run(process.execPath, ["ace.js", "dev:seed-demo"], {
    cwd: apiDirectory,
    env,
  });
} else if (command === "build") {
  await run("pnpm", ["build"], { env });
} else if (command === "start") {
  const processes = [
    [join(root, "apps/api/build/bin/server.js"), apiDirectory, { ...env }],
    [
      join(root, "apps/worker/dist/index.js"),
      join(root, "apps/worker"),
      { ...env },
    ],
    [
      join(root, "apps/web/.output/server/index.mjs"),
      join(root, "apps/web"),
      { ...env, PORT: "3000", NITRO_PORT: "3000", NITRO_HOST: "127.0.0.1" },
    ],
  ];
  const children = [];
  let stopping = false;
  function stop() {
    if (stopping) return;
    stopping = true;
    for (const child of children) child.kill("SIGTERM");
  }
  for (const [entry, cwd, childEnv] of processes) {
    const child = spawn(process.execPath, [entry], {
      cwd,
      env: childEnv,
      stdio: "inherit",
    });
    children.push(child);
    child.once("error", (error) => {
      console.error(error.message);
      process.exitCode = 1;
      stop();
    });
    child.once("exit", (code) => {
      if (!stopping) {
        process.exitCode = code || 1;
        stop();
      }
    });
  }
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  console.log(
    "WePost : http://127.0.0.1:3000 — données de démonstration, fournisseurs simulés.",
  );
} else if (command === "check") {
  for (const [label, url] of [
    ["Frontend", "http://127.0.0.1:3000/auth/login"],
    ["API liveness", "http://127.0.0.1:3333/health/live"],
    ["API readiness", "http://127.0.0.1:3333/health/ready"],
  ]) {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`${label} : HTTP ${response.status}`);
    console.log(`${label} : HTTP ${response.status}`);
  }
} else if (command === "stop") {
  await run("docker", ["compose", "-f", composeFile, "stop"]);
} else {
  throw new Error("Commande attendue : prepare, build, start, check ou stop.");
}
