import type {
  InstagramAccount,
  InstagramSchedule,
  InstagramValidation,
} from "~/types/instagram";

type Data<T> = { data: T };

export function useInstagramApi(api: typeof $fetch = useNuxtApp().$api) {
  async function mutation<T>(url: string, options: Parameters<typeof api>[1]) {
    await api("/auth/csrf");
    return api<T>(url, options);
  }
  return {
    accounts: () => api<Data<InstagramAccount[]>>("/social/instagram/accounts"),
    startOAuth: (input: { instagramAccountId: string; agencyId?: string }) =>
      mutation<Data<{ authorizationUrl: string }>>(
        "/social/instagram/oauth/start",
        { method: "POST", body: input },
      ),
    revoke: (id: string) =>
      mutation<Data<InstagramAccount>>(`/social/instagram/accounts/${id}`, {
        method: "DELETE",
      }),
    validate: (publicationId: string, accountId: string) =>
      mutation<Data<InstagramValidation>>(
        `/social/instagram/publications/${publicationId}/validate`,
        { method: "POST", body: { accountId } },
      ),
    schedule: (
      publicationId: string,
      input: { accountId: string; runAt: string | null },
    ) =>
      mutation<Data<InstagramSchedule>>(
        `/social/instagram/publications/${publicationId}/schedule`,
        { method: "POST", body: input },
      ),
    status: (publicationId: string) =>
      api<Data<InstagramSchedule | null>>(
        `/social/instagram/publications/${publicationId}/status`,
      ),
    retry: (scheduleId: string) =>
      mutation<Data<InstagramSchedule>>(
        `/social/instagram/schedules/${scheduleId}/retry`,
        { method: "POST" },
      ),
  };
}
