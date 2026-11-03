# Promo: social cards and page-turn video

Eight 9:16 cards (1080 × 1920) and a 35-second page-turn video, in the Monograph style.

- Edit the ride date and link in `cards.js` (`window.RIDE`), and card copy in `buildCards()`.
- `npm install` once, then:

```bash
node render-cards.mjs
node render-video.mjs
```

Output goes to `export/` (not committed). Rendering needs Google Chrome; the video also needs ffmpeg.
