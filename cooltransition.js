/*  transitions.js  —  sleek line-scan transition
    Drop one <script src="transitions.js"></script>
    into every page, just before </body>.
*/

(function () {

  const SCAN_DURATION  = 520;   /* ms — line sweeps across             */
  const HOLD           = 60;    /* ms — pause at peak before navigate  */

  /* Inject styles */
  const style = document.createElement('style');
  style.textContent = `
    #pt-overlay {
      position: fixed;
      inset: 0;
      background: #0a0a0a;
      opacity: 0;
      z-index: 99998;
      pointer-events: none;
    }
    #pt-line {
      position: fixed;
      top: 0;
      bottom: 0;
      width: 1px;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        #B09B9B 20%,
        #A78989 50%,
        #633B48 80%,
        transparent 100%
      );
      opacity: 0;
      z-index: 99999;
      pointer-events: none;
      left: -2px;
      box-shadow: 0 0 12px 2px rgba(167, 137, 137, 0.35),
                  0 0 32px 8px rgba(99, 59, 72, 0.18);
    }
  `;
  document.head.appendChild(style);

  /* Build elements */
  const overlay = document.createElement('div');
  overlay.id = 'pt-overlay';
  document.body.appendChild(overlay);

  const line = document.createElement('div');
  line.id = 'pt-line';
  document.body.appendChild(line);

  /* Easing — ease in-out cubic */
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* Core scan animation
     direction: 'in'  = line travels left→right, overlay fades IN  (exit)
     direction: 'out' = line travels left→right, overlay fades OUT (entry)
  */
  function scan(direction) {
    return new Promise(resolve => {
      const W = window.innerWidth;

      /* Starting state */
      line.style.left    = '-2px';
      line.style.opacity = '0';

      if (direction === 'in') {
        overlay.style.opacity = '0';
      } else {
        overlay.style.opacity = '1';
      }

      let startTs = null;

      function step(ts) {
        if (!startTs) startTs = ts;
        const elapsed  = ts - startTs;
        const raw      = Math.min(elapsed / SCAN_DURATION, 1);
        const eased    = easeInOut(raw);

        /* Line sweeps left to right */
        line.style.left    = (eased * (W + 4) - 2) + 'px';
        line.style.opacity = raw < 0.02 || raw > 0.98 ? '0' : '1';

        /* Overlay follows the line's leading edge */
        if (direction === 'in') {
          overlay.style.opacity = eased;
        } else {
          overlay.style.opacity = 1 - eased;
        }

        if (raw < 1) {
          requestAnimationFrame(step);
        } else {
          line.style.opacity    = '0';
          overlay.style.opacity = direction === 'in' ? '1' : '0';
          resolve();
        }
      }

      requestAnimationFrame(step);
    });
  }

  /* Page entry — overlay starts solid, line wipes it away */
  function playEntry() {
    overlay.style.opacity = '1';
    /* Wait one frame so the browser has painted the page first */
    requestAnimationFrame(() => requestAnimationFrame(() => scan('out')));
  }

  /* Page exit — line draws the overlay in, then we navigate */
  function playExit() {
    return scan('in').then(() => new Promise(r => setTimeout(r, HOLD)));
  }

  /* Intercept internal link clicks */
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    const isExternal = anchor.hostname && anchor.hostname !== location.hostname;
    const isNewTab   = anchor.target === '_blank';
    const isHash     = href.startsWith('#');
    const isSpecial  = href.startsWith('mailto:') || href.startsWith('tel:');

    if (isExternal || isNewTab || isHash || isSpecial) return;

    e.preventDefault();
    playExit().then(() => { window.location.href = href; });
  });

  /* Init on load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', playEntry);
  } else {
    playEntry();
  }

  /* Back / forward (bfcache) */
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      overlay.style.opacity = '1';
      requestAnimationFrame(() => requestAnimationFrame(() => scan('out')));
    }
  });

})();