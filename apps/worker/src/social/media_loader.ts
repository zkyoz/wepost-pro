import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export interface MediaLoader {
  load(key: string): Promise<Buffer>;
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
