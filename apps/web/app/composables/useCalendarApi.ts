import type { CalendarFilters, CalendarResponse } from "~/types/calendar";
import type { Publication } from "~/types/publication";

export function useCalendarApi(api: typeof $fetch = useNuxtApp().$api) {
  return {
    list: (filters: CalendarFilters) =>
      api<CalendarResponse>("/calendar", {
        query: Object.fromEntries(
          Object.entries(filters).filter(
            ([, value]) => value !== "" && value !== undefined,
          ),
        ),
      }),
    move: async (
      publicationId: string,
      input: {
        contentVersion: number;
        scheduledAt: string | null;
        timezone: string;
      },
    ) => {
      await api("/auth/csrf");
      return api<{ data: Publication }>(
        `/publications/${publicationId}/calendar/move`,
        { method: "POST", body: input },
      );
    },
  };
}
