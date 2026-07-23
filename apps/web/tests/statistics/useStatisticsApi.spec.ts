import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
const filters = {
  from: "2026-07-01",
  to: "2026-07-31",
  projectId: "project-id",
  network: "facebook" as const,
};

describe("useStatisticsApi", () => {
  beforeEach(() => apiMock.mockReset());

  it("uses the same filters for metrics and the CSV export", async () => {
    apiMock.mockResolvedValue({ data: {} });
    const api = useStatisticsApi(apiMock as typeof $fetch);
    await api.get(filters);
    await api.exportCsv(filters);
    expect(apiMock).toHaveBeenNthCalledWith(1, "/statistics", {
      query: filters,
    });
    expect(apiMock).toHaveBeenNthCalledWith(2, "/statistics/export.csv", {
      query: filters,
      responseType: "blob",
    });
  });
});
