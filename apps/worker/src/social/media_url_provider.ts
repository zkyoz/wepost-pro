import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface MediaUrlProvider {
  sign(key: string, expiresInSeconds: number): Promise<string>;
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
