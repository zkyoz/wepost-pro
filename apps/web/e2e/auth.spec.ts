import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function waitForNuxt(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-nuxt-ready", "true");
}

async function loginAs(page: Page, email: string) {
  await page.goto("/auth/login");
  await waitForNuxt(page);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.locator("#password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function logout(page: Page) {
  await waitForNuxt(page);
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
}

test.describe("session authentication", () => {
  test("registers, restores the session, logs out and protects private pages", async ({
    page,
  }, testInfo) => {
    const email = `e2e-${testInfo.project.name}@example.com`;
    await page.goto("/auth/register");
    await waitForNuxt(page);
    await page.getByLabel("Nom affiché").fill("Compte E2E");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page
      .locator("#register-password")
      .fill("correct-horse-battery-staple");
    await page
      .locator("#password-confirmation")
      .fill("correct-horse-battery-staple");
    await page.getByRole("button", { name: "Créer mon compte" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Bonjour, Compte" }),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    await page.reload();
    await waitForNuxt(page);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByText("Authentification opérationnelle"),
    ).toBeVisible();

    await page.getByLabel("Langue de l’interface").selectOption("en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("heading", { name: "Hello, Compte" }),
    ).toBeVisible();
    const localeAccessibility = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      localeAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
    if (testInfo.project.name === "chromium") {
      await page.evaluate(() => {
        for (const selector of [
          "nuxt-devtools",
          "nuxt-devtools-frame",
          "#nuxt-devtools-container",
          ".nuxt-devtools-container",
          "[data-nuxt-devtools]",
        ]) {
          document
            .querySelectorAll(selector)
            .forEach((element) => element.remove());
        }
      });
      await page.screenshot({
        path: "../../docs/evidence/task20/screenshots/interface-en-desktop.png",
        fullPage: true,
      });
    }
    await page.reload();
    await waitForNuxt(page);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.getByLabel("Interface language").selectOption("fr");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");

    const storage = await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }));
    expect(JSON.stringify(storage)).not.toMatch(/token|bearer|jwt/i);

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/auth\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login\?.*reason=session-expired/);
  });

  test("announces invalid credentials and keeps the login page keyboard accessible", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await waitForNuxt(page);
    await page.getByLabel("Adresse e-mail").fill("unknown@example.com");
    await page.locator("#password").fill("wrong-password");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "Adresse e-mail ou mot de passe incorrect.",
    );

    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });

  test("has no serious automated accessibility violation on login", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await waitForNuxt(page);
    const results = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
  });

  test("adapts navigation and denies administration for agency and client", async ({
    page,
  }, testInfo) => {
    await loginAs(page, "admin.e2e@example.test");
    await expect(
      page.getByRole("link", { name: "Administration" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Administration" }).click();
    await expect(
      page.getByRole("heading", { name: "Administration globale" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "État du système" }).click();
    await expect(
      page.getByRole("heading", { name: "État du système" }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: "État détaillé des composants" }),
    ).toBeVisible();
    const systemAccessibility = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      systemAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
    if (testInfo.project.name === "chromium") {
      await page.screenshot({
        path: "../../docs/evidence/task21/screenshots/system-status-desktop.png",
        fullPage: true,
      });
    }
    await page.goto("/admin/backups");
    await expect(
      page.getByRole("heading", { name: "Sauvegardes et restaurations" }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", {
        name: "Historique des sauvegardes et restaurations",
      }),
    ).toBeVisible();
    const backupAccessibility = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      backupAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
    if (testInfo.project.name === "chromium") {
      await page.screenshot({
        path: "../../docs/evidence/task22/screenshots/backups-desktop.png",
        fullPage: true,
      });
    }
    await logout(page);

    for (const email of ["agency.e2e@example.test"]) {
      await loginAs(page, email);
      await expect(
        page.getByRole("link", { name: "Administration" }),
      ).toHaveCount(0);
      await page.goto("/admin/users");
      await expect(page).toHaveURL(/\/access-denied$/);
      await expect(
        page.getByRole("heading", {
          name: "Vous n’avez pas accès à cette page",
        }),
      ).toBeVisible();
      await logout(page);
    }
  });

  test("admin disables and reactivates a test account with confirmation", async ({
    page,
  }) => {
    await loginAs(page, "admin.e2e@example.test");
    await page.getByRole("link", { name: "Administration" }).click();
    await page.getByRole("link", { name: /^Utilisateurs/ }).click();
    const agencyRow = page.getByRole("row", { name: /Agence E2E/ });
    await agencyRow.getByRole("button", { name: "Désactiver" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Désactiver" })
      .click();
    await expect(agencyRow).toContainText("Désactivé");

    await agencyRow.getByRole("button", { name: "Réactiver" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Réactiver" })
      .click();
    await expect(agencyRow).toContainText("Actif");

    const results = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
  });

  test("agency creates a project that its client can only read", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const projectName = `Projet E2E ${testInfo.project.name}`;
    const publicationTitle = `Publication E2E ${testInfo.project.name}`;
    const updatedPublicationTitle = `${publicationTitle} modifiée`;
    await loginAs(page, "agency.e2e@example.test");
    await page.getByRole("link", { name: "Projets", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Projets" })).toBeVisible();
    await page.getByRole("link", { name: "Créer un projet" }).click();
    await page.getByLabel("Nom du projet").fill(projectName);
    await page
      .getByLabel("Description")
      .fill("Projet créé pendant le parcours automatisé.");
    await page.getByLabel("Client principal").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Créer le projet" }).click();
    await expect(
      page.getByRole("heading", { name: projectName }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Modifier" })).toBeVisible();

    await page.getByRole("link", { name: "Voir les publications" }).click();
    await page.getByRole("link", { name: "Créer une publication" }).click();
    await page.getByLabel("Titre interne").fill(publicationTitle);
    await page
      .locator("#publication-text")
      .fill("Publication créée pendant le parcours automatisé.");
    await page.getByLabel("LinkedIn").check();
    await page.getByLabel("Facebook").check();
    await page.getByLabel("Instagram").check();
    await page.getByLabel("Pinterest").check();
    await page.getByLabel("TikTok").check();
    await page.getByRole("button", { name: "Créer la publication" }).click();
    await expect(
      page.getByRole("heading", { name: publicationTitle }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Modifier" }).click();
    await page.getByLabel("Titre interne").fill(updatedPublicationTitle);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(
      page.getByRole("heading", { name: updatedPublicationTitle }),
    ).toBeVisible();

    const publicationUrl = page.url();
    const publicationId = new URL(publicationUrl).pathname.split("/").pop()!;
    await page
      .getByLabel("Brief de génération")
      .fill(
        "Présenter une campagne responsable avec un message clair et engageant.",
      );
    await page.getByRole("button", { name: "Générer 3 propositions" }).click();
    await expect(page.getByText("3 propositions sont prêtes.")).toBeVisible();
    await expect(page.getByText(/Contenu généré · proposition/)).toHaveCount(3);
    await page
      .getByRole("button", { name: "Utiliser la proposition 1" })
      .click();
    await expect(
      page.getByText(
        "Le texte généré choisi a été appliqué à la publication sans la publier.",
      ),
    ).toBeVisible();
    await expect(
      page
        .locator('section[aria-labelledby="publication-content"]')
        .getByText(/À retenir — Présenter une campagne responsable/),
    ).toBeVisible();
    const aiAccessibility = await new AxeBuilder({ page })
      .include(".ai-assistant")
      .analyze();
    expect(
      aiAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
    if (testInfo.project.name === "chromium") {
      await page.evaluate(() => {
        for (const selector of [
          "nuxt-devtools",
          "nuxt-devtools-frame",
          "#nuxt-devtools-container",
          ".nuxt-devtools-container",
          "[data-nuxt-devtools]",
        ]) {
          document.querySelectorAll(selector).forEach((element) => {
            (element as HTMLElement).style.display = "none";
          });
        }
      });
      await page.locator(".ai-assistant").screenshot({
        path: "../../docs/evidence/task16/screenshots/ai-text-assistant-desktop.png",
      });
    }
    await page.getByRole("button", { name: "En cours" }).click();
    await page
      .getByRole("button", { name: "En attente de validation client" })
      .click();
    await logout(page);

    await loginAs(page, "client.e2e@example.test");
    await page.goto(publicationUrl);
    await waitForNuxt(page);
    await expect(
      page.getByRole("heading", { name: "Commentaires et validation" }),
    ).toBeVisible();
    const commentInput = page.getByLabel("Ajouter un commentaire");
    const publishComment = page.getByRole("button", {
      name: "Publier le commentaire",
    });
    await expect(publishComment).toBeEnabled();
    await commentInput.fill("Merci, je souhaite préciser la conclusion.");
    await expect(commentInput).toHaveValue(
      "Merci, je souhaite préciser la conclusion.",
    );
    await publishComment.click();
    await expect(
      page.getByText("Le nouveau commentaire a été ajouté."),
    ).toBeVisible();
    await page
      .getByLabel("Message de décision")
      .fill("Merci de clarifier la conclusion.");
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Demander des corrections" })
      .click();
    await expect(
      page.getByText("Décision enregistrée : Corrections demandées."),
    ).toBeVisible();
    await logout(page);

    await loginAs(page, "agency.e2e@example.test");
    await page.getByRole("link", { name: "Supervision" }).click();
    await expect(
      page.getByRole("heading", { name: "Supervision métier" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Commentaires non lus 1/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Corrections demandées 1/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: updatedPublicationTitle }),
    ).toBeVisible();
    const supervisionAccessibility = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      supervisionAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
    if (testInfo.project.name === "chromium") {
      await page.evaluate(() => {
        for (const selector of [
          "nuxt-devtools",
          "nuxt-devtools-frame",
          "#nuxt-devtools-container",
          ".nuxt-devtools-container",
          "[data-nuxt-devtools]",
        ]) {
          document.querySelectorAll(selector).forEach((element) => {
            (element as HTMLElement).style.display = "none";
          });
        }
      });
      await page.screenshot({
        path: "../../docs/evidence/task14/screenshots/supervision-dashboard-desktop.png",
        fullPage: true,
      });
    }
    await page.getByRole("button", { name: "Marquer comme lu" }).click();
    await expect(
      page.getByText(
        "Le commentaire est marqué comme lu et reste dans l’historique.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Commentaires non lus 0/ }),
    ).toBeVisible();
    await page.goto(publicationUrl);
    await waitForNuxt(page);
    await page.getByRole("link", { name: "Modifier" }).click();
    await page
      .locator("#publication-text")
      .fill("Publication corrigée après le retour du client.");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByRole("button", { name: "En cours" }).click();
    await page
      .getByRole("button", { name: "En attente de validation client" })
      .click();
    await logout(page);

    await loginAs(page, "client.e2e@example.test");
    await page.goto(publicationUrl);
    await waitForNuxt(page);
    await expect(
      page.getByRole("heading", { name: "Décision client sur la version 4" }),
    ).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Approuver cette version" }).click();
    await expect(
      page.getByText("Décision enregistrée : Approuvée."),
    ).toBeVisible();
    await logout(page);

    await loginAs(page, "agency.e2e@example.test");
    await page.goto(publicationUrl);
    await waitForNuxt(page);
    await expect(
      page.getByText("Approuvée", { exact: true }).first(),
    ).toBeVisible();
    await page.getByRole("link", { name: "Notifications" }).click();
    await expect(
      page.getByRole("heading", { name: "Notifications" }),
    ).toBeVisible();
    await expect(page.getByText("Nouveau commentaire").first()).toBeVisible();
    await page.goto(publicationUrl);
    await waitForNuxt(page);

    await page.getByRole("link", { name: "Calendrier" }).click();
    await expect(
      page.getByRole("heading", { name: "Calendrier éditorial" }),
    ).toBeVisible();
    await page
      .getByLabel("Projet", { exact: true })
      .selectOption({ label: projectName });
    await page.getByLabel("Statut").selectOption("approved");
    await page.getByRole("button", { name: "Appliquer les filtres" }).click();
    await expect(
      page.getByRole("link", { name: new RegExp(updatedPublicationTitle) }),
    ).toBeVisible();
    await page
      .getByText(`Déplacer ${updatedPublicationTitle}`, { exact: true })
      .click();
    const calendarDate = `${new Date().toISOString().slice(0, 10)}T10:00`;
    await page.getByLabel("Date et heure").fill(calendarDate);
    await page.getByLabel("Fuseau horaire").fill("Europe/Paris");
    await page
      .getByRole("button", { name: "Enregistrer le déplacement" })
      .click();
    await expect(
      page.getByText(`${updatedPublicationTitle} a été déplacée.`),
    ).toBeAttached();

    const icsResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/v1/calendar/export.ics"),
    );
    const icsDownloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Télécharger le fichier ICS" })
      .click();
    const [icsResponse, icsDownload] = await Promise.all([
      icsResponsePromise,
      icsDownloadPromise,
    ]);
    expect(icsDownload.suggestedFilename()).toMatch(
      /^wepost-calendrier-\d{4}-\d{2}-\d{2}\.ics$/,
    );
    const icsText = await icsResponse.text();
    expect(icsText).toContain("BEGIN:VCALENDAR");
    expect(icsText).toContain(`UID:publication-${publicationId}@wepost.pro`);
    expect(icsText).not.toContain("Merci, je souhaite préciser");

    await page
      .getByRole("button", { name: "Créer un lien d’abonnement" })
      .click();
    await expect(page.getByText(/Le lien d’abonnement est créé/)).toBeVisible();
    await expect(
      page.getByLabel("Lien créé — affiché une seule fois"),
    ).toHaveValue(/\/api\/v1\/calendar\/feeds\/[A-Za-z0-9_-]{64}$/);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /^Révoquer le lien/ }).click();
    await expect(
      page.getByText("Le lien d’abonnement est révoqué."),
    ).toBeVisible();
    await expect(page.locator(".calendar-feed-list")).toContainText("Révoqué");
    const calendarExportAccessibility = await new AxeBuilder({ page })
      .include(".calendar-export")
      .analyze();
    expect(
      calendarExportAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
    if (testInfo.project.name === "chromium") {
      await page.locator(".calendar-export").screenshot({
        path: "../../docs/evidence/task19/screenshots/calendar-export-desktop.png",
      });
    }

    await page.getByRole("button", { name: "Liste" }).click();
    await expect(
      page.getByRole("heading", { name: "Liste chronologique accessible" }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: new RegExp(updatedPublicationTitle) })
      .click();
    await expect(
      page.getByRole("heading", { name: updatedPublicationTitle }),
    ).toBeVisible();

    const jpeg = Buffer.concat([
      Buffer.from(
        "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=",
        "base64",
      ),
      Buffer.from(testInfo.project.name),
    ]);
    await page.getByLabel("Fichier image ou vidéo").setInputFiles({
      name: "campagne-e2e.jpg",
      mimeType: "image/jpeg",
      buffer: jpeg,
    });
    await page
      .getByLabel("Alternative textuelle", { exact: true })
      .first()
      .fill("Visuel de la campagne E2E");
    await page.getByRole("button", { name: "Téléverser et associer" }).click();
    await expect(page.getByAltText("Visuel de la campagne E2E")).toBeVisible();
    await expect(
      page.getByText("Le média campagne-e2e.jpg a été ajouté."),
    ).toBeVisible();

    await page.getByLabel("Fichier image ou vidéo").setInputFiles({
      name: "campagne-e2e-second.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.concat([jpeg, Buffer.from([0])]),
    });
    await page
      .getByLabel("Alternative textuelle", { exact: true })
      .first()
      .fill("Second visuel E2E");
    await page.getByRole("button", { name: "Téléverser et associer" }).click();
    await expect(page.getByAltText("Second visuel E2E")).toBeVisible();
    await page
      .getByRole("button", { name: "Monter campagne-e2e-second.jpg" })
      .click();
    await expect(page.locator(".media-card h3").first()).toHaveText(
      "campagne-e2e-second.jpg",
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Supprimer campagne-e2e-second.jpg" })
      .click();
    await expect(page.getByAltText("Second visuel E2E")).toHaveCount(0);

    await page.getByRole("button", { name: "En cours" }).click();
    await page
      .getByRole("button", { name: "En attente de validation client" })
      .click();
    await logout(page);
    await loginAs(page, "client.e2e@example.test");
    await page.goto(publicationUrl);
    await waitForNuxt(page);
    await page
      .getByRole("button", {
        name: "Ouvrir les annotations de campagne-e2e.jpg",
      })
      .click();
    await page
      .getByRole("button", { name: "Placer un point à la souris" })
      .click();
    const selector = page.getByRole("button", {
      name: "Cliquer pour placer le point",
    });
    const selectorBox = await selector.boundingBox();
    expect(selectorBox).not.toBeNull();
    await page.mouse.click(
      selectorBox!.x + selectorBox!.width * 0.35,
      selectorBox!.y + selectorBox!.height * 0.45,
    );
    await page
      .getByLabel("Commentaire obligatoire")
      .fill("Décaler le logo à gauche.");
    await page.getByRole("button", { name: "Ajouter l’annotation" }).click();
    await expect(page.getByText("Décaler le logo à gauche.")).toBeVisible();

    const shapeField = page.getByLabel("Forme");
    await shapeField.focus();
    await page.keyboard.press("r");
    await expect(shapeField).toHaveValue("rectangle");
    for (const [label, value] of [
      ["X (%)", "10"],
      ["Y (%)", "15"],
      ["Largeur (%)", "30"],
      ["Hauteur (%)", "20"],
    ] as const) {
      await page.getByLabel(label).focus();
      await page.keyboard.press("ControlOrMeta+A");
      await page.keyboard.type(value);
    }
    await page.getByLabel("Commentaire obligatoire").focus();
    await page.keyboard.type("Réduire la zone de texte.");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(
      page.getByText("Réduire la zone de texte.", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".annotation-list > li").last()).toContainText(
      "rectangle",
    );

    const annotationAccessibility = await new AxeBuilder({ page })
      .include(".annotation-workspace")
      .analyze();
    expect(
      annotationAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
    await expect(
      page.getByRole("heading", { name: "Décision client sur la version 5" }),
    ).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Approuver cette version" }).click();
    await logout(page);
    await loginAs(page, "agency.e2e@example.test");
    await page.goto(publicationUrl);
    await waitForNuxt(page);

    await page.getByRole("link", { name: "Modifier" }).click();
    await page
      .locator("#publication-text")
      .fill("Publication mise à jour après les annotations du client.");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page
      .getByRole("button", {
        name: "Ouvrir les annotations de campagne-e2e.jpg",
      })
      .click();
    await expect(
      page.getByText("Historique — version 5").first(),
    ).toBeVisible();
    if (testInfo.project.name === "chromium") {
      await page.locator(".annotation-workspace").screenshot({
        path: "../../docs/evidence/task18/screenshots/annotations-desktop.png",
      });
    }
    await page
      .getByRole("button", { name: "En attente de validation client" })
      .click();
    await logout(page);
    await loginAs(page, "client.e2e@example.test");
    await page.goto(publicationUrl);
    await waitForNuxt(page);
    await expect(
      page.getByRole("heading", { name: "Décision client sur la version 6" }),
    ).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Approuver cette version" }).click();
    await logout(page);
    await loginAs(page, "agency.e2e@example.test");
    await page.goto(publicationUrl);
    await waitForNuxt(page);

    await page.getByRole("tab", { name: "LinkedIn" }).click();
    await page.getByRole("button", { name: "Générer", exact: true }).click();
    await expect(page.getByText(/1 variante\(s\) générée\(s\)/)).toBeVisible();
    await page
      .getByLabel("Texte pour LinkedIn")
      .fill("Variante LinkedIn approuvée pour la campagne E2E.");
    await page
      .getByLabel("Variantes par réseau")
      .getByRole("button", { name: "Enregistrer le brouillon" })
      .click();
    await expect(
      page.getByText("Variante LinkedIn enregistrée en brouillon."),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Approuver la variante LinkedIn" })
      .click();
    await expect(
      page.getByText(/Variante LinkedIn approuvée pour la version 6/),
    ).toBeVisible();
    const effectiveLinkedIn = await page.evaluate(async (publicationId) => {
      const response = await fetch(
        `http://127.0.0.1:3333/api/v1/publications/${publicationId}/network-variants/linkedin/effective`,
        { credentials: "include" },
      );
      return response.json();
    }, publicationId);
    expect(effectiveLinkedIn.data).toMatchObject({
      source: "variant",
      text: "Variante LinkedIn approuvée pour la campagne E2E.",
    });
    const networkVariantsAccessibility = await new AxeBuilder({ page })
      .include(".network-variants")
      .analyze();
    expect(
      networkVariantsAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
    if (testInfo.project.name === "chromium") {
      await page.locator(".network-variants").screenshot({
        path: "../../docs/evidence/task17/screenshots/network-variants-desktop.png",
      });
    }

    await page.getByRole("link", { name: "Facebook", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Connexion Facebook" }),
    ).toBeVisible();
    await page.getByLabel("Identifiant de la Page Facebook").fill("1234567890");
    await page.getByRole("button", { name: "Continuer avec Facebook" }).click();
    await expect(page).toHaveURL(/\/settings\/facebook\?facebook=connected/);
    await expect(
      page.getByText("La Page Facebook est connectée."),
    ).toBeVisible();

    await page.goto(publicationUrl);
    await waitForNuxt(page);
    const facebookValidationResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/social/facebook/publications/`) &&
        response.url().endsWith("/validate") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Valider pour Facebook" }).click();
    expect((await facebookValidationResponse).status()).toBe(200);
    await expect(
      page.getByText("La publication est compatible avec Facebook."),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Programmer sur Facebook" }).click();
    await expect(
      page.getByText("La publication Facebook est programmée."),
    ).toBeVisible();
    await expect(page.getByText(/Statut : En attente/)).toBeVisible();

    await page.getByRole("link", { name: "Instagram", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Connexion Instagram" }),
    ).toBeVisible();
    await page
      .getByLabel("Identifiant du compte Instagram")
      .fill("17841400000000000");
    await page
      .getByRole("button", { name: "Continuer avec Instagram" })
      .click();
    await expect(page).toHaveURL(/\/settings\/instagram\?instagram=connected/);
    await expect(
      page.getByText("Le compte Instagram est connecté."),
    ).toBeVisible();
    const instagramAccessibility = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      instagramAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);

    await page.goto(publicationUrl);
    await waitForNuxt(page);
    const instagramValidationResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/social/instagram/publications/`) &&
        response.url().endsWith("/validate") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Valider pour Instagram" }).click();
    expect((await instagramValidationResponse).status()).toBe(200);
    await expect(
      page.getByText("La publication est compatible avec Instagram."),
    ).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole("button", { name: "Programmer sur Instagram" })
      .click();
    await expect(
      page.getByText("La publication Instagram est programmée."),
    ).toBeVisible();

    await page.getByRole("link", { name: "LinkedIn", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Connexion LinkedIn" }),
    ).toBeVisible();
    await page
      .getByLabel("Identifiant de l’organisation LinkedIn")
      .fill("123456789");
    await page.getByRole("button", { name: "Continuer avec LinkedIn" }).click();
    await expect(page).toHaveURL(/\/settings\/linkedin\?linkedin=connected/);
    await expect(
      page.getByText("Le compte LinkedIn est connecté."),
    ).toBeVisible();
    const linkedinAccessibility = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      linkedinAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);

    await page.goto(publicationUrl);
    await waitForNuxt(page);
    const linkedinValidationResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/social/linkedin/publications/`) &&
        response.url().endsWith("/validate") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Valider pour LinkedIn" }).click();
    expect((await linkedinValidationResponse).status()).toBe(200);
    await expect(
      page.getByText("La publication est compatible avec LinkedIn."),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Programmer sur LinkedIn" }).click();
    await expect(
      page.getByText("La publication LinkedIn est programmée."),
    ).toBeVisible();

    await page.getByRole("link", { name: "Pinterest", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Connexion Pinterest" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Continuer avec Pinterest" })
      .click();
    await expect(page).toHaveURL(/\/settings\/pinterest\?pinterest=connected/);
    await expect(
      page.getByText("Le compte Pinterest est connecté."),
    ).toBeVisible();
    await expect(page.getByText(/Campagnes/)).toBeVisible();
    const pinterestAccessibility = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      pinterestAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);

    await page.goto(publicationUrl);
    await waitForNuxt(page);
    await expect(page.getByLabel("Tableau Pinterest")).toHaveValue("123456789");
    const pinterestValidationResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/social/pinterest/publications/`) &&
        response.url().endsWith("/validate") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Valider pour Pinterest" }).click();
    expect((await pinterestValidationResponse).status()).toBe(200);
    await expect(
      page.getByText("La publication est compatible avec Pinterest."),
    ).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole("button", { name: "Programmer sur Pinterest" })
      .click();
    await expect(
      page.getByText("La publication Pinterest est programmée."),
    ).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Supprimer campagne-e2e.jpg" })
      .click();
    const mp4 = Buffer.concat([
      Buffer.from("00000018667479706d703432000000006d70343269736f6d", "hex"),
      Buffer.from(testInfo.project.name),
    ]);
    await page.getByLabel("Fichier image ou vidéo").setInputFiles({
      name: "campagne-e2e.mp4",
      mimeType: "video/mp4",
      buffer: mp4,
    });
    await page
      .getByLabel("Alternative textuelle", { exact: true })
      .first()
      .fill("Vidéo de la campagne E2E");
    await page.getByRole("button", { name: "Téléverser et associer" }).click();
    await expect(
      page.getByText("Le média campagne-e2e.mp4 a été ajouté."),
    ).toBeVisible();

    await page.getByRole("link", { name: "TikTok", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Connexion TikTok" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Continuer avec TikTok" }).click();
    await expect(page).toHaveURL(/\/settings\/tiktok\?tiktok=connected/);
    await expect(
      page.getByText("Le compte TikTok est connecté."),
    ).toBeVisible();
    const tiktokAccessibility = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      tiktokAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);

    await page.goto(publicationUrl);
    await waitForNuxt(page);
    const tiktokValidationResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/social/tiktok/publications/`) &&
        response.url().endsWith("/validate") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Valider pour TikTok" }).click();
    expect((await tiktokValidationResponse).status()).toBe(200);
    await expect(
      page.getByText("La vidéo est compatible avec TikTok."),
    ).toBeVisible();
    await page.getByLabel(/Je confirme le contenu/).check();
    await page.getByRole("button", { name: "Programmer sur TikTok" }).click();
    await expect(
      page.getByText("La publication TikTok est programmée."),
    ).toBeVisible();

    await page.getByRole("link", { name: "Statistiques", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Statistiques agence" }),
    ).toBeVisible();
    await page.getByLabel("Projet").selectOption({ label: projectName });
    await page.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByText("Filtres appliqués")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Par statut" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Audience des réseaux sociaux" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("heading", { name: "Audience des réseaux sociaux" })
        .locator("..")
        .getByText("N/A", { exact: true }),
    ).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exporter en CSV" }).click();
    expect((await download).suggestedFilename()).toMatch(
      /^wepost-statistiques-\d{4}-\d{2}-\d{2}\.csv$/,
    );
    const statisticsAccessibility = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      statisticsAccessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
    if (testInfo.project.name === "chromium") {
      await page.evaluate(() => {
        for (const selector of [
          "nuxt-devtools",
          "nuxt-devtools-frame",
          "#nuxt-devtools-container",
          ".nuxt-devtools-container",
          "[data-nuxt-devtools]",
        ]) {
          document.querySelectorAll(selector).forEach((element) => {
            (element as HTMLElement).style.display = "none";
          });
        }
      });
      await page.screenshot({
        path: "../../docs/evidence/task15/screenshots/statistics-dashboard-desktop.png",
        fullPage: true,
      });
    }
    await page.goto(publicationUrl);
    await waitForNuxt(page);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Archiver" }).click();
    await expect(
      page.getByText("La publication a été archivée."),
    ).toBeVisible();
    await logout(page);

    await loginAs(page, "client.e2e@example.test");
    await expect(page.getByRole("link", { name: "Utilisateurs" })).toHaveCount(
      0,
    );
    await page.getByRole("link", { name: "Projets", exact: true }).click();
    await page.getByRole("link", { name: projectName }).click();
    await expect(
      page.getByRole("heading", { name: projectName }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Modifier" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Archiver" })).toHaveCount(0);
    await page.getByRole("link", { name: "Voir les publications" }).click();
    await page.getByRole("link", { name: updatedPublicationTitle }).click();
    await expect(
      page.getByRole("heading", { name: updatedPublicationTitle }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Modifier" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Archiver" })).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "campagne-e2e.mp4" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Supprimer campagne-e2e/ }),
    ).toHaveCount(0);

    await page.getByRole("link", { name: "Calendrier" }).click();
    await expect(
      page.getByRole("heading", { name: "Exporter ou s’abonner" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Liste" }).click();
    await page
      .getByLabel("Projet", { exact: true })
      .selectOption({ label: projectName });
    await page.getByLabel("Statut").selectOption("archived");
    await page.getByRole("button", { name: "Appliquer les filtres" }).click();
    await expect(
      page.getByRole("link", { name: new RegExp(updatedPublicationTitle) }),
    ).toBeVisible();
    await expect(
      page.getByText(`Déplacer ${updatedPublicationTitle}`, { exact: true }),
    ).toHaveCount(0);

    const results = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
  });
});
