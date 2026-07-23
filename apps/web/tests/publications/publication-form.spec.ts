import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import PublicationForm from "~/components/PublicationForm.vue";

describe("PublicationForm", () => {
  it("labels content, exposes a character counter and announces unsaved changes", async () => {
    const wrapper = await mountSuspended(PublicationForm, {
      props: { defaultTimezone: "Europe/Paris" },
    });
    expect(wrapper.get('label[for="publication-title"]').text()).toContain(
      "Titre interne",
    );
    expect(wrapper.get('label[for="publication-text"]').text()).toContain(
      "Texte",
    );
    await wrapper.get("#publication-title").setValue("Annonce accessible");
    await wrapper.get("#publication-text").setValue("Bonjour !");
    await wrapper.get('input[value="linkedin"]').setValue(true);
    expect(wrapper.get("#publication-character-count").text()).toContain(
      "9 caractères",
    );
    expect(wrapper.get(".unsaved-indicator").text()).toContain(
      "non enregistrées",
    );
    await wrapper.get("form").trigger("submit");
    expect(wrapper.emitted("submit")?.[0]?.[0]).toMatchObject({
      title: "Annonce accessible",
      targetNetworks: ["linkedin"],
      timezone: "Europe/Paris",
    });
  });
});
