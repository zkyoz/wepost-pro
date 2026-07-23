import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import SupervisionSummaryCards from "~/components/SupervisionSummaryCards.vue";

const counts = {
  unread_comments: 2,
  awaiting_client_review: 3,
  changes_requested: 4,
  scheduled: 5,
  published: 6,
  failed: 7,
} as const;

describe("SupervisionSummaryCards", () => {
  it("exposes every counter as text and a keyboard button", async () => {
    const wrapper = await mountSuspended(SupervisionSummaryCards, {
      props: { counts, selected: "unread_comments" },
    });
    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(6);
    expect(wrapper.text()).toContain("Commentaires non lus");
    expect(wrapper.text()).toContain("Corrections demandées");
    expect(buttons[0].attributes("aria-pressed")).toBe("true");
    await buttons[5].trigger("click");
    expect(wrapper.emitted("select")?.[0]).toEqual(["failed"]);
  });
});
