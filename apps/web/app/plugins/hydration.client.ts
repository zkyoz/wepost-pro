export default defineNuxtPlugin((nuxtApp) => {
  const ready = () => {
    document.documentElement.dataset.nuxtReady = "true";
  };
  // Mounting the root does not mean an asynchronous page is hydrated yet.
  nuxtApp.hook("app:suspense:resolve", ready);
  nuxtApp.hook("app:mounted", () => {
    if (!nuxtApp.isHydrating) ready();
  });
  nuxtApp.hook("page:start", () => {
    document.documentElement.dataset.nuxtReady = "false";
  });
  nuxtApp.hook("page:finish", ready);
});
