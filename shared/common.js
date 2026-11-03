// Shared helpers for every direction. Expects window.HOMES and, optionally, window.HOME_IMAGES.
(function () {
  const ROOT = window.MCR_ROOT || '';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');

  const images = (h) => ((window.HOME_IMAGES || {})[h.order] || []).map((im) => ({ ...im, src: ROOT + im.src }));

  // First sentence or two, trimmed to roughly `max` characters.
  function excerpt(text, max = 220) {
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.” '));
    return (end > max * 0.45 ? cut.slice(0, end + 1) : cut.slice(0, cut.lastIndexOf(' ')) + '…');
  }

  // Line drawing of a modern house, used when a home has no photograph yet.
  const FORMS = { 3: 'gable', 7: 'shed', 6: 'stilt', 25: 'cantilever', 26: 'cantilever', 12: 'glass', 13: 'stilt', 14: 'court', 21: 'court' };
  function drawing(h) {
    const kind = FORMS[h.order] || ['flat', 'court', 'glass', 'shed', 'flat'][h.order % 5];
    const mull = (x0, x1, y0, y1, step) => {
      let s = '';
      for (let x = x0 + step; x < x1; x += step) s += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`;
      return s;
    };
    let body = '';
    switch (kind) {
      case 'gable':
        body = `<path d="M110 230 V150 L200 80 L290 150 V230 Z" class="ph-fill"/><path d="M150 230 V160 L200 120 L250 160 V230" class="ph-glass"/>${mull(150, 250, 140, 230, 25)}<path d="M96 160 L200 72 L304 160"/>`;
        break;
      case 'shed':
        body = `<path d="M90 230 V170 L310 120 V230 Z" class="ph-fill"/><rect x="200" y="150" width="90" height="80" class="ph-glass"/>${mull(200, 290, 150, 230, 30)}<path d="M76 172 L324 116"/>`;
        break;
      case 'cantilever':
        body = `<rect x="150" y="190" width="90" height="40" class="ph-fill"/><rect x="80" y="130" width="250" height="60" class="ph-fill"/><rect x="100" y="140" width="210" height="34" class="ph-glass"/>${mull(100, 310, 140, 174, 30)}<line x1="320" y1="190" x2="320" y2="230"/><line x1="68" y1="130" x2="342" y2="130"/>`;
        break;
      case 'stilt':
        body = `<rect x="110" y="110" width="190" height="70" class="ph-fill"/><rect x="124" y="122" width="162" height="46" class="ph-glass"/>${mull(124, 286, 122, 168, 27)}${[125, 165, 245, 285].map((x) => `<line x1="${x}" y1="180" x2="${x}" y2="${x < 200 ? 230 : 214}"/>`).join('')}<line x1="96" y1="110" x2="314" y2="110"/><path d="M60 230 L230 230 L340 214" class="ph-ground"/>`;
        break;
      case 'court':
        body = `<rect x="70" y="160" width="110" height="70" class="ph-fill"/><rect x="230" y="160" width="100" height="70" class="ph-fill"/><rect x="180" y="185" width="50" height="45" class="ph-glass"/><rect x="84" y="172" width="82" height="58" class="ph-glass"/>${mull(84, 166, 172, 230, 27)}<line x1="56" y1="160" x2="344" y2="160"/>`;
        break;
      case 'glass':
        body = `<rect x="110" y="150" width="180" height="80" class="ph-glass"/>${mull(110, 290, 150, 230, 45)}<rect x="185" y="175" width="30" height="55" class="ph-fill ph-core"/><line x1="104" y1="150" x2="296" y2="150"/><line x1="104" y1="230" x2="296" y2="230"/>`;
        break;
      default:
        body = `<rect x="80" y="160" width="240" height="70" class="ph-fill"/><rect x="150" y="170" width="150" height="60" class="ph-glass"/>${mull(150, 300, 170, 230, 30)}<rect x="96" y="172" width="34" height="58" class="ph-solid"/><line x1="64" y1="160" x2="336" y2="160"/>`;
    }
    return `<svg class="ph" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Drawing of ${esc(h.name)}">
      <circle cx="${300 - (h.order * 37) % 200}" cy="82" r="34" class="ph-sun"/>
      <g class="ph-line">${body}<line x1="30" y1="230" x2="370" y2="230" class="ph-ground"/></g>
    </svg>`;
  }

  // A photo (with credit) or the drawing fallback.
  function hero(h, cls = '') {
    const im = images(h)[0];
    if (!im) return `<figure class="hero hero-drawn ${cls}">${drawing(h)}<figcaption class="credit">Photograph to come</figcaption></figure>`;
    return `<figure class="hero ${cls}"><img src="${esc(im.src)}" alt="${esc(h.name)}, ${esc(h.address)}" loading="lazy" draggable="false" style="object-position:${esc(im.focus || '50% 50%')}"><figcaption class="credit">${esc(im.credit || '')}</figcaption></figure>`;
  }

  // Bicycle mark built from two circles and a frame triangle.
  const bike = (cls = '') => `<svg class="bike ${cls}" viewBox="0 0 120 70" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><circle cx="26" cy="46" r="20"/><circle cx="94" cy="46" r="20"/><path d="M26 46 L50 18 L82 18 L94 46 M50 18 L60 46 L26 46 M60 46 L82 18 M46 10 H58 M82 18 L78 8 H88"/></g></svg>`;

  const stats = () => {
    const H = window.HOMES;
    const yrs = H.map((h) => h.year);
    return {
      count: H.length,
      stops: H.filter((h) => /stop/i.test(h.visit)).length,
      first: Math.min(...yrs), last: Math.max(...yrs),
      architects: new Set(H.map((h) => h.architect.replace(/\s+/g, ' ').trim())).size,
    };
  };

  const isStop = (h) => /stop/i.test(h.visit);

  window.MCR = { esc, pad, images, excerpt, drawing, hero, bike, stats, isStop };
})();
