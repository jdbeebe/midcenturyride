/*
 * Flipbook: a stack of 3D leaves you can drag, tap, swipe or key through.
 *
 *   new Flipbook(el, {
 *     pages: [{ html, cls }],      // in reading order
 *     axis: 'x' | 'y',             // hinge on the left edge or the top edge
 *     spread: '(min-width: 960px)',// media query for two-page spreads ('not all' = never)
 *     verso: (leafIndex) => html,  // back of a leaf in single-page mode
 *     onChange: (book) => {},
 *   })
 *
 * In spread mode leaf j carries pages 2j (front) and 2j+1 (back), so the open
 * spread after turning k leaves is pages 2k-1 (left/top) and 2k (right/bottom).
 */
(function () {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  class Flipbook {
    constructor(el, opts) {
      this.el = el;
      this.o = Object.assign({
        axis: 'x', spread: 'not all', verso: () => '', onChange: () => {},
      }, opts);
      this.pages = opts.pages;
      this.page = 0;
      this.busy = false;
      this.mq = matchMedia(this.o.spread);
      this.mq.addEventListener('change', () => this.build());
      this.build();
      this.bind();
    }

    get n() { return this.leaves.length; }
    get x() { return this.o.axis === 'x'; }

    build() {
      const spread = (this.spread = this.mq.matches);
      const P = this.pages;
      this.el.classList.add('fb', 'fb-' + this.o.axis);
      this.el.classList.toggle('fb-spread', spread);
      this.el.innerHTML = '';
      this.stage = document.createElement('div');
      this.stage.className = 'fb-stage';
      this.el.append(this.stage);

      const pairs = [];
      if (spread) for (let i = 0; i < P.length; i += 2) pairs.push([P[i], P[i + 1], i, i + 1]);
      else P.forEach((p, i) => pairs.push([p, null, i, -1]));

      this.leaves = pairs.map(([f, b, fi, bi], j) => {
        const leaf = document.createElement('div');
        leaf.className = 'fb-leaf';
        leaf.append(this.face(f, 'fb-front', fi, j), this.face(b, 'fb-back', bi, j));
        this.stage.append(leaf);
        return leaf;
      });
      this.k = spread ? Math.ceil(this.page / 2) : this.page;
      this.layout();
    }

    face(p, cls, idx, j) {
      const d = document.createElement('div');
      d.className = 'fb-face ' + cls;
      if (p) {
        d.innerHTML = p.html;
        if (p.cls) d.classList.add(...p.cls.split(' '));
      } else {
        d.innerHTML = this.o.verso(j);
        d.classList.add('fb-verso');
      }
      d.dataset.page = idx;
      return d;
    }

    set(leaf, a) {
      leaf.style.setProperty('--a', a / 180);
      leaf.style.transform = this.x ? `rotateY(${-a}deg)` : `rotateX(${a}deg)`;
      leaf._a = a;
    }

    layout() {
      const { k, n } = this;
      this.leaves.forEach((l, j) => {
        const turned = j < k;
        this.set(l, turned ? 180 : 0);
        l.style.zIndex = turned ? j + 1 : n - j + 1;
        // Single pages: landed leaves sit off-page, so hide them until they are dragged back.
        l.classList.toggle('fb-far', this.spread ? (j < k - 2 || j > k + 1) : (j < k || j > k + 1));
        l.classList.remove('fb-lifted');
      });
      this.el.classList.toggle('fb-at-start', k === 0);
      this.el.classList.toggle('fb-at-end', k === n);
      this.page = this.spread ? Math.max(0, 2 * k - 1) : k;
      this.o.onChange(this);
    }

    lift(leaf) {
      leaf.style.zIndex = this.n + 5;
      leaf.classList.remove('fb-far');
      leaf.classList.add('fb-lifted');
    }

    // Animate leaf j to angle `to`; resolves once it lands.
    animate(j, to) {
      const leaf = this.leaves[j];
      const from = leaf._a ?? 0;
      this.busy = true;
      this.lift(leaf);
      leaf.style.setProperty('--fb-dur', (0.28 + 0.5 * Math.abs(to - from) / 180).toFixed(2) + 's');
      leaf.classList.add('fb-anim');
      requestAnimationFrame(() => this.set(leaf, to));
      const done = () => {
        leaf.classList.remove('fb-anim');
        this.busy = false;
        const was = this.k;
        this.k = to === 180 ? j + 1 : j;
        this.layout();
        if (this.k !== was && navigator.vibrate) navigator.vibrate(6);
        const q = this.queued; this.queued = 0;
        if (q > 0) this.next(); else if (q < 0) this.prev();
      };
      let fired = false;
      const once = (e) => {
        if (e && e.propertyName !== 'transform') return;
        if (fired) return;
        fired = true;
        leaf.removeEventListener('transitionend', once);
        done();
      };
      leaf.addEventListener('transitionend', once);
      setTimeout(once, 1200); // safety net if transitionend never fires
    }

    // Taps that land mid-turn are queued so quick tapping never feels ignored.
    next() { if (this.busy) { this.queued = 1; return; } if (this.k < this.n) this.animate(this.k, 180); }
    prev() { if (this.busy) { this.queued = -1; return; } if (this.k > 0) this.animate(this.k - 1, 0); }

    // Jump to the leaf state that shows logical page `p`.
    goTo(p) {
      const target = this.spread ? Math.ceil(p / 2) : p;
      if (target === this.k + 1) return this.next();
      if (target === this.k - 1) return this.prev();
      this.el.classList.add('fb-jump');
      this.k = clamp(target, 0, this.n);
      this.layout();
      requestAnimationFrame(() => this.el.classList.remove('fb-jump'));
    }

    bind() {
      let s = null;
      const pt = (e) => ({ x: e.clientX, y: e.clientY, t: performance.now() });
      const interactive = (t) => t.closest('a, button, input, select, textarea, [data-nodrag], [data-goto], [data-goto-house]');

      this.el.addEventListener('pointerdown', (e) => {
        if (this.busy || e.button > 0 || interactive(e.target)) return;
        s = { start: pt(e), last: pt(e), drag: null, id: e.pointerId };
      });

      this.el.addEventListener('pointermove', (e) => {
        if (!s || e.pointerId !== s.id) return;
        const p = pt(e);
        const d = this.x ? p.x - s.start.x : p.y - s.start.y;
        const cross = this.x ? p.y - s.start.y : p.x - s.start.x;
        if (!s.drag) {
          if (Math.abs(d) < 8 || Math.abs(d) < Math.abs(cross)) return;
          const fwd = d < 0;
          const j = fwd ? this.k : this.k - 1;
          if (j < 0 || j >= this.n) { s = null; return; }
          s.drag = { j, fwd, leaf: this.leaves[j] };
          this.lift(s.drag.leaf);
          try { this.el.setPointerCapture(e.pointerId); } catch (_) {}
        }
        const r = this.el.getBoundingClientRect();
        const size = (this.x ? r.width : r.height) / (this.spread ? 2 : 1);
        const prog = clamp(Math.abs(d) / (size * 0.85), 0, 1);
        const sign = s.drag.fwd ? d < 0 : d > 0;
        const p01 = sign ? prog : 0;
        this.set(s.drag.leaf, s.drag.fwd ? p01 * 180 : 180 - p01 * 180);
        s.prev = s.last; s.last = p;
        e.preventDefault();
      });

      const end = (e) => {
        if (!s || e.pointerId !== s.id) return;
        const st = s; s = null;
        if (st.drag) {
          const { j, fwd, leaf } = st.drag;
          const a = leaf._a;
          const prev = st.prev || st.start;
          const dt = Math.max(1, st.last.t - prev.t);
          const v = (this.x ? st.last.x - prev.x : st.last.y - prev.y) / dt; // px/ms
          const prog = fwd ? a / 180 : 1 - a / 180;
          const flick = fwd ? v < -0.45 : v > 0.45;
          const complete = e.type !== 'pointercancel' && (prog > 0.33 || flick);
          this.animate(j, fwd === complete ? 180 : 0);
          return;
        }
        if (e.type === 'pointercancel' || interactive(e.target)) return;
        const moved = Math.hypot(st.last.x - st.start.x, st.last.y - st.start.y);
        if (moved > 8) return;
        const r = this.el.getBoundingClientRect();
        const rel = this.x ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height;
        const [lo, hi] = this.spread ? [0.5, 0.5] : this.x ? [0.28, 0.62] : [0.22, 0.55];
        if (rel > hi) this.next();
        else if (rel < lo) this.prev();
      };
      this.el.addEventListener('pointerup', end);
      this.el.addEventListener('pointercancel', end);

      addEventListener('keydown', (e) => {
        if (e.target.closest && e.target.closest('input, textarea')) return;
        if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); this.next(); }
        if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); this.prev(); }
      });
    }
  }

  window.Flipbook = Flipbook;
})();
