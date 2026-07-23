export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const requestHeaders = import.meta.server
    ? useRequestHeaders(["cookie"])
    : {};
  const xsrfToken = useCookie<string | null>("XSRF-TOKEN");

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    credentials: "include",
    onRequest({ options }) {
      const headers = new Headers(options.headers);
      if (import.meta.server && requestHeaders.cookie)
        headers.set("cookie", requestHeaders.cookie);
      const method = String(options.method ?? "GET").toUpperCase();
      if (
        xsrfToken.value &&
        ["POST", "PUT", "PATCH", "DELETE"].includes(method)
      ) {
        headers.set("X-XSRF-TOKEN", xsrfToken.value);
      }
      headers.set("Accept", "application/json");
      options.headers = headers;
    },
  });

  return { provide: { api } };
});
