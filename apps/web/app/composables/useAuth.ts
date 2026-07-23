import type {
  ApiEnvelope,
  LoginInput,
  PublicUser,
  RegisterInput,
  AppLocale,
} from "~/types/auth";

export function useAuth(apiOverride?: typeof $fetch) {
  const user = useState<PublicUser | null>("auth.user", () => null);
  const isLoading = useState("auth.loading", () => false);
  const hasLoaded = useState("auth.loaded", () => false);
  const localeRequestId = useState("auth.localeRequestId", () => 0);
  const pendingLocale = useState<AppLocale | null>(
    "auth.pendingLocale",
    () => null,
  );
  const $api = apiOverride ?? useNuxtApp().$api;
  const isAuthenticated = computed(() => Boolean(user.value));
  const { setLocale } = useLocale();

  function applyProfile(profile: PublicUser, syncLocale = true) {
    user.value = profile;
    if (syncLocale && !pendingLocale.value) setLocale(profile.locale);
    return profile;
  }

  async function ensureCsrfToken() {
    await $api("/auth/csrf");
  }

  async function fetchCurrentUser() {
    isLoading.value = true;
    const localeRequestAtStart = localeRequestId.value;
    try {
      const response = await $api<ApiEnvelope<PublicUser>>("/auth/me");
      return applyProfile(
        response.data,
        localeRequestAtStart === localeRequestId.value,
      );
    } catch (error: unknown) {
      const candidate = error as { statusCode?: number; status?: number };
      if ((candidate.statusCode ?? candidate.status) === 401) {
        user.value = null;
        return null;
      }
      throw error;
    } finally {
      hasLoaded.value = true;
      isLoading.value = false;
    }
  }

  async function login(payload: LoginInput) {
    isLoading.value = true;
    try {
      await ensureCsrfToken();
      const response = await $api<ApiEnvelope<PublicUser>>("/auth/login", {
        method: "POST",
        body: payload,
      });
      applyProfile(response.data);
      hasLoaded.value = true;
      return response.data;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(payload: RegisterInput) {
    isLoading.value = true;
    try {
      await ensureCsrfToken();
      const response = await $api<ApiEnvelope<PublicUser>>("/auth/register", {
        method: "POST",
        body: payload,
      });
      applyProfile(response.data);
      hasLoaded.value = true;
      return response.data;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    isLoading.value = true;
    try {
      await ensureCsrfToken();
      await $api("/auth/logout", { method: "POST" });
    } finally {
      user.value = null;
      hasLoaded.value = true;
      isLoading.value = false;
    }
  }

  async function updateLocale(locale: AppLocale) {
    const requestId = ++localeRequestId.value;
    pendingLocale.value = locale;
    setLocale(locale);
    try {
      await ensureCsrfToken();
      const response = await $api<ApiEnvelope<PublicUser>>("/users/me/locale", {
        method: "PATCH",
        body: { locale },
      });
      if (requestId !== localeRequestId.value) return response.data;
      user.value = response.data;
      setLocale(locale);
      return response.data;
    } finally {
      if (requestId === localeRequestId.value) pendingLocale.value = null;
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    hasLoaded,
    fetchCurrentUser,
    register,
    login,
    logout,
    updateLocale,
  };
}
