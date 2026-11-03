// Render the eight social cards to promo/export/*.png (1080 × 1920).
// Run: node render-cards.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'export');
mkdirSync(out, { recursive: true });

const NAMES = ['hero', 'the-ride', 'glass-house', 'breuer-house', 'codebreaker', 'upside-down-house', 'one-truckload', 'flip-book'];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(here, 'cards.html')).href);
await page.evaluate(() => window.cardsReady);
const cards = await page.$$('.card');
for (let i = 0; i < cards.length; i++) {
  const file = join(out, `${String(i + 1).padStart(2, '0')}-${NAMES[i]}.png`);
  await cards[i].screenshot({ path: file });
  console.log(file.replace(here + '/', ''));
}
await browser.close();
