import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("public landing page", () => {
  test("renders server-side, exposes legal pages and sends the CTA to login", async ({
    page,
    request,
  }, testInfo) => {
    const response = await request.get("/");
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain("Planifiez, validez et publiez");

    await page.goto("/");
    await expect(page).toHaveTitle(
      /Publications sociales, de la préparation à la diffusion/,
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Planifiez, validez et publiez/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Se connecter" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Questions fréquentes" }),
    ).toBeVisible();

    const accessibility = await new AxeBuilder({ page })
      .include("#main-content")
      .analyze();
    expect(
      accessibility.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);

    const screenshotName =
      testInfo.project.name === "mobile-chromium"
        ? "landing-mobile.png"
        : "landing-desktop.png";
    await page.screenshot({
      path: `../../docs/evidence/task23/screenshots/${screenshotName}`,
      fullPage: true,
    });

    await page.getByRole("link", { name: "Mentions légales" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Mentions légales" }),
    ).toBeVisible();

    await page.goto("/");
    await page.getByRole("link", { name: "Se connecter" }).first().click();
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test("serves robots and sitemap without exposing private routes", async ({
    request,
  }) => {
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("Disallow: /admin/");

    const sitemap = await request.get("/sitemap.xml");
    const body = await sitemap.text();
    expect(body).toContain("<loc>http://localhost:3000/</loc>");
    expect(body).not.toContain("/dashboard</loc>");
  });

  test("reflows without horizontal loss at 320 CSS pixels", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  });
});
