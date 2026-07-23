import type {
  CalendarExportFilters,
  CalendarFeed,
  CalendarFeedCreation,
} from "~/types/calendar-feed";

export function absoluteCalendarFeedUrl(path: string, apiBase: string) {
  return new URL(path, apiBase).toString();
}

export function useCalendarFeedApi(api: typeof $fetch = useNuxtApp().$api) {
  return {
    download: (filters: CalendarExportFilters) =>
      api<Blob>("/calendar/export.ics", {
        query: Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== ""),
        ),
        responseType: "blob",
      }),
    list: () => api<{ data: CalendarFeed[] }>("/calendar/feeds"),
    create: async (projectId?: string) => {
      await api("/auth/csrf");
      return api<CalendarFeedCreation>("/calendar/feeds", {
        method: "POST",
        body: { projectId: projectId || null },
      });
    },
    revoke: async (id: string) => {
      await api("/auth/csrf");
      return api(`/calendar/feeds/${id}`, { method: "DELETE" });
    },
  };
}
