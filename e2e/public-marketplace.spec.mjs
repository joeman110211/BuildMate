import { expect, test } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://staging.buildpair.co.uk';

async function searchAndCount(page, query) {
  await page.goto(`${baseURL}/directory`, { waitUntil: 'domcontentloaded' });
  const search = page.getByPlaceholder(/Try.*bathroom.*tiler.*boiler.*roof leak/i);
  await expect(search).toBeVisible({ timeout: 20_000 });
  await search.fill(query);
  const heading = page.getByText(/trade(s)? found/i).first();
  await expect(heading).toBeVisible();
  const text = await heading.innerText();
  const count = Number(text.match(/\d+/)?.[0] ?? 0);
  return count;
}

test('directory understands tiler, tile, tiling and bathroom as related searches', async ({ page }) => {
  for (const query of ['tiler', 'tile', 'tiling', 'bathroom']) {
    const count = await test.step(`search ${query}`, async () => searchAndCount(page, query));
    expect(count, `${query} should find at least one relevant trade`).toBeGreaterThan(0);
  }
});

test('public job cards open details and preserve job context when joining to quote', async ({ page }) => {
  await page.goto(`${baseURL}/jobs`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Latest job requests', { exact: true })).toBeVisible({ timeout: 20_000 });
  const realJoin = page.getByRole('button', { name: 'Join to quote' }).first();
  if (await realJoin.count()) {
    await realJoin.click();
    await page.waitForURL(/\/auth\/sign-up\?/, { timeout: 20_000 });
    const url = new URL(page.url());
    expect(url.searchParams.get('mode')).toBe('trader');
    expect(url.searchParams.get('jobId')).toBeTruthy();
    expect(url.searchParams.get('jobTitle')).toBeTruthy();
    return;
  }

  const preview = page.getByRole('button', { name: 'Example only' }).first();
  await expect(preview, 'When no real jobs exist, preview jobs should be clearly non-actionable').toBeDisabled();
});
