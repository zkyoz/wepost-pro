import type {
  SupervisionCategory,
  SupervisionFilters,
  SupervisionItemsResponse,
  SupervisionSummary,
} from "~/types/supervision";

function query(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) => value !== "" && value !== undefined,
    ),
  );
}

export function useSupervisionApi(api: typeof $fetch = useNuxtApp().$api) {
  return {
    summary: (
      filters: SupervisionFilters = {},
      options: { signal?: AbortSignal } = {},
    ) =>
      api<{ data: SupervisionSummary; meta: { durationMs: number } }>(
        "/supervision/summary",
        {
          query: query(filters),
          ...(options.signal ? { signal: options.signal } : {}),
        },
      ),
    items: (
      category: SupervisionCategory,
      filters: SupervisionFilters = {},
      page = 1,
    ) =>
      api<SupervisionItemsResponse>("/supervision/items", {
        query: query({ ...filters, category, page }),
      }),
    markCommentRead: async (notificationId: string) => {
      await api("/auth/csrf");
      return api<{ data: { id: string; readAt: string } }>(
        `/supervision/notifications/${notificationId}/read`,
        { method: "PATCH" },
      );
    },
  };
}
