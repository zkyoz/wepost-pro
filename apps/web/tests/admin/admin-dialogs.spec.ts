import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import AdminConfirmDialog from "~/components/AdminConfirmDialog.vue";
import AdminDetailsDialog from "~/components/AdminDetailsDialog.vue";

describe("administration dialogs", () => {
  it("gives destructive confirmation controls explicit accessible names", async () => {
    const wrapper = await mountSuspended(AdminConfirmDialog, {
      props: {
        title: "Désactiver le compte ?",
        message: "Cette action sera journalisée.",
        confirmLabel: "Désactiver",
        danger: true,
      },
    });
    expect(wrapper.get("h2").text()).toBe("Désactiver le compte ?");
    expect(wrapper.get("button.button-danger").text()).toBe("Désactiver");
    expect(wrapper.text()).toContain("Annuler");
  });

  it("renders a readable definition list without interpreting HTML", async () => {
    const wrapper = await mountSuspended(AdminDetailsDialog, {
      props: {
        title: "Détail",
        details: { status: "failed", error: "<script>alert(1)</script>" },
      },
    });
    expect(wrapper.findAll("dt").map((item) => item.text())).toEqual([
      "status",
      "error",
    ]);
    expect(wrapper.html()).not.toContain("<script>alert(1)</script>");
    expect(wrapper.text()).toContain("<script>alert(1)</script>");
  });
});
