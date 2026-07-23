import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import PasswordField from "~/components/PasswordField.vue";

describe("PasswordField", () => {
  it("associates errors with the input and allows showing the value", async () => {
    const wrapper = await mountSuspended(PasswordField, {
      props: {
        id: "password",
        label: "Mot de passe",
        modelValue: "visible-value",
        autocomplete: "current-password",
        error: "Mot de passe requis.",
      },
    });
    const input = wrapper.get("input");
    expect(input.attributes("aria-describedby")).toBe("password-error");
    expect(input.attributes("type")).toBe("password");
    await wrapper.get("button").trigger("click");
    expect(wrapper.get("input").attributes("type")).toBe("text");
    expect(wrapper.get("button").attributes("aria-pressed")).toBe("true");
  });
});
