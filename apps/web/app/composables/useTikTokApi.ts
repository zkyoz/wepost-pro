import type {
  TikTokAccount,
  TikTokVideoInput,
  TikTokSchedule,
  TikTokValidation,
} from "~/types/tiktok";

type Data<T> = { data: T };

export function useTikTokApi(api: typeof $fetch = useNuxtApp().$api) {
  async function mutation<T>(url: string, options: Parameters<typeof api>[1]) {
    await api("/auth/csrf");
    return api<T>(url, options);
  }
  return {
    accounts: () => api<Data<TikTokAccount[]>>("/social/tiktok/accounts"),
    startOAuth: (input: { agencyId?: string }) =>
      mutation<Data<{ authorizationUrl: string }>>(
        "/social/tiktok/oauth/start",
        { method: "POST", body: input },
      ),
    revoke: (id: string) =>
      mutation<Data<TikTokAccount>>(`/social/tiktok/accounts/${id}`, {
        method: "DELETE",
      }),
    refresh: (id: string) =>
      mutation<Data<TikTokAccount>>(`/social/tiktok/accounts/${id}/refresh`, {
        method: "POST",
      }),
    validate: (publicationId: string, input: TikTokVideoInput) =>
      mutation<Data<TikTokValidation>>(
        `/social/tiktok/publications/${publicationId}/validate`,
        { method: "POST", body: input },
      ),
    schedule: (
      publicationId: string,
      input: TikTokVideoInput & { runAt: string | null },
    ) =>
      mutation<Data<TikTokSchedule>>(
        `/social/tiktok/publications/${publicationId}/schedule`,
        { method: "POST", body: input },
      ),
    status: (publicationId: string) =>
      api<Data<TikTokSchedule | null>>(
        `/social/tiktok/publications/${publicationId}/status`,
      ),
    retry: (scheduleId: string) =>
      mutation<Data<TikTokSchedule>>(
        `/social/tiktok/schedules/${scheduleId}/retry`,
        { method: "POST" },
      ),
  };
}
