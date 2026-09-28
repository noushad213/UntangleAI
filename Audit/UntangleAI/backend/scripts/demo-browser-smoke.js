const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const base = process.env.DEMO_URL || 'http://localhost:3001';
  try {
    await page.goto(base);
    await page.locator('#hero-civic-search-input').fill('birth certificate');
    await page.locator('#hero-query-submit-btn').click();
    await page.locator('#civic-municipality option[value="pune"]').waitFor({ state: 'attached' });
    assert.equal(await page.locator('#civic-municipality').inputValue(), '');
    await page.locator('#civic-municipality').selectOption('pune');
    console.log('PASS: missing location prompts without guessing a city');
    await page.route('**/api/v1/generate', (route) => route.fulfill({
      status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Service unavailable. Retry shortly.' } }),
    }));
    await page.locator('#hero-query-submit-btn').click();
    await page.getByText('Service unavailable. Retry shortly.', { exact: true }).waitFor();
    assert.equal(await page.locator('#hero-query-submit-btn').isEnabled(), true);
    await page.unroute('**/api/v1/generate');
    console.log('PASS: AI service failure leaves the form usable');
    await page.locator('#hero-civic-search-input').fill('property tax payment');
    await page.locator('#hero-query-submit-btn').click();
    await page.waitForURL('**/roadmap/*?generated=1&location=pune', { timeout: 100_000 });
    await page.locator('#roadmap-process-select').waitFor();
    console.log('PASS: live query opens a sourced cached roadmap');

    await page.goto(`${base}/roadmap/driving-license-delhi`);
    await page.locator('#roadmap-process-select').waitFor();
    await page.locator('#roadmap-process-select').selectOption('fssai-food-license');
    await page.waitForURL('**/roadmap/fssai-food-license');
    await page.waitForFunction(() => document.querySelector('#roadmap-process-select')?.value === 'fssai-food-license');
    await page.goBack();
    await page.waitForURL('**/roadmap/driving-license-delhi');
    await page.waitForFunction(() => document.querySelector('#roadmap-process-select')?.value === 'driving-license-delhi');
    console.log('PASS: roadmap switching and browser back show the correct process');
    await page.locator('#nav-search-btn').click();
    await page.waitForURL(base + '/');
    console.log('PASS: back to search');

    await page.goto(`${base}/roadmap/not-a-real-roadmap`);
    await page.getByRole('heading', { name: 'Roadmap not found' }).waitFor();
    await page.getByRole('link', { name: 'Browse roadmaps', exact: true }).click();
    await page.waitForURL('**/roadmap');
    console.log('PASS: invalid route recovery');

    if (process.env.DEMO_WORKFLOW_ID) {
      await page.goto(`${base}/roadmap/${process.env.DEMO_WORKFLOW_ID}`);
      await page.locator('#roadmap-process-select').waitFor();
      assert.equal(await page.locator('#roadmap-process-select').inputValue(), process.env.DEMO_WORKFLOW_ID);
      assert.equal(await page.locator('#filter-location-btn').isDisabled(), true);
      console.log('PASS: generated roadmap opens without a production crash');
    }

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${base}/roadmap/fssai-food-license`);
    await page.locator('#roadmap-process-select').waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Mobile page should fit the viewport');
    console.log('PASS: mobile roadmap fits viewport');
    assert.deepEqual(errors, []);
    console.log('PASS: no uncaught browser errors');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
