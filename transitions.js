/* ─────────────────────────────────────────────
   transitions.js  —  page-wipe animation
   Drop one <script src="transitions.js"></script>
   into every page, just before </body>.
───────────────────────────────────────────── */
 
(function () {
 
  /* ── Palette strips (order = left → right) ── */
  const COLORS = ['#5E4545', '#633B48', '#A78989', '#B09B9B', '#c9b5b5'];
  const DURATION = 120;   /* ms per strip stagger          */
  const HOLD     = 80;    /* ms all strips stay fully in   */
  const EASE_IN  = 'cubic-bezier(0.76, 0, 0.24, 1)';
  const EASE_OUT = 'cubic-bezier(0.76, 0, 0.24, 1)';
 
  /* ── Inject styles once ── */
  const style = document.createElement('style');
  style.textContent = `
    .pt-strip {
      position: fixed;
      top: 0; bottom: 0;
      width: calc(100% / ${COLORS.length} + 2px); /* +2px closes sub-pixel gaps */
      transform: translateY(-102%);
      z-index: 99999;
      pointer-events: none;
      will-change: transform;
    }
  `;
  document.head.appendChild(style);
 
  /* ── Build strips ── */
  const strips = COLORS.map((color, i) => {
    const el = document.createElement('div');
    el.className = 'pt-strip';
    el.style.background = color;
    el.style.left = `calc(${i} * 100% / ${COLORS.length})`;
    document.body.appendChild(el);
    return el;
  });
 
  /* ── Animate strips IN (slide down from top) ── */
  function wipeIn() {
    return new Promise(resolve => {
      strips.forEach((strip, i) => {
        strip.style.transition = 'none';
        strip.style.transform  = 'translateY(-102%)';
      });
 
      /* force reflow */
      strips[0].getBoundingClientRect();
 
      strips.forEach((strip, i) => {
        strip.style.transition = `transform ${350}ms ${EASE_IN} ${i * DURATION}ms`;
        strip.style.transform  = 'translateY(0%)';
      });
 
      /* resolve after last strip finishes coming in + hold */
      const totalIn = 350 + (COLORS.length - 1) * DURATION + HOLD;
      setTimeout(resolve, totalIn);
    });
  }
 
  /* ── Animate strips OUT (slide down off bottom) ── */
  function wipeOut() {
    return new Promise(resolve => {
      strips.forEach((strip, i) => {
        strip.style.transition = `transform ${350}ms ${EASE_OUT} ${i * DURATION}ms`;
        strip.style.transform  = 'translateY(102%)';
      });
 
      const totalOut = 350 + (COLORS.length - 1) * DURATION;
      setTimeout(resolve, totalOut);
    });
  }
 
  /* ── Entry animation (wipe OUT on load) ── */
  function playEntry() {
    /* Start strips fully covering the screen */
    strips.forEach(strip => {
      strip.style.transition = 'none';
      strip.style.transform  = 'translateY(0%)';
    });
 
    /* tiny delay so the page content is painted before we reveal it */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      wipeOut();
    }));
  }
 
  /* ── Intercept internal link clicks ── */
  function handleLinkClick(e) {
    const anchor = e.target.closest('a');
    if (!anchor) return;
 
    const href = anchor.getAttribute('href');
    if (!href) return;
 
    /* Skip: external, new-tab, hash-only, mailto/tel */
    const isExternal   = anchor.hostname && anchor.hostname !== location.hostname;
    const isNewTab     = anchor.target === '_blank';
    const isHash       = href.startsWith('#');
    const isSpecial    = href.startsWith('mailto:') || href.startsWith('tel:');
 
    if (isExternal || isNewTab || isHash || isSpecial) return;
 
    e.preventDefault();
 
    wipeIn().then(() => {
      window.location.href = href;
    });
  }
 
  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    playEntry();
    document.addEventListener('click', handleLinkClick);
  });
 
  /* ── Handle back/forward navigation ── */
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      /* Page restored from bfcache — reset strips and wipe out */
      strips.forEach(strip => {
        strip.style.transition = 'none';
        strip.style.transform  = 'translateY(0%)';
      });
      requestAnimationFrame(() => requestAnimationFrame(() => wipeOut()));
    }
  });
 
})();