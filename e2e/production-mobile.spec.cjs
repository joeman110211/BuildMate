const { test, expect } = require('@playwright/test');

const baseUrl = (process.env.BASE_URL || 'https://buildmate-nine.vercel.app').replace(/\/$/, '');
const routes = ['/', '/auth/sign-in', '/auth/sign-up', '/directory', '/jobs'];
const viewports = [
  { name: 'small-android-320', width: 320, height: 568 },
  { name: 'android-360', width: 360, height: 640 },
  { name: 'pixel-class-393', width: 393, height: 852 },
];

for (const viewport of viewports) {
  test(`${viewport.name}: critical public routes fit without horizontal layout breakage`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const route of routes) {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
      expect(response, `${route} should return a navigation response`).not.toBeNull();
      expect(response.status(), `${route} returned ${response.status()}`).toBeLessThan(500);
      await page.waitForTimeout(300);

      const layout = await page.evaluate(() => {
        const viewportWidth = window.innerWidth;
        const documentWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0);
        const offenders = Array.from(document.querySelectorAll('body *'))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return {
              tag: element.tagName,
              text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              display: style.display,
              position: style.position,
            };
          })
          .filter((item) => item.width > 0 && item.display !== 'none' && item.right > viewportWidth + 3 && item.position !== 'fixed')
          .slice(0, 8);
        return { viewportWidth, documentWidth, offenders, title: document.title, text: document.body?.innerText || '' };
      });

      expect(
        layout.documentWidth,
        `${route} overflowed ${layout.viewportWidth}px viewport; offenders: ${JSON.stringify(layout.offenders)}`,
      ).toBeLessThanOrEqual(layout.viewportWidth + 3);
      expect(layout.text, `${route} still exposes old BuildMate branding`).not.toContain('BuildMate');
    }
  });
}

test('desktop critical routes still render after mobile hardening', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of routes) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(500);
  }
});
