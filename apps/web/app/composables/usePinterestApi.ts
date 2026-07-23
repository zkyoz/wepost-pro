import type {
  PinterestAccount,
  PinterestPinInput,
  PinterestSchedule,
  PinterestValidation,
} from "~/types/pinterest";

type Data<T> = { data: T };

export function usePinterestApi(api: typeof $fetch = useNuxtApp().$api) {
  async function mutation<T>(url: string, options: Parameters<typeof api>[1]) {
    await api("/auth/csrf");
    return api<T>(url, options);
  }
  return {
    accounts: () => api<Data<PinterestAccount[]>>("/social/pinterest/accounts"),
    startOAuth: (input: { agencyId?: string }) =>
      mutation<Data<{ authorizationUrl: string }>>(
        "/social/pinterest/oauth/start",
        { method: "POST", body: input },
      ),
    revoke: (id: string) =>
      mutation<Data<PinterestAccount>>(`/social/pinterest/accounts/${id}`, {
        method: "DELETE",
      }),
    refresh: (id: string) =>
      mutation<Data<PinterestAccount>>(
        `/social/pinterest/accounts/${id}/refresh`,
        {
          method: "POST",
        },
      ),
    validate: (publicationId: string, input: PinterestPinInput) =>
      mutation<Data<PinterestValidation>>(
        `/social/pinterest/publications/${publicationId}/validate`,
        { method: "POST", body: input },
      ),
    schedule: (
      publicationId: string,
      input: PinterestPinInput & { runAt: string | null },
    ) =>
      mutation<Data<PinterestSchedule>>(
        `/social/pinterest/publications/${publicationId}/schedule`,
        { method: "POST", body: input },
      ),
    status: (publicationId: string) =>
      api<Data<PinterestSchedule | null>>(
        `/social/pinterest/publications/${publicationId}/status`,
      ),
    retry: (scheduleId: string) =>
      mutation<Data<PinterestSchedule>>(
        `/social/pinterest/schedules/${scheduleId}/retry`,
        { method: "POST" },
      ),
  };
}
