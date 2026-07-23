import type {
  FacebookAccount,
  FacebookSchedule,
  FacebookValidation,
} from "~/types/facebook";

type Data<T> = { data: T };

export function useFacebookApi(api: typeof $fetch = useNuxtApp().$api) {
  async function mutation<T>(url: string, options: Parameters<typeof api>[1]) {
    await api("/auth/csrf");
    return api<T>(url, options);
  }
  return {
    accounts: () => api<Data<FacebookAccount[]>>("/social/facebook/accounts"),
    startOAuth: (input: { pageId: string; agencyId?: string }) =>
      mutation<Data<{ authorizationUrl: string }>>(
        "/social/facebook/oauth/start",
        { method: "POST", body: input },
      ),
    revoke: (id: string) =>
      mutation<Data<FacebookAccount>>(`/social/facebook/accounts/${id}`, {
        method: "DELETE",
      }),
    validate: (publicationId: string, accountId: string) =>
      mutation<Data<FacebookValidation>>(
        `/social/facebook/publications/${publicationId}/validate`,
        { method: "POST", body: { accountId } },
      ),
    schedule: (
      publicationId: string,
      input: { accountId: string; runAt: string | null },
    ) =>
      mutation<Data<FacebookSchedule>>(
        `/social/facebook/publications/${publicationId}/schedule`,
        { method: "POST", body: input },
      ),
    status: (publicationId: string) =>
      api<Data<FacebookSchedule | null>>(
        `/social/facebook/publications/${publicationId}/status`,
      ),
    retry: (scheduleId: string) =>
      mutation<Data<FacebookSchedule>>(
        `/social/facebook/schedules/${scheduleId}/retry`,
        { method: "POST" },
      ),
  };
}
