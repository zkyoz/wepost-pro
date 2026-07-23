import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import StatisticsBarChart from "~/components/StatisticsBarChart.vue";

describe("StatisticsBarChart", () => {
  it("provides a complete tabular alternative to the visual bars", async () => {
    const wrapper = await mountSuspended(StatisticsBarChart, {
      props: {
        title: "Par statut",
        description: "Répartition test",
        rows: [
          { key: "draft", label: "Brouillon", count: 2 },
          { key: "published", label: "Publiée", count: 3 },
        ],
      },
    });
    expect(wrapper.find("ul").attributes("aria-hidden")).toBe("true");
    expect(wrapper.find("caption").text()).toContain("Données du graphique");
    expect(wrapper.findAll("tbody tr")).toHaveLength(2);
    expect(wrapper.text()).toContain("Brouillon");
    expect(wrapper.text()).toContain("3");
  });
});
