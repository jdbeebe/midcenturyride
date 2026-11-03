// The eight social cards, shared by cards.html (stills) and video.html (page-turn video).
// Edit RIDE when the date and short link are set, then re-render.
window.RIDE = {
  date: 'Date to be announced',
  url: 'midcenturyride-production.up.railway.app/book',
};

window.buildCards = function () {
  const { esc, pad, bike, routeMap, images, isStop, route: R, stats } = MCR;
  const H = HOMES, S = stats(), find = (o) => H.find((h) => h.order === o);
  const img = (o, n = 0, focus) => {
    const im = images(find(o))[n];
    return `<figure class="photo"><img src="${esc(im.src)}" alt="" style="--kbo:${focus || '50% 55%'}"><figcaption class="credit">${esc(im.credit)}</figcaption></figure>`;
  };
  const foot = (n) => `<div class="foot"><span><b>Modern New Canaan</b> · Ridgefield Bicycle Club</span><span>${pad(n)} / 08</span></div>`;
  const where = (h) => `${isStop(h) ? 'Stop' : 'Ride by'} · Mile ${h.mile.toFixed(1)}`;

  const glass = find(12), breuer = find(25), gores = find(16), bremer = find(26), tech = find(3);

  // Bremer House: the "upside-down" volume lifted on thin pipe columns.
  const bremerDrawing = `<svg viewBox="0 0 1080 760" aria-hidden="true">
    <circle cx="820" cy="190" r="120" fill="#CF5127"/>
    <g fill="none" stroke="#1C1B18" stroke-width="6" stroke-linecap="square">
      <line x1="40" y1="640" x2="1040" y2="640" stroke-width="4"/>
      <rect x="140" y="300" width="800" height="170" fill="#F3EEE3"/>
      <rect x="170" y="330" width="420" height="96" fill="#B9C3BE"/>
      <line x1="240" y1="330" x2="240" y2="426"/><line x1="310" y1="330" x2="310" y2="426"/><line x1="380" y1="330" x2="380" y2="426"/><line x1="450" y1="330" x2="450" y2="426"/><line x1="520" y1="330" x2="520" y2="426"/>
      <rect x="640" y="330" width="270" height="96"/>
      <line x1="110" y1="300" x2="970" y2="300" stroke-width="10"/>
      <rect x="330" y="470" width="360" height="170" fill="#E4DCCB"/>
      <rect x="380" y="520" width="90" height="120" fill="#1C1B18"/>
      <line x1="200" y1="470" x2="200" y2="640" stroke-width="5"/><line x1="880" y1="470" x2="880" y2="640" stroke-width="5"/>
      <line x1="740" y1="470" x2="740" y2="640" stroke-width="5"/><line x1="280" y1="470" x2="280" y2="640" stroke-width="5"/>
    </g>
    <text x="140" y="270" font-family="Jost" font-size="22" letter-spacing="5" fill="#857F73">LIVING ABOVE</text>
    <text x="330" y="684" font-family="Jost" font-size="22" letter-spacing="5" fill="#857F73">SERVICE BELOW</text>
  </svg>`;

  return [
    // 1 · hero
    `<section class="card hero-card">
      <div class="topline"><span>Ridgefield Bicycle Club</span><span>New Canaan, CT</span></div>
      <div class="art">${bike()}<div class="sun"></div><div class="glass"></div><div class="slab"></div></div>
      <h1>Modern<em>New Canaan</em></h1>
      <p class="sub">A bicycle tour of ${S.count} mid-century modern houses, ${S.first}–${S.last}.</p>
      <div class="when"><span>${esc(RIDE.date)}</span><span>Hosted by Bill Adamsen</span></div>
      ${foot(1).replace('class="foot"', 'class="foot" style="color:#1C1B18"')}
    </section>`,

    // 2 · overview
    `<section class="card overview">
      <div class="eyebrow">The ride</div>
      <h2>One loop. <em>Twenty-six</em> houses.</h2>
      <div class="map">${routeMap({ labels: true, w: 400, h: 400, pad: 14 })}</div>
      <div class="stats">
        <div><b>${R.distanceMi.toFixed(1)}</b><span>Miles</span></div>
        <div><b>${R.gainFt}</b><span>Ft climb</span></div>
        <div><b>${S.stops}</b><span>Stops</span></div>
        <div><b>${S.count}</b><span>Houses</span></div>
      </div>
      <p class="line">From Irwin Park on Weed Street. Rolling, all paved, and full of glass, steel and fieldstone.</p>
      ${foot(2)}
    </section>`,

    // 3 · Glass House
    `<section class="card spot">
      ${img(12, 0, '45% 60%')}
      <div class="plate">No. ${pad(glass.order)}</div>
      <div class="locator">${routeMap({ cur: 12, w: 200, h: 250, pad: 14 })}</div>
      <div class="body">
        <div class="row"><div class="num">${pad(glass.order)}</div><span class="tag stop">${where(glass)}</span></div>
        <h2>${esc(glass.name)}</h2>
        <div class="who">${esc(glass.architect)} · ${glass.year}</div>
        <blockquote>Minimal structure, geometry, proportion, and the effects of transparency and reflection.</blockquote>
      </div>
      ${foot(3)}
    </section>`,

    // 4 · Breuer House 1
    `<section class="card spot">
      ${img(25, 0, '50% 45%')}
      <div class="plate">No. ${pad(breuer.order)}</div>
      <div class="locator">${routeMap({ cur: 25, w: 200, h: 250, pad: 14 })}</div>
      <div class="body">
        <div class="row"><div class="num">${pad(breuer.order)}</div><span class="tag stop">${where(breuer)}</span></div>
        <h2>${esc(breuer.name)}</h2>
        <div class="who">${esc(breuer.architect)} · ${breuer.year}</div>
        <blockquote>“The irresistible appeal of the cantilever.” <span style="font-style:normal;font-size:30px;color:#857F73;letter-spacing:.08em">Architectural Record, 1948</span></blockquote>
      </div>
      ${foot(4)}
    </section>`,

    // 5 · codebreaker
    `<section class="card code dark">
      ${img(16, 0, '50% 50%')}
      <div class="body">
        <span class="stamp">Top secret · Ultra</span>
        <h2>The architect who helped <em>break the code.</em></h2>
        <p>In the Second World War, Landis Gores served in Ultra, the operation that broke the German high command’s code.</p>
        <p>In 1948 he built one of New Canaan’s first modern houses. His family still owns it.</p>
        <div class="meta">No. ${pad(gores.order)} · ${esc(gores.name)} · ${where(gores)}</div>
      </div>
      ${foot(5)}
    </section>`,

    // 6 · upside-down house
    `<section class="card upside">
      <div class="eyebrow">No. ${pad(bremer.order)} · ${esc(bremer.name)} · ${bremer.year}</div>
      <div class="draw">${bremerDrawing}</div>
      <h2>The <em>upside-down</em> house.</h2>
      <p>Nina Bremer told Eliot Noyes his first plan wasn’t interesting. He was elated, tore it up, and lifted the house onto thin columns after Le Corbusier’s Villa Savoye.</p>
      <p>The Harvard Five often gathered here for parties.</p>
      <div class="meta"><span class="tag stop" style="font-size:22px">${where(bremer)}</span></div>
      ${foot(6)}
    </section>`,

    // 7 · one truckload
    `<section class="card truck">
      <div class="eyebrow">No. ${pad(tech.order)} · The Techbuilt House · ${tech.year}</div>
      <div class="big"><b>1</b><span>truckload</span><b>4</b><span>builders</span><b>2</b><span>days</span></div>
      <div class="frame">${img(3, 0, '50% 50%')}</div>
      <p>A prefabricated shell of wall, floor and roof panels arrived on a single truck. Four men could unload it, frame it and roof it in two days.</p>
      ${foot(7)}
    </section>`,

    // 8 · the microsite
    `<section class="card site dark">
      <div class="eyebrow">The guide</div>
      <h2>Turn the pages <em>before you ride.</em></h2>
      <div class="phone"><div class="screen">
        <div class="under">
          <div class="n">12</div><h3>Glass House</h3>
          <div class="m">Philip Johnson · 1948<br>842 Ponus Ridge · Mile 2.5</div>
          <p>The Glass House has been called the “signature work” of Philip Johnson. It was an important and influential project for Johnson and for modern architecture.</p>
        </div>
        <div class="leaf">${img(12, 1, '50% 50%')}</div>
        <div class="bar">12 · Glass House</div>
      </div></div>
      <p class="sub">All ${S.count} houses, the route map and turn-by-turn directions, in a flip book for your phone.</p>
      <div class="pill"><span>${esc(RIDE.url)}</span><i>→</i></div>
      ${foot(8)}
    </section>`,
  ];
};
