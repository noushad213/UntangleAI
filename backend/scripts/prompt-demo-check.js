const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const cases = [
  ['help', 'pune'],
  ['certificate', 'pune'],
  ['birth certificate', 'pune'],
  ['My child was born in Pune last week. How do I register the birth and get a birth certificate? What documents and fees are needed?', 'pune'],
  ['tax', 'pune'],
  ['property tax payment', 'pune'],
  ['I own a residential flat in Pune and have my property assessment number. How do I pay my property tax online and download the receipt?', 'pune'],
  ['garbage complaint', 'pune'],
  ['Garbage has not been collected on my street in Pune for five days. How do I complain and track the complaint?', 'pune'],
  ['water connection', 'pune'],
  ['I need a new municipal water connection for a house in Pune. I am the owner. Explain the documents, application steps, fees and office to visit.', 'pune'],
  ['I want to open a restaurant', 'pune'],
  ['How do I renew my driving licence in Pune? It expires next month.', 'pune'],
  ['मुझे पुणे में प्रॉपर्टी टैक्स भरना है। ऑनलाइन भुगतान कैसे करूँ?', 'pune'],
  ['I live in Mumbai and need a birth certificate for my child. What is the application process?', 'mumbai'],
];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [];
  let next = 0;
  const output = path.resolve(__dirname, '../../', process.env.PROMPT_RESULTS_FILE || 'demo-prompt-results.json');
  async function worker() {
    while (next < cases.length) {
      const index = next++;
      const [prompt, city] = cases[index];
      const context = await browser.newContext();
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const result = { number: index + 1, prompt, city };
      const started = Date.now();
      try {
        await page.goto('http://localhost:3002/');
        await page.locator('#hero-civic-search-input').fill(prompt);
        await page.waitForTimeout(500);
        result.suggestions = await page.locator('[role="option"]').allTextContents();
        await page.locator('#hero-query-submit-btn').click();
        if (await page.locator('#civic-prompt-alert').isVisible()) {
          result.outcome = 'clarification';
          result.message = await page.locator('#civic-prompt-alert').innerText();
          result.canRetry = await page.locator('#hero-query-submit-btn').isEnabled();
          continue;
        }
        await page.locator('#civic-municipality option').filter({ hasText: city === 'pune' ? 'Pune' : 'Mumbai' }).waitFor({ state: 'attached' });
        result.locationPrompted = await page.locator('#civic-municipality').inputValue() === '';
        await page.locator('#civic-municipality').selectOption(city);
        const responsePromise = page.waitForResponse((response) => response.url().endsWith('/api/v1/generate'), { timeout: 100_000 });
        await page.locator('#hero-query-submit-btn').click();
        const response = await responsePromise;
        result.status = response.status();
        const payload = await response.json();
        if (response.ok() && payload.workflow?.id) {
          await page.waitForURL('**/roadmap/**', { timeout: 20_000 });
          await page.locator('#roadmap-process-select').waitFor();
          result.outcome = 'roadmap';
          result.title = payload.workflow.title;
          result.issue = payload.classification?.issueKey;
          result.fromCache = payload.fromCache;
          result.steps = payload.workflow.nodes?.length;
          result.url = page.url();
        } else {
          result.outcome = 'error';
          result.code = payload.error?.code;
          result.message = payload.error?.message;
          await page.locator('#hero-query-submit-btn:not([disabled])').waitFor();
          result.canRetry = true;
        }
      } catch (error) {
        result.outcome = 'test-failure';
        result.message = error.message.slice(0, 500);
      } finally {
        result.seconds = Math.round((Date.now() - started) / 1000);
        result.browserErrors = errors;
        results.push(result);
        results.sort((a, b) => a.number - b.number);
        fs.writeFileSync(output, JSON.stringify(results, null, 2));
        console.log(JSON.stringify(result));
        await context.close();
      }
    }
  }
  try { await Promise.all([worker(), worker(), worker()]); }
  finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
