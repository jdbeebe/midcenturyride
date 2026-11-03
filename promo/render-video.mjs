// Render the page-turn video to promo/export/modern-new-canaan.mp4 (1080 × 1920, 30 fps).
// Run: node render-video.mjs   (needs ffmpeg on PATH)
import { chromium } from 'playwright-core';
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const FPS = 30;
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'export');
const frames = join(out, 'frames');
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(here, 'video.html')).href);
await page.evaluate(() => window.videoReady);
const duration = await page.evaluate(() => window.DURATION);
const total = Math.round(duration * FPS);
console.log(`${duration.toFixed(1)} s, ${total} frames`);
for (let f = 0; f < total; f++) {
  await page.evaluate((t) => window.frame(t), f / FPS);
  await page.screenshot({ path: join(frames, `${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 94 });
  if (f % 150 === 0) console.log(`frame ${f}/${total}`);
}
await browser.close();

const mp4 = join(out, 'modern-new-canaan.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(frames, '%05d.jpg'),
  '-vf', 'fade=t=in:st=0:d=0.6,fade=t=out:st=' + (duration - 0.8).toFixed(2) + ':d=0.8,scale=in_range=full:out_range=tv,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
rmSync(frames, { recursive: true, force: true });
console.log(mp4.replace(here + '/', ''));
