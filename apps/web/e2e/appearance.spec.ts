import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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
