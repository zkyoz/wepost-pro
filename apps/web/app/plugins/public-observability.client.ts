export default defineNuxtPlugin((nuxtApp) => {
  const { capture } = useAnalyticsConsent();
  const router = useRouter();

  router.afterEach((to) => {
    capture("$pageview", { path: to.fullPath });
  });

  nuxtApp.hook("vue:error", (error) => {
    capture("frontend_error", {
      message: error instanceof Error ? error.message : "Vue error",
    });
  });

  onNuxtReady(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    if (navigation) {
      capture("web_vital", {
        name: "TTFB",
        value: Math.round(navigation.responseStart),
      });
    }

    if (!("PerformanceObserver" in window)) return;
    const observer = new PerformanceObserver((list) => {
      const lastEntry = list.getEntries().at(-1);
      if (lastEntry) {
        capture("web_vital", {
          name: "LCP",
          value: Math.round(lastEntry.startTime),
        });
      }
    });
    try {
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      observer.disconnect();
    }
  });
});
