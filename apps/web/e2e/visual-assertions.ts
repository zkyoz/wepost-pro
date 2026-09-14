import { expect, type Locator } from "@playwright/test";

// Explicit checks complement axe, which can leave gradient-backed text unchecked.
export async function expectTextContrast(locator: Locator, minimum = 4.5) {
  const ratio = await locator.evaluate((element) => {
    const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
    const luminance = (color: number[]) =>
      color.slice(0, 3).reduce((sum, channel, i) => {
        const value = channel / 255;
        return (
          sum +
          (value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4) *
            [0.2126, 0.7152, 0.0722][i]!
        );
      }, 0);
    let parent: Element | null = element;
    let background = [255, 255, 255];
    while (parent) {
      const candidate = rgb(getComputedStyle(parent).backgroundColor);
      if (candidate.length === 3 || candidate[3] === 1) {
        background = candidate;
        break;
      }
      parent = parent.parentElement;
    }
    const foreground = rgb(getComputedStyle(element).color);
    const a = luminance(foreground);
    const b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
  expect(
    ratio,
    `Text contrast for ${await locator.textContent()}`,
  ).toBeGreaterThanOrEqual(minimum);
}
