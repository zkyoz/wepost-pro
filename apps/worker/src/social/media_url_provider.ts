import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHash } from "node:crypto";
import type { MediaLoader } from "./media_loader.js";

export interface MediaUrlProvider {
  sign(key: string, expiresInSeconds: number): Promise<string>;
}

/** Local rehearsal only: a public URL can serve exactly one approved image. */
export class DemoImageUrlProvider implements MediaUrlProvider {
  constructor(
    private readonly loader: MediaLoader,
    private readonly url: string,
    private readonly sha256: string,
  ) {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      !parsed.hostname.endsWith(".trycloudflare.com") ||
      !/^[a-f0-9]{64}$/.test(sha256)
    )
      throw new Error("InvalidDemoImageConfiguration");
  }

  async sign(key: string) {
    const bytes = await this.loader.load(key);
    if (createHash("sha256").update(bytes).digest("hex") !== this.sha256)
      throw new Error("DemoImageNotAuthorized");
    return this.url;
  }
}

export class R2MediaUrlProvider implements MediaUrlProvider {
  private readonly client: S3Client;

  constructor(
    private readonly bucket: string,
    input: { accountId: string; accessKeyId: string; secretAccessKey: string },
  ) {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${input.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: input.accessKeyId,
        secretAccessKey: input.secretAccessKey,
      },
    });
  }

  sign(key: string, expiresInSeconds: number) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }
}

export class MockMediaUrlProvider implements MediaUrlProvider {
  async sign(key: string) {
    return `https://media.example.invalid/${encodeURIComponent(key)}`;
  }
}
