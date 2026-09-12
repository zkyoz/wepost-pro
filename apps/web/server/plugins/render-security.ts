import {
  buildPublicSecurityHeaders,
  inlineScriptHashes,
} from "../utils/public-security";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:response", (response, { event }) => {
    if (import.meta.dev || typeof response.body !== "string") return;
    const config = useRuntimeConfig(event);
    const headers = buildPublicSecurityHeaders(
      String(config.public.posthogHost || ""),
      {
        apiBase: String(config.public.apiBase || ""),
        scriptHashes: inlineScriptHashes(response.body),
        upgradeInsecureRequests: String(config.public.siteUrl || "").startsWith(
          "https://",
        ),
      },
    );
    setResponseHeader(
      event,
      "Content-Security-Policy",
      headers["Content-Security-Policy"],
    );
    response.headers ??= {};
    response.headers["Content-Security-Policy"] =
      headers["Content-Security-Policy"];
  });
});
