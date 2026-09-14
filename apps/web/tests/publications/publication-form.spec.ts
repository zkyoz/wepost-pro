import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import PublicationForm from "~/components/PublicationForm.vue";
import type { Publication } from "~/types/publication";

describe("PublicationForm", () => {
  it.each([
    ["2026-09-14T20:44:00.000Z", "Europe/Paris", "2026-09-14T22:44"],
    ["2026-01-14T20:44:00.000Z", "Europe/Paris", "2026-01-14T21:44"],
    ["2026-09-14T20:44:00.000Z", "UTC", "2026-09-14T20:44"],
    ["2026-09-14T01:30:00.000Z", "America/New_York", "2026-09-13T21:30"],
  ])(
    "preserves %s in %s when editing only the text",
    async (scheduledAt, timezone, localDate) => {
      const publication: Publication = {
        id: "publication-id",
        agencyId: "agency-id",
        projectId: "project-id",
        title: "Publication de test",
        baseText: "Texte initial",
        targetNetworks: ["instagram", "linkedin"],
        scheduledAt,
        timezone,
        status: "draft",
        contentVersion: 1,
        approvedVersion: null,
        createdBy: "user-id",
        updatedBy: "user-id",
        archivedAt: null,
        createdAt: scheduledAt,
        updatedAt: scheduledAt,
      };
      const wrapper = await mountSuspended(PublicationForm, {
        props: { publication, defaultTimezone: "UTC" },
      });
      expect(
        (wrapper.get("#publication-date").element as HTMLInputElement).value,
      ).toBe(localDate);
      await wrapper.get("#publication-text").setValue("Texte corrigé");
      await wrapper.get("form").trigger("submit");
      expect(wrapper.emitted("submit")?.[0]?.[0]).toMatchObject({
        baseText: "Texte corrigé",
        scheduledAt: localDate,
        timezone,
      });
    },
  );

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
