import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { expectTextContrast } from "./visual-assertions";

const hydrationReports = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const hydrationErrors: string[] = [];
  hydrationReports.set(page, hydrationErrors);
  page.on("console", (entry) => {
    if (/hydration.*mismatch/i.test(entry.text()))
      hydrationErrors.push(entry.text());
  });
  page.on("pageerror", (error) => hydrationErrors.push(error.message));
});
test.afterEach(async ({ page }, testInfo) => {
  const errors = hydrationReports.get(page) ?? [];
  await testInfo.attach("hydration-errors", {
    body: JSON.stringify(errors),
    contentType: "application/json",
  });
  expect(errors).toEqual([]);
});

test("keeps public and authentication screens readable in both themes", async ({
  page,
}, testInfo) => {
  for (const theme of ["dark", "light"] as const) {
    await page.goto("/auth/login");
    await expect(page.locator("html")).toHaveAttribute(
      "data-nuxt-ready",
      "true",
    );
    await page
      .getByRole("button", {
        name:
          theme === "dark" ? "Passer au thème sombre" : "Passer au thème clair",
      })
      .click();
    for (const path of ["/", "/auth/login", "/auth/register"]) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute(
        "data-nuxt-ready",
        "true",
      );
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      if (path === "/") {
        await expectTextContrast(page.locator("#features-title"), 3);
        for (const heading of await page.locator(".feature-grid h3").all())
          await expectTextContrast(heading);
      }
      const result = await new AxeBuilder({ page })
        .include("#main-content")
        .analyze();
      expect(
        result.violations.filter((item) =>
          ["serious", "critical"].includes(item.impact ?? ""),
        ),
        `${path} / ${theme}`,
      ).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(`${theme}-${path.replaceAll("/", "-")}.png`),
        fullPage: true,
      });
    }
  }
});

test("keeps both themes readable and remembers the preference across workspace pages", async ({
  page,
}, testInfo) => {
  await page.goto("/auth/login");
  await expect(page.locator("html")).toHaveAttribute("data-nuxt-ready", "true");
  await page.getByLabel("Adresse e-mail").fill("admin.e2e@example.test");
  await page.locator("#password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  for (const theme of ["dark", "light"] as const) {
    await page
      .getByRole("button", {
        name:
          theme === "dark" ? "Passer au thème sombre" : "Passer au thème clair",
      })
      .click();
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    await page.reload();
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    for (const path of [
      "/dashboard",
      "/projects/new",
      "/calendar",
      "/settings/linkedin",
      "/admin",
      "/admin/system",
    ]) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute(
        "data-nuxt-ready",
        "true",
      );
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".dashboard-loading")).toHaveCount(0);
      await expect(
        page.getByText("Chargement du calendrier…", { exact: true }),
      ).toHaveCount(0);
      if (path === "/projects/new")
        await expect(
          page.getByRole("button", { name: "Créer le projet", exact: true }),
        ).toHaveCSS("background-color", "rgb(242, 89, 13)");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      const result = await new AxeBuilder({ page })
        .include("#main-content")
        .analyze();
      expect(
        result.violations.filter((item) =>
          ["serious", "critical"].includes(item.impact ?? ""),
        ),
        `${path} / ${theme}`,
      ).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(`${theme}-${path.replaceAll("/", "-")}.png`),
        fullPage: true,
      });
    }
  }

  const menu = page.getByRole("button", {
    name: "Navigation principale",
    exact: true,
  });
  if (await menu.isVisible()) {
    await menu.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(menu).toBeFocused();
  }
});

test("centers named dialogs and keeps every action reachable at small widths", async ({
  page,
}, testInfo) => {
  await page.goto("/auth/login");
  await expect(page.locator("html")).toHaveAttribute("data-nuxt-ready", "true");
  await page.getByLabel("Adresse e-mail").fill("admin.e2e@example.test");
  await page.locator("#password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/admin/users");
  await expect(page.locator("html")).toHaveAttribute("data-nuxt-ready", "true");
  for (const theme of ["dark", "light"]) {
    await page
      .getByRole("button", {
        name:
          theme === "dark" ? "Passer au thème sombre" : "Passer au thème clair",
        exact: true,
      })
      .click();
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 780 });
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
          ),
        )
        .toBeLessThanOrEqual(0);
      const trigger = page
        .getByRole("button", { name: "Consulter le détail", exact: true })
        .first();
      await trigger.click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toHaveAccessibleName(/\S/);
      await testInfo.attach(`dialog-${theme}-${width}`, {
        body: JSON.stringify(
          await page.evaluate(() => ({
            innerWidth,
            innerHeight,
            scrollX,
            scrollY,
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
            viewport: {
              width: visualViewport?.width,
              height: visualViewport?.height,
              scale: visualViewport?.scale,
              left: visualViewport?.offsetLeft,
            },
            dialog: document
              .querySelector("dialog[open]")
              ?.getBoundingClientRect()
              .toJSON(),
          })),
        ),
        contentType: "application/json",
      });
      await expect
        .poll(async () => {
          const box = await dialog.boundingBox();
          const viewportWidth = await page.evaluate(() => innerWidth);
          return box
            ? Math.abs(box.x + box.width / 2 - viewportWidth / 2)
            : Infinity;
        })
        .toBeLessThan(2);
      const bounds = await dialog.boundingBox();
      const viewport = await page.evaluate(() => ({
        width: innerWidth,
        height: innerHeight,
      }));
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(15);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
        viewport.width - 15,
      );
      expect(bounds!.y).toBeGreaterThanOrEqual(15);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
        viewport.height - 15,
      );
      await expect(dialog.locator("h2")).toBeFocused();
      expect(await dialog.evaluate((element) => element.scrollTop)).toBe(0);
      await expectTextContrast(dialog.locator("h2"), 3);
      await dialog.getByRole("button", { name: "Fermer", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
  }
});

test("hydrates a single system snapshot and still refreshes live metrics", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await expect(page.locator("html")).toHaveAttribute("data-nuxt-ready", "true");
  await page.getByLabel("Adresse e-mail").fill("admin.e2e@example.test");
  await page.locator("#password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  let clientRequests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/admin/system/status")) clientRequests++;
  });
  for (let i = 0; i < 3; i++) {
    await page.goto("/admin/system");
    await expect(page.locator("html")).toHaveAttribute(
      "data-nuxt-ready",
      "true",
    );
    await expect(
      page.getByRole("table", { name: "État détaillé des composants" }),
    ).toBeVisible();
  }
  expect(clientRequests).toBe(0);
  const refreshResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/admin/system/status") && response.ok(),
  );
  await page.getByRole("button", { name: "Actualiser", exact: true }).click();
  await refreshResponse;
  expect(clientRequests).toBe(1);
  await expect(page.locator(".status-message")).toContainText("État actualisé");
});

test("shows a branded 404 in both themes and returns home", async ({
  page,
}) => {
  for (const theme of ["dark", "light"]) {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute(
      "data-nuxt-ready",
      "true",
    );
    await page
      .getByRole("button", {
        name:
          theme === "dark" ? "Passer au thème sombre" : "Passer au thème clair",
        exact: true,
      })
      .click();
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    const response = await page.goto("/page-inexistante-test");
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    await expect(
      page.getByRole("heading", { name: "Page introuvable", exact: true }),
    ).toBeVisible();
    await expectTextContrast(page.locator("h1"), 3);
    await expectTextContrast(page.locator(".error-page .brand"), 3);
    await page
      .getByRole("button", { name: "Revenir à l’accueil", exact: true })
      .click();
    await expect(page).toHaveURL("/");
    await expect(page.locator("#hero-title")).toBeVisible();
  }
});
