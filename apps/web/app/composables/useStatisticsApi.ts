import type { StatisticsFilters, StatisticsResult } from "~/types/statistics";

function query(filters: StatisticsFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== ""),
  );
}

export function useStatisticsApi(api: typeof $fetch = useNuxtApp().$api) {
  return {
    get: (filters: StatisticsFilters) =>
      api<{ data: StatisticsResult; meta: { durationMs: number } }>(
        "/statistics",
        { query: query(filters) },
      ),
    exportCsv: (filters: StatisticsFilters) =>
      api<Blob>("/statistics/export.csv", {
        query: query(filters),
        responseType: "blob",
      }),
  };
}
