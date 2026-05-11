import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];

page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') {
    errors.push({ type: msg.type(), text: msg.text() });
  }
});

page.on('pageerror', (err) => {
  errors.push({ type: 'pageerror', text: err.message });
});

page.on('requestfailed', (req) => {
  errors.push({ type: 'requestfailed', text: `${req.url()} ${req.failure()?.errorText}` });
});

await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
console.log('page title:', await page.title());
console.log('errors count:', errors.length);
for (const err of errors) console.log(`${err.type}: ${err.text}`);
await browser.close();
