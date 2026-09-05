import { clerk } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

const customerEmail = process.env.E2E_CUSTOMER_EMAIL || 'customer@buildpair.test';
const traderEmail = process.env.E2E_TRADER_EMAIL || 'trader@buildpair.test';
const businessName = 'BuildPair E2E Tiling';

async function signIn(page, email) {
  await page.goto('/');
  await clerk.signIn({ page, emailAddress: email });
}

async function chooseMode(page, mode) {
  await page.goto(`/auth/choose-role?mode=${mode}`);
  await page.waitForURL(mode === 'customer' ? '**/customer/dashboard' : /\/trader\/(dashboard|onboarding)/, { timeout: 30_000 });
}

async function selectFormOption(page, label, value) {
  await page.getByRole('button', { name: new RegExp(`^${label}:`) }).click();
  await page.getByText(value, { exact: true }).last().click();
}

async function cardContaining(page, text, actionText) {
  const heading = page.getByText(text, { exact: true });
  await expect(heading).toBeVisible();
  return heading.locator(`xpath=ancestor::*[.//*[normalize-space()="${actionText}"]][1]`);
}

test('homeowner need → trader quote → agreement → message → completion → payment record → verified review', async ({ browser }) => {
  test.skip(process.env.E2E_ALLOW_MUTATIONS !== 'true', 'Set E2E_ALLOW_MUTATIONS=true only against an approved E2E/staging database.');

  const run = `${Date.now()}`;
  const jobTitle = `E2E bathroom floor ${run}`;
  const customerMessage = `E2E message ${run}: please confirm access before arrival.`;
  const reviewText = `E2E verified review ${run}: work completed and the agreed job record was clear.`;

  const traderContext = await browser.newContext();
  const customerContext = await browser.newContext();
  const trader = await traderContext.newPage();
  const customer = await customerContext.newPage();

  try {
    // 1. Prepare a real trader profile. Re-running the test updates the same dedicated test profile.
    await signIn(trader, traderEmail);
    await chooseMode(trader, 'trader');
    await trader.goto('/trader/onboarding');
    await expect(trader.getByText('Business Details', { exact: true }).first()).toBeVisible();
    await trader.getByLabel('Business or trading name').fill(businessName);
    await selectFormOption(trader, 'Primary trade', 'Tiling');
    const bathrooms = trader.getByRole('checkbox', { name: 'Bathrooms' });
    if ((await bathrooms.getAttribute('aria-checked')) !== 'true') await bathrooms.click();
    await trader.getByLabel('Base postcode').fill('TW18 4AA');
    await trader.getByRole('button', { name: 'Continue' }).click();
    await trader.getByLabel('Business bio').fill('BuildPair end-to-end test tradesperson specialising in domestic bathroom and floor tiling with clear written quotes.');
    await trader.getByRole('button', { name: 'Continue' }).click();
    await trader.getByRole('button', { name: 'Continue' }).click();
    const certification = trader.getByRole('checkbox', { name: /I confirm that the information/i });
    if ((await certification.getAttribute('aria-checked')) !== 'true') await certification.click();
    await trader.getByRole('button', { name: /publish profile/i }).click();
    await trader.waitForURL('**/trader/dashboard', { timeout: 30_000 });

    // 2. Homeowner finds the live test trader and sends a direct quote request.
    await signIn(customer, customerEmail);
    await chooseMode(customer, 'customer');
    await customer.goto('/directory');
    await customer.getByPlaceholder('What trade or skill do you need?').fill(businessName);
    await expect(customer.getByText(businessName, { exact: true })).toBeVisible();
    await customer.getByRole('button', { name: 'View Profile' }).click();
    await expect(customer.getByText(businessName, { exact: true }).first()).toBeVisible();
    await customer.getByRole('button', { name: 'Request a Quote' }).first().click();

    await selectFormOption(customer, 'Property type', 'House');
    await customer.getByRole('button', { name: 'Continue' }).click();
    await customer.getByLabel('Short job title').fill(jobTitle);
    await customer.getByLabel('Detailed job description').fill('Remove the existing damaged bathroom floor tiles, prepare the background and install replacement porcelain floor tiles. Access is through the front door and the room will be cleared.');
    await customer.getByRole('button', { name: 'Continue' }).click();
    await customer.getByRole('button', { name: 'Continue' }).click();
    await customer.getByLabel('Job postcode').fill('TW18 4AA');
    await selectFormOption(customer, 'Budget bracket', '£500–£1,500');
    await selectFormOption(customer, 'Urgency', 'Within 2 weeks');
    await customer.getByRole('button', { name: 'Continue' }).click();
    await expect(customer.getByText(jobTitle, { exact: true })).toBeVisible();
    await customer.getByRole('button', { name: 'Send Quote Request' }).click();
    await customer.waitForURL(/\/customer\/messages\//, { timeout: 30_000 });

    // 3. Communication is part of the loop, not an ornamental tab.
    await customer.getByPlaceholder('Write a message…').fill(customerMessage);
    await customer.getByRole('button', { name: 'Send message' }).click();
    await expect(customer.getByText(customerMessage, { exact: true })).toBeVisible();

    await trader.goto('/trader/messages');
    await expect(trader.getByText(customerMessage, { exact: true })).toBeVisible({ timeout: 15_000 });

    // 4. Trader opens the real direct lead and sends an itemised quote.
    await trader.goto('/trader/job-board');
    await trader.getByPlaceholder('Search jobs or locations').fill(jobTitle);
    const traderJobCard = await cardContaining(trader, jobTitle, 'Quote Direct Lead');
    await traderJobCard.getByRole('button', { name: 'Quote Direct Lead' }).click();
    await trader.getByLabel('Labour (£)').fill('650');
    await trader.getByLabel('Materials (£)').fill('150');
    await trader.getByLabel('Deposit requested (£)').fill('0');
    await trader.getByLabel('Notes / exclusions').fill('Customer to choose and supply the finished tile style before the agreed start date.');
    await trader.getByRole('button', { name: 'Send quote' }).click();
    await trader.waitForURL('**/trader/dashboard', { timeout: 30_000 });

    // 5. Homeowner compares and accepts the quote.
    await customer.goto('/customer/jobs');
    await customer.getByText('Getting Quotes', { exact: true }).click();
    const customerJobCard = await cardContaining(customer, jobTitle, 'Compare Quotes');
    await customerJobCard.getByRole('button', { name: 'Compare Quotes' }).click();
    await expect(customer.getByText(businessName, { exact: true })).toBeVisible();
    await customer.getByRole('button', { name: 'Accept Quote' }).click();
    await customer.waitForURL(/\/customer\/jobs\//, { timeout: 30_000 });
    const acceptedJobUrl = customer.url();
    await expect(customer.getByText(/in progress/i).first()).toBeVisible();

    // 6. Trader completes the work, homeowner records direct beta payment, then leaves a verified review.
    await trader.goto('/trader/my-jobs');
    await trader.getByText('Active', { exact: true }).click();
    const activeJobCard = await cardContaining(trader, jobTitle, 'Mark Work Complete');
    await activeJobCard.getByRole('button', { name: 'Mark Work Complete' }).click();
    await expect(trader.getByText(jobTitle, { exact: true })).toBeVisible({ timeout: 15_000 });

    await customer.goto(acceptedJobUrl);
    await expect(customer.getByText('completed', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    customer.once('dialog', async (dialog) => dialog.accept());
    await customer.getByRole('button', { name: 'Confirm paid outside BuildPair' }).click();
    await expect(customer.getByText('paid', { exact: true }).first()).toBeVisible({ timeout: 20_000 });

    await customer.getByLabel('What was the work and how did it go?').fill(reviewText);
    await customer.getByRole('button', { name: 'Publish verified review' }).click();
    await expect(customer.getByText('Review submitted ✓', { exact: true })).toBeVisible({ timeout: 15_000 });
  } finally {
    await traderContext.close();
    await customerContext.close();
  }
});
