import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

export interface MediaLoader {
  load(key: string): Promise<Buffer>;
}

/** Reads the API's private development store; no public media URL is needed. */
export class LocalMediaLoader implements MediaLoader {
  constructor(private readonly directory: string) {
    if (!isAbsolute(directory))
      throw new Error("LocalMediaDirectoryMustBeAbsolute");
  }

  async load(key: string) {
    const name = `${createHash("sha256").update(key).digest("hex")}.json`;
    const file = await open(
      join(this.directory, name),
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
    try {
      const stat = await file.stat();
      if (!stat.isFile() || stat.size > 75 * 1024 * 1024)
        throw new Error("InvalidLocalMediaFile");
      const value = JSON.parse(await file.readFile("utf8")) as {
        data?: unknown;
      };
      if (
        typeof value.data !== "string" ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(value.data)
      ) {
        throw new Error("InvalidLocalMediaData");
      }
      return Buffer.from(value.data, "base64");
    } finally {
      await file.close();
    }
  }
}

export class R2MediaLoader implements MediaLoader {
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

  async load(key: string) {
    const object = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!object.Body) throw new Error("MediaObjectMissing");
    return Buffer.from(await object.Body.transformToByteArray());
  }
}

export class MockMediaLoader implements MediaLoader {
  async load(key: string) {
    return Buffer.from(`mock-media:${key}`);
  }
}
