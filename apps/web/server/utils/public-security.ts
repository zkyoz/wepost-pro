import { createHash } from "node:crypto";

function httpOrigin(value?: string) {
  try {
    const url = new URL(value || "");
    return ["http:", "https:"].includes(url.protocol) ? url.origin : "";
  } catch {
    return "";
  }
}

export function inlineScriptHashes(html: string) {
  const hashes = new Set<string>();
  for (const match of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
  )) {
    if (/\bsrc\s*=/i.test(match[1]!) || !match[2]) continue;
    hashes.add(
      `'sha256-${createHash("sha256").update(match[2]).digest("base64")}'`,
    );
  }
  return [...hashes];
}

export function buildPublicSecurityHeaders(
  posthogHost?: string,
  options: {
    apiBase?: string;
    scriptHashes?: string[];
    upgradeInsecureRequests?: boolean;
  } = {},
) {
  const posthogOrigin = httpOrigin(posthogHost);
  const apiOrigin = httpOrigin(options.apiBase);

  const connectSources = ["'self'", posthogOrigin, apiOrigin]
    .filter(Boolean)
    .join(" ");
  const mediaSources = ["'self'", "data:", "blob:", apiOrigin]
    .filter(Boolean)
    .join(" ");
  const hashes = (options.scriptHashes || []).filter((hash) =>
    /^'sha256-[A-Za-z0-9+/]{43}='$/.test(hash),
  );

  return {
    "Content-Security-Policy": [
      "default-src 'self'",
      "base-uri 'self'",
      `connect-src ${connectSources}`,
      "font-src 'self' data:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      `img-src ${mediaSources}`,
      `media-src ${mediaSources}`,
      "object-src 'none'",
      ["script-src 'self'", ...hashes].join(" "),
      "style-src 'self' 'unsafe-inline'",
      options.upgradeInsecureRequests !== false
        ? "upgrade-insecure-requests"
        : "",
    ]
      .filter(Boolean)
      .join("; "),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
}
