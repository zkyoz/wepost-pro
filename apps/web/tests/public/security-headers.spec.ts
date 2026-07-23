import { describe, expect, it } from "vitest";
import { buildPublicSecurityHeaders } from "../../server/utils/public-security";

describe("public security headers", () => {
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
