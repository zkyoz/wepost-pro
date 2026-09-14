import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ThemeToggle from "~/components/ThemeToggle.vue";

describe("appearance preference", () => {
  it("switches between light and dark and keeps the choice on remount", async () => {
    const wrapper = await mountSuspended(ThemeToggle);
    const initial = wrapper.get("button").attributes("aria-label");
    await wrapper.get("button").trigger("click");
    const changed = wrapper.get("button").attributes("aria-label");
    expect(changed).not.toBe(initial);
    wrapper.unmount();
    const restored = await mountSuspended(ThemeToggle);
    expect(restored.get("button").attributes("aria-label")).toBe(changed);
    await restored.get("button").trigger("click");
    expect(restored.get("button").attributes("aria-label")).toBe(initial);
    restored.unmount();
  });
});
