/* ═══════════════════════════════════════════════════
   LayersOfPrague — nav.js
   Sdílená navigace pro všechny stránky mimo index.html
   Použití:
     <div id="lop-nav"></div>
     <script src="nav.js"></script>
     <script src="../nav.js"></script>
   ═══════════════════════════════════════════════════ */

(function() {

function _root() {
  const parts = location.pathname.split('/').filter(Boolean);
  const depth = parts.length - 1;
  if (depth <= 1) return './';
  return '../'.repeat(depth - 1);
}

const ROOT = _root();

/* ── Detekce aktivní sekce ── */
function _activePage() {
  const path = location.pathname;
  if (path.includes('prehled')) return 'prehled';
  if (path.includes('trasy')) return 'routes';
  if (path.includes('login') || path.includes('profil')) return '';
  if (path.includes('place/') || path.includes('ar-intro') || path.includes('compass')) return '';
  if (path.endsWith('index.html') || path.endsWith('/')) return 'map';
  return '';
}

/* ── Wishlist počet ── */
function _wishCount() {
  try {
    const w = JSON.parse(localStorage.getItem('lop_wishlist_v2') || '[]');
    if (!Array.isArray(w)) return 0;
    return new Set(w.map(String).filter(x => x && x !== 'undefined' && x !== 'null' && /^H\d+$/.test(x))).size;
  } catch(e) { return 0; }
}

/* ── CSS ── */
const CSS = `
#lop-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 90;
  display: flex;
  border-top: 1px solid var(--rule, #cbcec5);
  background: var(--paper, #eeefeb);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.lop-n-item {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  padding: 9px 4px 10px;
  cursor: pointer;
  border: none; background: transparent;
  position: relative;
  color: var(--ink-3, #6a6a64);
  transition: color .15s;
  text-decoration: none;
  font-family: inherit;
}
.lop-n-item:hover { color: var(--ink, #1a1a18); }
.lop-n-item.active { color: var(--ink, #1a1a18); }
.lop-n-item.active::before {
  content: ''; position: absolute; top: -1px; left: 50%;
  transform: translateX(-50%);
  width: 32px; height: 2px;
  background: var(--ink, #1a1a18);
}
.lop-n-item svg { width: 20px; height: 20px; display: block; }
.lop-n-label {
  font-size: 10px; font-weight: 500;
  letter-spacing: .01em;
}
.lop-n-badge {
  position: absolute; top: 6px; right: calc(50% - 18px);
  min-width: 14px; height: 14px; padding: 0 3px;
  border-radius: 7px;
  background: var(--accent, #b04020); color: #fff;
  font-size: 9px; font-weight: 600; line-height: 14px; text-align: center;
  display: none;
}
.lop-n-badge.visible { display: block; }

@media (min-width: 820px) {
  #lop-nav {
    position: fixed;
    top: 0; bottom: 0; right: 0; left: auto;
    width: 84px;
    flex-direction: column;
    border-top: none;
    border-left: 1px solid var(--rule, #cbcec5);
    padding-top: 74px;
    padding-bottom: 14px;
    gap: 2px;
    justify-content: flex-start;
  }
  .lop-n-item {
    flex: 0 0 auto;
    padding: 14px 4px;
  }
  .lop-n-item.active::before {
    top: 50%; left: -1px;
    transform: translateY(-50%);
    width: 2px; height: 24px;
  }
}
`;

/* ── HTML ── */
function _html() {
  const active = _activePage();
  const wc = _wishCount();
  const root = ROOT;

  const items = [
    {
      id: 'map',
      href: root + 'index.html',
      label: 'Mapa',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 16V4"/></svg>`
    },
    {
      id: 'prehled',
      href: root + 'prehled.html',
      label: 'Přehled',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`
    },
    {
      id: 'routes',
      href: root + 'trasy.html',
      label: 'Trasy',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 5h6a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8h6"/></svg>`
    },
    {
      id: 'wish',
      href: root + 'prehled.html?filter=wished',
      label: 'Plán',
      badge: wc,
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1 7.8 7.8 7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`
    }
  ];

  return items.map(item => `
    <a class="lop-n-item${item.id === active ? ' active' : ''}" href="${item.href}">
      ${item.svg}
      <span class="lop-n-label">${item.label}</span>
      ${item.badge ? `<span class="lop-n-badge${item.badge > 0 ? ' visible' : ''}">${item.badge}</span>` : ''}
    </a>
  `).join('');
}

/* ── Inject ── */
function _inject() {
  const el = document.getElementById('lop-nav');
  if (!el) return;

  // CSS
  if (!document.getElementById('lop-nav-css')) {
    const style = document.createElement('style');
    style.id = 'lop-nav-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // HTML
  el.innerHTML = _html();

  // Kompenzace fixed nav — přidej padding-bottom na body (mobil)
  // Na PC nav je vpravo, body padding-right
  requestAnimationFrame(() => {
    if (window.innerWidth < 820) {
      document.body.style.paddingBottom = el.offsetHeight + 'px';
    } else {
      document.body.style.paddingRight = '84px';
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth < 820) {
      document.body.style.paddingBottom = el.offsetHeight + 'px';
      document.body.style.paddingRight = '';
    } else {
      document.body.style.paddingBottom = '';
      document.body.style.paddingRight = '84px';
    }
  });
}

/* ── Spuštění ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _inject);
} else {
  _inject();
}

/* ── Public API ── */
window.lopNav = {
  refresh: _inject
};

})();
