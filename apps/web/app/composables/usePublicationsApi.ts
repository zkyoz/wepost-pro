import type {
  Publication,
  PublicationInput,
  PublicationListMeta,
  PublicationStatus,
  SocialNetwork,
} from "~/types/publication";

export function usePublicationsApi(api: typeof $fetch = useNuxtApp().$api) {
  async function mutation<T>(url: string, options: Parameters<typeof api>[1]) {
    await api("/auth/csrf");
    return api<T>(url, options);
  }

  return {
    list: (
      projectId: string,
      filters: {
        page?: number;
        q?: string;
        status?: PublicationStatus | "";
        network?: SocialNetwork | "";
      },
    ) =>
      api<{ data: Publication[]; meta: PublicationListMeta }>(
        `/projects/${projectId}/publications`,
        {
          query: Object.fromEntries(
            Object.entries(filters).filter(
              ([, value]) => value !== "" && value !== undefined,
            ),
          ),
        },
      ),
    get: (id: string) => api<{ data: Publication }>(`/publications/${id}`),
    create: (projectId: string, input: PublicationInput) =>
      mutation<{ data: Publication }>(`/projects/${projectId}/publications`, {
        method: "POST",
        body: input,
      }),
    update: (id: string, contentVersion: number, input: PublicationInput) =>
      mutation<{ data: Publication }>(`/publications/${id}`, {
        method: "PATCH",
        body: { ...input, contentVersion },
      }),
    duplicate: (id: string) =>
      mutation<{ data: Publication }>(`/publications/${id}/duplicate`, {
        method: "POST",
      }),
    archive: (id: string) =>
      mutation<{ data: Publication }>(`/publications/${id}/archive`, {
        method: "POST",
      }),
    transition: (
      id: string,
      contentVersion: number,
      status: PublicationStatus,
    ) =>
      mutation<{ data: Publication }>(`/publications/${id}/transition`, {
        method: "POST",
        body: { contentVersion, status },
      }),
  };
}
