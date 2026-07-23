import type {
  LinkedInAccount,
  LinkedInSchedule,
  LinkedInValidation,
} from "~/types/linkedin";

type Data<T> = { data: T };

export function useLinkedInApi(api: typeof $fetch = useNuxtApp().$api) {
  async function mutation<T>(url: string, options: Parameters<typeof api>[1]) {
    await api("/auth/csrf");
    return api<T>(url, options);
  }
  return {
    accounts: () => api<Data<LinkedInAccount[]>>("/social/linkedin/accounts"),
    startOAuth: (input: { organizationId: string; agencyId?: string }) =>
      mutation<Data<{ authorizationUrl: string }>>(
        "/social/linkedin/oauth/start",
        { method: "POST", body: input },
      ),
    revoke: (id: string) =>
      mutation<Data<LinkedInAccount>>(`/social/linkedin/accounts/${id}`, {
        method: "DELETE",
      }),
    refresh: (id: string) =>
      mutation<Data<LinkedInAccount>>(
        `/social/linkedin/accounts/${id}/refresh`,
        {
          method: "POST",
        },
      ),
    validate: (publicationId: string, accountId: string) =>
      mutation<Data<LinkedInValidation>>(
        `/social/linkedin/publications/${publicationId}/validate`,
        { method: "POST", body: { accountId } },
      ),
    schedule: (
      publicationId: string,
      input: { accountId: string; runAt: string | null },
    ) =>
      mutation<Data<LinkedInSchedule>>(
        `/social/linkedin/publications/${publicationId}/schedule`,
        { method: "POST", body: input },
      ),
    status: (publicationId: string) =>
      api<Data<LinkedInSchedule | null>>(
        `/social/linkedin/publications/${publicationId}/status`,
      ),
    retry: (scheduleId: string) =>
      mutation<Data<LinkedInSchedule>>(
        `/social/linkedin/schedules/${scheduleId}/retry`,
        { method: "POST" },
      ),
  };
}
