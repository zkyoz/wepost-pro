import { createHash } from "node:crypto";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LocalMediaLoader } from "../src/social/media_loader.js";

describe("local development media loader", () => {
  it("reads the API store format using hashed keys without path traversal", async () => {
    const directory = await mkdtemp(join(tmpdir(), "wepost-media-loader-"));
    try {
      const key = "../../private/image.png";
      const name = `${createHash("sha256").update(key).digest("hex")}.json`;
      const bytes = Buffer.from([137, 80, 78, 71]);
      await writeFile(
        join(directory, name),
        JSON.stringify({
          contentType: "image/png",
          data: bytes.toString("base64"),
        }),
      );
      expect(await new LocalMediaLoader(directory).load(key)).toEqual(bytes);
      await expect(
        new LocalMediaLoader(directory).load("missing"),
      ).rejects.toThrow();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects invalid stored objects and symbolic links", async () => {
    const directory = await mkdtemp(join(tmpdir(), "wepost-media-loader-"));
    try {
      const name = `${createHash("sha256").update("image").digest("hex")}.json`;
      await writeFile(
        join(directory, name),
        JSON.stringify({ data: "not base64 !" }),
      );
      const loader = new LocalMediaLoader(directory);
      await expect(loader.load("image")).rejects.toThrow(
        "InvalidLocalMediaData",
      );
      const linkName = `${createHash("sha256").update("link").digest("hex")}.json`;
      await symlink(join(directory, name), join(directory, linkName));
      await expect(loader.load("link")).rejects.toThrow();
      expect(() => new LocalMediaLoader("relative")).toThrow(
        "LocalMediaDirectoryMustBeAbsolute",
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
