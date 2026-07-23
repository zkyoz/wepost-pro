type AnalyticsConsent = "pending" | "accepted" | "refused";

const STORAGE_KEY = "wepost_analytics_consent";
let analyticsClient: null | {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  init: (
    key: string,
    options: {
      api_host: string;
      autocapture: boolean;
      capture_pageview: boolean;
      disable_session_recording: boolean;
      person_profiles: "identified_only";
    },
  ) => void;
} = null;

export function useAnalyticsConsent() {
  const config = useRuntimeConfig();
  const consent = useState<AnalyticsConsent>(
    "analytics-consent",
    () => "pending",
  );
  const initialized = useState("analytics-initialized", () => false);
  const isEnabled = computed(
    () =>
      Boolean(config.public.posthogKey) && Boolean(config.public.posthogHost),
  );

  async function initializeAnalytics() {
    if (
      !import.meta.client ||
      !isEnabled.value ||
      consent.value !== "accepted" ||
      initialized.value
    ) {
      return;
    }

    const module = await import("posthog-js");
    analyticsClient = module.default;
    analyticsClient.init(String(config.public.posthogKey), {
      api_host: String(config.public.posthogHost),
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      person_profiles: "identified_only",
    });
    initialized.value = true;
    analyticsClient.capture("$pageview", {
      $current_url: window.location.href,
    });
  }

  function restoreConsent() {
    if (!import.meta.client) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "refused") {
      consent.value = stored;
    }
    void initializeAnalytics();
  }

  async function acceptAnalytics() {
    consent.value = "accepted";
    if (import.meta.client)
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    await initializeAnalytics();
  }

  function refuseAnalytics() {
    consent.value = "refused";
    if (import.meta.client) window.localStorage.setItem(STORAGE_KEY, "refused");
  }

  function capture(event: string, properties: Record<string, unknown> = {}) {
    if (consent.value === "accepted" && initialized.value) {
      analyticsClient?.capture(event, properties);
    }
  }

  return {
    consent,
    isEnabled,
    restoreConsent,
    acceptAnalytics,
    refuseAnalytics,
    capture,
  };
}
