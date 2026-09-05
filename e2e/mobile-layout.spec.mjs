import { expect, test } from '@playwright/test';

const routes = [
  ['/directory', /Find Trades/i],
  ['/jobs', /Jobs/i],
  ['/legal', /BuildPair legal & safety/i],
  ['/privacy', /Privacy notice/i],
  ['/terms', /Terms of use/i],
  ['/cookies', /Cookie and local-storage notice/i],
];

async function expectNoFurnitureRemovalChaos(page) {
  const metrics = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const rootWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body.scrollWidth;
    const offenders = [...document.querySelectorAll('button, a, input, textarea, [role="button"]')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          text: (element.textContent || element.getAttribute('aria-label') || '').trim().slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.width > 0 && (item.left < -2 || item.right > viewport + 2));
    return { viewport, rootWidth, bodyWidth, offenders };
  });

  expect(metrics.rootWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewport + 2);
  expect(metrics.bodyWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewport + 2);
  expect(metrics.offenders, JSON.stringify(metrics)).toEqual([]);
}

test.describe('small Android public layouts', () => {
  test.beforeEach(async ({ page }) => {
    // UI layout tests must run against the branch without needing production DB/service credentials.
    await page.route('**/api/traders**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/public/jobs**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  });

  for (const [route, heading] of routes) {
    test(`${route} fits the viewport`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByText(heading).first()).toBeVisible({ timeout: 20_000 });
      await expectNoFurnitureRemovalChaos(page);
    });
  }

  test('directory controls remain usable after filtering', async ({ page }) => {
    await page.goto('/directory');
    await expect(page.getByText('Find Trades', { exact: true })).toBeVisible();
    const search = page.getByPlaceholder('What trade or skill do you need?');
    await search.fill('Tiling');
    await expect(search).toHaveValue('Tiling');
    await expectNoFurnitureRemovalChaos(page);
  });
});
