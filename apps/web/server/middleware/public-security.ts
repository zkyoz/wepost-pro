import { buildPublicSecurityHeaders } from "../utils/public-security";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const headers = buildPublicSecurityHeaders(
    String(config.public.posthogHost || ""),
  );

  for (const [name, value] of Object.entries(headers)) {
    if (import.meta.dev && name === "Content-Security-Policy") continue;
    setResponseHeader(event, name, value);
  }
});
