/* BASTAU - Animation layer */
(() => {
  'use strict';

  const g = window.gsap;
  const ST = window.ScrollTrigger;
  const Split = window.SplitText;
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (g) g.registerPlugin(...[ST, Split].filter(Boolean));
  if (ST) ST.config({ ignoreMobileResize: true });

  const EASE_IN = 'expo.out';
  const EASE_OUT = 'power2.in';

  let viewCtx = null;
  let heroTl = null;
  const ambient = [];

  /* ------------------------- Global initialization ------------------- */
  function init() {
    const hdr = document.getElementById('hdr');
    const prog = document.getElementById('hdr-prog');

    const onScroll = () => {
      const y = window.scrollY || 0;
      if (hdr) hdr.classList.toggle('is-stuck', y > 8);
      if (prog) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        prog.style.width = (h > 240 ? Math.min(100, (y / h) * 100) : 0) + '%';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!g || reduced) { html.classList.remove('has-intro'); return; }
    blobs();
  }

  /* ---------------- Live gradient: blob drift & cursor follow ------- */
  function blobs() {
    const nodes = g.utils.toArray('.blob');
    if (!nodes.length) return;

    g.utils.toArray('.star').forEach((s, i) => {
      ambient.push(g.to(s, {
        yPercent: () => g.utils.random(-8, 8),
        xPercent: () => g.utils.random(-6, 6),
        rotate: () => g.utils.random(-8, 8),
        scale: () => g.utils.random(.94, 1.08),
        duration: () => g.utils.random(14, 22),
        ease: 'sine.inOut', repeat: -1, repeatRefresh: true, yoyo: true, delay: i * .8,
      }));
    });

    nodes.forEach((b, i) => {
      ambient.push(g.to(b, {
        xPercent: () => g.utils.random(-14, 14),
        yPercent: () => g.utils.random(-12, 12),
        scale: () => g.utils.random(.88, 1.2),
        duration: () => g.utils.random(10, 16),
        ease: 'sine.inOut', repeat: -1, repeatRefresh: true, yoyo: true, delay: i * .5,
      }));
    });

    if (finePointer) {
      const ax = g.quickTo('.aurora', 'x', { duration: 2.2, ease: 'power3' });
      const ay = g.quickTo('.aurora', 'y', { duration: 2.2, ease: 'power3' });
      window.addEventListener('pointermove', (e) => {
        ax((e.clientX / innerWidth - .5) * -50);
        ay((e.clientY / innerHeight - .5) * -50);
      }, { passive: true });
    }

    if (ST) ST.create({
      start: 0, end: 'max',
      onUpdate: (self) => ambient.forEach((t) => (self.scroll() < innerHeight * 1.2 ? t.resume() : t.pause())),
    });
  }

  /* --------------------------- Intro animation ------------------- */
  function startIntro() {
    const intro = document.getElementById('intro');
    const playHero = () => { if (heroTl) heroTl.play(); };

    if (!g || reduced || !html.classList.contains('has-intro') || !intro) {
      html.classList.remove('has-intro');
      if (intro) intro.remove();
      playHero();
      return;
    }
    try { sessionStorage.setItem('bastau-visited', '1'); } catch (e) { /* private mode */ }

    g.timeline()
      .from('.intro__logo', { y: 18, opacity: 0, scale: .96, duration: .7, ease: EASE_IN }, 0)
      .to('.intro__bar span', { scaleX: 1, duration: .85, ease: 'power2.inOut' }, .15)
      .to('.intro__in', { y: -18, opacity: 0, duration: .32, ease: EASE_OUT }, .95)
      .to(intro, { yPercent: -100, duration: .7, ease: 'expo.inOut' }, 1.05)
      .call(() => { html.classList.remove('has-intro'); intro.remove(); }, null, 1.5)
      .fromTo(['.hdr', '.view', '.ftr', '.tabbar'], { opacity: 0 }, { opacity: 1, duration: .5, ease: 'power2.out', clearProps: 'opacity' }, 1.2)
      .add(playHero, 1.25);
  }

  /* --------------------------- View transitions --------------------------- */
  function enterView(el) {
    if (!g || reduced || !el) return;
    g.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, ease: EASE_IN, clearProps: 'opacity,transform' });
  }

  function leaveView(el, done) {
    if (!g || reduced || !el) { done(); return; }
    g.to(el, { opacity: 0, y: -8, duration: .22, ease: EASE_OUT, onComplete: done });
  }

  function killView() {
    if (viewCtx) { viewCtx.kill(); viewCtx = null; }
    heroTl = null;
    if (ST) ST.getAll().forEach((t) => { if (t.vars && t.vars.id === 'view') t.kill(); });
  }

  /* ------------------ Scroll reveal elements -------------------- */
  function reveal(scope) {
    if (!g || !ST || reduced || !scope) return;
    const items = scope.querySelectorAll('[data-reveal]');
    if (items.length) {
      g.set(items, { opacity: 0, y: 34, rotateX: -6, transformPerspective: 1000, transformOrigin: '50% 0%' });
      ST.batch(items, {
        id: 'view', start: 'top 92%', once: true,
        onEnter: (batch) => g.to(batch, {
          opacity: 1, y: 0, rotateX: 0, duration: .9, stagger: .07, ease: EASE_IN, overwrite: true, clearProps: 'transform',
        }),
      });
    }
    headings(scope);
    ST.refresh();
  }

  /* ---------------- Headings mask animations ---------------- */
  function headings(scope) {
    if (!g || !ST || reduced || !scope) return;
    scope.querySelectorAll('.sec-hd h2').forEach((el) => {
      if (Split) {
        const s = Split.create(el, { type: 'lines', mask: 'lines' });
        g.from(s.lines, {
          yPercent: 115, duration: 1, stagger: .1, ease: EASE_IN,
          scrollTrigger: { id: 'view', trigger: el, start: 'top 90%', once: true },
        });
      } else {
        g.from(el, { y: 26, opacity: 0, duration: .8, ease: EASE_IN, scrollTrigger: { id: 'view', trigger: el, start: 'top 90%', once: true } });
      }
    });

    scope.querySelectorAll('.eyebrow:not([data-hero-eyebrow])').forEach((el) => g.from(el, {
      y: 12, opacity: 0, duration: .7, ease: EASE_IN,
      scrollTrigger: { id: 'view', trigger: el, start: 'top 94%', once: true },
    }));
  }

  /* ------------------------------- Hero section -------------------------------- */
  function hero(scope) {
    if (!g || reduced || !scope) return;
    const heroEl = scope.querySelector('.hero') || document.querySelector('.hero');
    if (!heroEl) return;

    const waiting = html.classList.contains('has-intro') && !!document.getElementById('intro');

    viewCtx = g.context(() => {
      const tl = g.timeline({ defaults: { ease: EASE_IN }, paused: waiting });

      const h1 = scope.querySelector('[data-h1]');
      if (Split && h1) {
        const s = Split.create(h1, { type: 'words', mask: 'words' });
        tl.from(s.words, { yPercent: 115, duration: 1, stagger: .04 }, .05);
      } else if (h1) {
        tl.from(h1.querySelectorAll('.w'), { opacity: 0, y: 26, duration: .7, stagger: .04 }, .05);
      }

      if (scope.querySelector('[data-hero-eyebrow]')) {
        tl.from('[data-hero-eyebrow]', { y: 14, opacity: 0, duration: .7 }, 0);
      }
      if (scope.querySelector('[data-hero-lead]')) {
        tl.from('[data-hero-lead]', { y: 20, opacity: 0, duration: .9 }, .45);
      }
      if (scope.querySelectorAll('[data-hero-cta] > *').length) {
        tl.from('[data-hero-cta] > *', { y: 22, opacity: 0, duration: .8, stagger: .08 }, .6);
      }
      if (scope.querySelectorAll('[data-hero-stat]').length) {
        tl.from('[data-hero-stat]', { y: 18, opacity: 0, duration: .8, stagger: .07 }, .75);
      }
      if (scope.querySelector('[data-hero-card]')) {
        tl.from('[data-hero-card]', { y: 60, opacity: 0, scale: .95, rotationX: 10, transformPerspective: 1200, duration: 1.3 }, .3);
      }

      heroTl = tl;

      if (ST) {
        const st = { id: 'view', trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true };
        const copy = scope.querySelector('.hero__in > div:first-child');
        if (copy) g.to(copy, { yPercent: -12, ease: 'none', scrollTrigger: st });
        if (scope.querySelector('[data-hero-card]')) {
          g.to('[data-hero-card]', { yPercent: -22, ease: 'none', scrollTrigger: st });
        }
      }

    }, scope);
  }

  /* ----------------- Journey path ------------------- */
  function journey(scope) {
    if (!scope) return;
    const root = scope.querySelector('[data-journey]');
    if (!root) return;
    const steps = Array.from(root.querySelectorAll('.jstep'));
    const fill = root.querySelector('.journey__fill');
    if (!g || !ST || reduced) {
      steps.forEach((s) => s.classList.add('is-on'));
      if (fill) fill.style.width = '100%';
      return;
    }

    g.timeline({
      scrollTrigger: {
        id: 'view', trigger: root, start: 'top 80%', end: 'bottom 60%', scrub: .5,
        onUpdate: (self) => {
          const active = Math.max(1, Math.round(self.progress * steps.length));
          steps.forEach((s, i) => s.classList.toggle('is-on', i < active));
        },
      },
    }).fromTo(fill, { width: '0%' }, { width: '100%', ease: 'none' });

    g.from(steps, {
      opacity: 0, y: 20, duration: .8, stagger: .1, ease: EASE_IN, clearProps: 'transform',
      scrollTrigger: { id: 'view', trigger: root, start: 'top 88%', once: true },
    });
  }

  /* ------------------------------ Counters ------------------------------ */
  function counters(scope) {
    if (!scope) return;
    const nodes = scope.querySelectorAll('[data-count]');
    if (!nodes.length) return;
    nodes.forEach((n) => {
      const to = Number(n.dataset.count) || 0;
      const suffix = n.dataset.suffix || '';
      if (!g || reduced) { n.textContent = to.toLocaleString('ru-RU') + suffix; return; }
      const o = { v: 0 };
      const visible = n.getBoundingClientRect().top < window.innerHeight * .95;
      g.to(o, {
        v: to, duration: 1.4, ease: 'power3.out', delay: visible ? .3 : 0,
        scrollTrigger: (!visible && ST) ? { id: 'view', trigger: n, start: 'top 95%', once: true } : undefined,
        onUpdate: () => { n.textContent = Math.round(o.v).toLocaleString('ru-RU') + suffix; },
      });
    });
  }

  /* ------------------------------- Overlays ------------------------------ */
  function openSheet(box, scrim) {
    if (!g || reduced || !box) return;
    if (scrim) g.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: .2 });
    g.fromTo(box, { y: 40, opacity: 0, scale: .98 }, { y: 0, opacity: 1, scale: 1, duration: .4, ease: EASE_IN });
  }
  function closeSheet(box, scrim, done) {
    if (!g || reduced || !box) { if (typeof done === 'function') done(); return; }
    if (scrim) g.to(scrim, { opacity: 0, duration: .18 });
    g.to(box, { y: 24, opacity: 0, duration: .2, ease: EASE_OUT, onComplete: () => { if (typeof done === 'function') done(); } });
  }
  function toastIn(el) {
    if (!g || reduced || !el) return;
    g.from(el, { y: 16, opacity: 0, duration: .34, ease: EASE_IN });
  }
  function toastOut(el, done) {
    if (!g || reduced || !el) { if (typeof done === 'function') done(); return; }
    g.to(el, { y: 10, opacity: 0, duration: .2, ease: EASE_OUT, onComplete: () => { if (typeof done === 'function') done(); } });
  }

  function refresh() { if (ST) ST.refresh(); }

  window.BastauMotion = {
    reduced, init, startIntro, enterView, leaveView, killView,
    reveal, hero, journey, counters,
    openSheet, closeSheet, toastIn, toastOut, refresh,
  };
})();