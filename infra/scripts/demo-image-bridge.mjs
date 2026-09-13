import { createHash, randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

export function imageHandler(bytes, path, expiresAt) {
  return (request, response) => {
    if (
      Date.now() >= expiresAt ||
      request.url !== path ||
      !["GET", "HEAD"].includes(request.method)
    ) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Content-Length": bytes.length,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : bytes);
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = new URL("../../.demo/", import.meta.url);
  const bytes = await readFile(new URL("instagram-test.jpg", directory));
  if (bytes.length > 8 * 1024 * 1024 || bytes[0] !== 0xff || bytes[1] !== 0xd8)
    throw new Error("ExpectedOneJpegUnder8MB");
  const path = `/${randomBytes(24).toString("hex")}.jpg`;
  const expiresAt = Date.now() + 30 * 60_000;
  const server = createServer(imageHandler(bytes, path, expiresAt));
  server.listen(4445, "127.0.0.1", async () => {
    const manifest = {
      path,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      expiresAt,
    };
    await writeFile(
      new URL("image-bridge.json", directory),
      JSON.stringify(manifest),
      { mode: 0o600 },
    );
    console.log(
      `Image seule : http://127.0.0.1:4445${path} — expiration dans 30 minutes.`,
    );
  });
  const timer = setTimeout(() => server.close(), 30 * 60_000);
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      clearTimeout(timer);
      server.close();
    });
}
