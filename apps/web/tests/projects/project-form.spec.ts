import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import ProjectForm from "~/components/ProjectForm.vue";

describe("ProjectForm", () => {
  it("uses explicit labels and emits normalized members", async () => {
    const clients = [
      {
        id: "10000000-0000-4000-8000-000000000001",
        agencyId: "20000000-0000-4000-8000-000000000001",
        displayName: "Client principal",
        email: "client@example.test",
      },
      {
        id: "10000000-0000-4000-8000-000000000002",
        agencyId: "20000000-0000-4000-8000-000000000001",
        displayName: "Client membre",
        email: "membre@example.test",
      },
    ];
    const wrapper = await mountSuspended(ProjectForm, { props: { clients } });
    expect(wrapper.get('label[for="project-name"]').text()).toContain(
      "Nom du projet",
    );
    await wrapper.get("#project-name").setValue("Projet accessible");
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await wrapper.get("form").trigger("submit");
    expect(wrapper.emitted("submit")?.[0]?.[0]).toMatchObject({
      name: "Projet accessible",
      clientUserId: clients[0].id,
      memberUserIds: [clients[1].id],
    });
  });
});
