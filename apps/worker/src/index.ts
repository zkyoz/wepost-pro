import { UnrecoverableError, Worker } from "bullmq";
import pg from "pg";
import { loadConfig } from "./config.js";
import { emailBackoffDelay, processNotificationEmail } from "./processor.js";
import { PostgresNotificationRepository } from "./repository.js";
import { ResendEmailSender } from "./resend_sender.js";
import type { NotificationEmailJob } from "./types.js";
import {
  FacebookPublisher,
  MockFacebookPublisher,
} from "./social/facebook_adapter.js";
import { MockMediaLoader, R2MediaLoader } from "./social/media_loader.js";
import {
  processFacebookPublication,
  socialBackoffDelay,
} from "./social/processor.js";
import { PostgresSocialPublicationRepository } from "./social/repository.js";
import { decryptSocialToken } from "./social/token_cipher.js";
import type { FacebookPublicationJob } from "./social/types.js";
import {
  InstagramPublisher,
  MockInstagramPublisher,
} from "./social/instagram_adapter.js";
import { processInstagramPublication } from "./social/instagram_processor.js";
import {
  MockMediaUrlProvider,
  R2MediaUrlProvider,
} from "./social/media_url_provider.js";
import type { InstagramPublicationJob } from "./social/types.js";
import {
  LinkedInPublisher,
  MockLinkedInPublisher,
} from "./social/linkedin_adapter.js";
import { processLinkedInPublication } from "./social/linkedin_processor.js";
import type { LinkedInPublicationJob } from "./social/types.js";
import {
  MockPinterestPublisher,
  PinterestPublisher,
} from "./social/pinterest_adapter.js";
import { processPinterestPublication } from "./social/pinterest_processor.js";
import type { PinterestPublicationJob } from "./social/types.js";
import {
  MockTikTokPublisher,
  TikTokPublisher,
} from "./social/tiktok_adapter.js";
import { processTikTokPublication } from "./social/tiktok_processor.js";
import type { TikTokPublicationJob } from "./social/types.js";
import { MockAiTextProvider, DisabledAiTextProvider } from "./ai/provider.js";
import { aiBackoffDelay, processAiTextGeneration } from "./ai/processor.js";
import { PostgresAiGenerationRepository } from "./ai/repository.js";
import type { AiTextGenerationJob } from "./ai/types.js";
import { sendWorkerHeartbeat } from "./heartbeat.js";

const config = loadConfig();
const pool = new pg.Pool(config.database);
const dependencies = {
  repository: new PostgresNotificationRepository(pool),
  sender: new ResendEmailSender(config.resendApiKey, config.emailFrom),
  webAppUrl: config.webAppUrl,
};
const mediaLoader =
  config.facebook.driver === "facebook" ||
  config.linkedin.driver === "linkedin" ||
  config.tiktok.driver === "tiktok"
    ? new R2MediaLoader(config.r2.bucket, config.r2)
    : new MockMediaLoader();
const facebookPublisher =
  config.facebook.driver === "facebook"
    ? new FacebookPublisher(config.facebook, mediaLoader)
    : new MockFacebookPublisher();
const facebookDependencies = {
  repository: new PostgresSocialPublicationRepository(pool, "facebook"),
  publisher: facebookPublisher,
  decryptToken: (token: string) =>
    decryptSocialToken(token, config.socialTokenEncryptionKey),
};
const instagramMediaUrls =
  config.instagram.driver === "instagram"
    ? new R2MediaUrlProvider(config.r2.bucket, config.r2)
    : new MockMediaUrlProvider();
const instagramPublisher =
  config.instagram.driver === "instagram"
    ? new InstagramPublisher(config.instagram, instagramMediaUrls)
    : new MockInstagramPublisher();
const instagramDependencies = {
  repository: new PostgresSocialPublicationRepository(pool, "instagram"),
  publisher: instagramPublisher,
  decryptToken: (token: string) =>
    decryptSocialToken(token, config.socialTokenEncryptionKey),
};
const linkedinPublisher =
  config.linkedin.driver === "linkedin"
    ? new LinkedInPublisher(config.linkedin, mediaLoader)
    : new MockLinkedInPublisher();
const linkedinDependencies = {
  repository: new PostgresSocialPublicationRepository(pool, "linkedin"),
  publisher: linkedinPublisher,
  decryptToken: (token: string) =>
    decryptSocialToken(token, config.socialTokenEncryptionKey),
};
const pinterestMediaUrls =
  config.pinterest.driver === "pinterest"
    ? new R2MediaUrlProvider(config.r2.bucket, config.r2)
    : new MockMediaUrlProvider();
const pinterestPublisher =
  config.pinterest.driver === "pinterest"
    ? new PinterestPublisher(config.pinterest, pinterestMediaUrls)
    : new MockPinterestPublisher();
const pinterestDependencies = {
  repository: new PostgresSocialPublicationRepository(pool, "pinterest"),
  publisher: pinterestPublisher,
  decryptToken: (token: string) =>
    decryptSocialToken(token, config.socialTokenEncryptionKey),
};
const tiktokPublisher =
  config.tiktok.driver === "tiktok"
    ? new TikTokPublisher(config.tiktok, mediaLoader)
    : new MockTikTokPublisher();
const tiktokDependencies = {
  repository: new PostgresSocialPublicationRepository(pool, "tiktok"),
  publisher: tiktokPublisher,
  decryptToken: (token: string) =>
    decryptSocialToken(token, config.socialTokenEncryptionKey),
};
const aiDependencies = {
  repository: new PostgresAiGenerationRepository(pool),
  provider:
    config.ai.driver === "mock"
      ? new MockAiTextProvider()
      : new DisabledAiTextProvider(),
};

type QueueJob =
  | NotificationEmailJob
  | FacebookPublicationJob
  | InstagramPublicationJob
  | LinkedInPublicationJob
  | PinterestPublicationJob
  | TikTokPublicationJob
  | AiTextGenerationJob;

const worker = new Worker<QueueJob>(
  config.queueName,
  (job) => {
    if (job.name === "notification-email") {
      return processNotificationEmail(
        job as Parameters<typeof processNotificationEmail>[0],
        dependencies,
      );
    }
    if (job.name === "publication-facebook") {
      return processFacebookPublication(
        job as Parameters<typeof processFacebookPublication>[0],
        facebookDependencies,
      );
    }
    if (job.name === "publication-instagram") {
      return processInstagramPublication(
        job as Parameters<typeof processInstagramPublication>[0],
        instagramDependencies,
      );
    }
    if (job.name === "publication-linkedin") {
      return processLinkedInPublication(
        job as Parameters<typeof processLinkedInPublication>[0],
        linkedinDependencies,
      );
    }
    if (job.name === "publication-pinterest") {
      return processPinterestPublication(
        job as Parameters<typeof processPinterestPublication>[0],
        pinterestDependencies,
      );
    }
    if (job.name === "publication-tiktok") {
      return processTikTokPublication(
        job as Parameters<typeof processTikTokPublication>[0],
        tiktokDependencies,
      );
    }
    if (job.name === "ai-text-generation") {
      return processAiTextGeneration(
        job as Parameters<typeof processAiTextGeneration>[0],
        aiDependencies,
      );
    }
    throw new UnrecoverableError("unsupported_job_type");
  },
  {
    connection: config.redis,
    prefix: config.queuePrefix,
    concurrency: config.concurrency,
    settings: {
      backoffStrategy: (attemptsMade, type) => {
        const emailDelay = emailBackoffDelay(attemptsMade, type);
        if (emailDelay >= 0) return emailDelay;
        const aiDelay = aiBackoffDelay(attemptsMade, type);
        return aiDelay >= 0 ? aiDelay : socialBackoffDelay(attemptsMade, type);
      },
    },
  },
);

worker.on("completed", (job) => {
  const result = job.returnvalue as
    { durationMs?: number; skipped?: boolean } | undefined;
  console.info(
    JSON.stringify({
      event: "worker.job_completed",
      metric: "worker_job_success_total",
      jobName: job.name,
      jobId: job.id,
      durationMs: result?.durationMs,
      retryCount: job.attemptsMade,
      skipped: result?.skipped,
    }),
  );
});
worker.on("failed", (job, error) => {
  console.error(
    JSON.stringify({
      event: "worker.job_failed",
      metric: "worker_job_failure_total",
      jobName: job?.name,
      jobId: job?.id,
      retryCount: job?.attemptsMade,
      errorName: error.name,
    }),
  );
});
worker.on("error", (error) => {
  console.error(
    JSON.stringify({ event: "worker.error", errorName: error.name }),
  );
});

async function heartbeat() {
  try {
    const client = await worker.client;
    const result = await sendWorkerHeartbeat({
      store: client,
      key: config.heartbeat.key,
      ttlSeconds: config.heartbeat.ttlSeconds,
      pushUrl: config.heartbeat.uptimeKumaPushUrl,
    });
    console.info(
      JSON.stringify({
        event: "worker.heartbeat",
        metric: "worker_heartbeat_total",
        pushed: result.pushed,
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "worker.heartbeat_failed",
        metric: "worker_heartbeat_failure_total",
        errorName: error instanceof Error ? error.name : "UnknownError",
      }),
    );
  }
}

void heartbeat();
const heartbeatTimer = setInterval(
  () => void heartbeat(),
  config.heartbeat.intervalSeconds * 1_000,
);
heartbeatTimer.unref();

async function shutdown(signal: string) {
  console.info(JSON.stringify({ event: "worker.stopping", signal }));
  clearInterval(heartbeatTimer);
  await worker.close();
  await pool.end();
  process.exitCode = 0;
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
