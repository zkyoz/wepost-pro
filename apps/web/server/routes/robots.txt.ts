export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const siteUrl = String(config.public.siteUrl).replace(/\/+$/, "");
  setResponseHeader(event, "content-type", "text/plain; charset=utf-8");
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard
Disallow: /projects/
Disallow: /settings/
Sitemap: ${siteUrl}/sitemap.xml
`;
});
