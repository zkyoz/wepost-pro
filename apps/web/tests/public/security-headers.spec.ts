import { describe, expect, it } from "vitest";
import {
  buildPublicSecurityHeaders,
  inlineScriptHashes,
} from "../../server/utils/public-security";
import { createHash } from "node:crypto";

describe("public security headers", () => {
  it("permits exactly the rendered Nuxt scripts without enabling arbitrary inline code", () => {
    const script = "window.__NUXT__={config:{app:{}}};";
    const hash = `'sha256-${createHash("sha256").update(script).digest("base64")}'`;
    const hashes = inlineScriptHashes(
      `<script>${script}</script><script src="/entry.js"></script><script>${script}</script>`,
    );
    expect(hashes).toEqual([hash]);
    const policy = buildPublicSecurityHeaders("", { scriptHashes: hashes })[
      "Content-Security-Policy"
    ];
    const directive = policy
      .split("; ")
      .find((part) => part.startsWith("script-src"));
    expect(directive).toBe(`script-src 'self' ${hash}`);
    expect(directive).not.toContain("unsafe-inline");
  });

  it("allows only the configured API origin and keeps local HTTP usable", () => {
    const policy = buildPublicSecurityHeaders("", {
      apiBase: "http://127.0.0.1:3333/api/v1",
      upgradeInsecureRequests: false,
    })["Content-Security-Policy"];
    expect(policy).toContain("connect-src 'self' http://127.0.0.1:3333");
    expect(policy).toContain(
      "img-src 'self' data: blob: http://127.0.0.1:3333",
    );
    expect(policy).not.toContain("upgrade-insecure-requests");
    expect(
      buildPublicSecurityHeaders("", {
        apiBase: "data:text/javascript,alert(1)",
        scriptHashes: ["'unsafe-inline'"],
      })["Content-Security-Policy"],
    ).not.toContain("script-src 'self' 'unsafe-inline'");
  });
  it("keeps third-party connections limited to the configured PostHog origin", () => {
    const headers = buildPublicSecurityHeaders(
      "https://eu.i.posthog.com/project/path",
    );

    expect(headers["Content-Security-Policy"]).toContain(
      "connect-src 'self' https://eu.i.posthog.com",
    );
    expect(headers["Content-Security-Policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("ignores an invalid analytics host", () => {
    const headers = buildPublicSecurityHeaders("not a url");
    expect(headers["Content-Security-Policy"]).toContain("connect-src 'self'");
    expect(headers["Content-Security-Policy"]).not.toContain("not a url");
  });
});
