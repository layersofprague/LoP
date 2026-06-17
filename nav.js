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
  if (path.includes('sbirky')) return 'sbirky';
  if (path.includes('trasy')) return 'routes';
  if (path.includes('login') || path.includes('profil')) return '';
  if (path.includes('place/') || path.includes('ar-intro') || path.includes('compass')) return '';
  if (path.endsWith('index.html') || path.endsWith('/')) return 'map';
  return '';
}

/* ── Auth check ── */
function _isLoggedIn() {
  try {
    const s = JSON.parse(localStorage.getItem('lop_auth_session') || 'null');
    return !!(s && s.access_token && s.user);
  } catch(e) { return false; }
}

/* ── Wishlist počet ── */
function _wishCount() {
  try {
    const w = JSON.parse(localStorage.getItem('lop_wishlist_v2') || '[]');
    if (!Array.isArray(w)) return 0;
    return new Set(w.map(String).filter(x => x && x !== 'undefined' && x !== 'null')).size;
  } catch(e) { return 0; }
}

/* ── CSS ── */
const CSS = `
#lop-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 90;
  display: flex;
  border-top: 1px solid var(--rule, #E8E8E6);
  background: var(--paper, #F8F8F6);
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
.lop-n-item:hover { color: var(--ink, #111111); }
.lop-n-item.active { color: var(--ink, #111111); }
.lop-n-item.active::before {
  content: ''; position: absolute; top: -1px; left: 50%;
  transform: translateX(-50%);
  width: 32px; height: 2px;
  background: var(--ink, #111111);
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
    border-left: 1px solid var(--rule, #E8E8E6);
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

@media (max-width: 819px) and (orientation: landscape) {
  #lop-nav {
    position: fixed;
    top: 0; bottom: 0; right: 0; left: auto;
    width: 64px;
    flex-direction: column;
    border-top: none;
    border-left: 1px solid var(--rule, #E8E8E6);
    padding-top: var(--header-h, 52px);
    padding-bottom: 14px;
    gap: 0;
    justify-content: flex-start;
  }
  .lop-n-item {
    flex: 0 0 auto;
    padding: 10px 4px;
  }
  .lop-n-label { font-size: 9px; }
  .lop-n-item.active::before {
    top: 50%; left: -1px;
    transform: translateY(-50%);
    width: 2px; height: 20px;
    bottom: auto;
  }
}

.lop-n-badge-lock {
  position: absolute; top: 6px; right: calc(50% - 18px);
  width: 14px; height: 14px;
  background: var(--accent, #b04020);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.lop-n-badge-lock::after {
  content: '';
  width: 8px; height: 8px;
  background: white;
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='11' rx='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></svg>") center/contain no-repeat;
          mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='11' rx='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></svg>") center/contain no-repeat;
}
.lop-n-item { position: relative; }
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
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 16V4"/></svg>`
    },
    {
      id: 'prehled',
      href: root + 'prehled.html',
      label: 'Přehled',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`
    },
    {
      id: 'routes',
      href: root + 'trasy.html',
      label: 'Trasy',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 5h6a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8h6"/></svg>`
    },
    {
      id: 'sbirky',
      href: root + 'sbirky.html',
      label: 'Sbírka',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3.5"/><circle cx="16" cy="8" r="3.5"/><circle cx="12" cy="16" r="3.5"/></svg>`
    },
    {
      id: 'wish',
      href: _isLoggedIn() ? root + 'prehled.html?filter=wished' : '#',
      onclick: _isLoggedIn() ? null : "if(window.lopAuth){event.preventDefault();window.lopAuth.open();}",
      label: 'Plán',
      badge: _isLoggedIn() ? wc : null,
      locked: !_isLoggedIn(),
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1 7.8 7.8 7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`
    }
  ];

  return items.map(item => `
    <a class="lop-n-item${item.id === active ? ' active' : ''}" href="${item.href}"${item.onclick ? ` onclick="${item.onclick}"` : ''}>
      ${item.svg}
      <span class="lop-n-label">${item.label}</span>
      ${item.badge ? `<span class="lop-n-badge${item.badge > 0 ? ' visible' : ''}">${item.badge}</span>` : ''}
      ${item.locked ? `<span class="lop-n-badge-lock"></span>` : ''}
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

  // Kompenzace fixed nav
  const setCompensation = () => {
    const app = document.getElementById('app');
    const isLandscapeMobile = window.innerWidth < 820 && window.innerWidth > window.innerHeight;
    if (window.innerWidth >= 820 || isLandscapeMobile) {
      const navW = window.innerWidth >= 820 ? 84 : 64;
      document.body.style.paddingBottom = '';
      document.body.style.paddingRight = navW + 'px';
      if (app) { app.style.paddingBottom = ''; app.style.paddingRight = navW + 'px'; }
    } else {
      document.body.style.paddingBottom = el.offsetHeight + 'px';
      document.body.style.paddingRight = '';
      if (app) { app.style.paddingBottom = el.offsetHeight + 'px'; app.style.paddingRight = ''; }
    }
  };
  requestAnimationFrame(setCompensation);
  window.addEventListener('resize', setCompensation);
}

/* ── Spuštění ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _inject);
} else {
  _inject();
}

/* ── Index.html inline nav ── */
function _buildIndex() {
  const el = document.getElementById('nav');
  if (!el) return;
  const wc = _wishCount();
  const loggedIn = _isLoggedIn();
  const items = [
    {
      id: 'map', label: 'Mapa', view: 'mapView',
      onclick: "switchView('mapView')",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 16V4"/></svg>'
    },
    {
      id: 'prehled', label: 'Přehled',
      onclick: "location.href='prehled.html'",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
    },
    {
      id: 'routes', label: 'Trasy',
      onclick: "location.href='trasy.html'",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 5h6a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8h6"/></svg>'
    },
    {
      id: 'sbirky', label: 'Sbírka',
      onclick: "location.href='sbirky.html'",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3.5"/><circle cx="16" cy="8" r="3.5"/><circle cx="12" cy="16" r="3.5"/></svg>'
    },
    {
      id: 'wish', label: 'Plán', view: 'wishView',
      onclick: loggedIn
        ? "location.href='prehled.html?filter=wished'"
        : "if(window.lopAuth){event.preventDefault();window.lopAuth.open();}else{location.href='login.html?return='+encodeURIComponent(location.href);}",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1 7.8 7.8 7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>'
    },
  ];
  el.innerHTML = items.map(item => {
    const isMap = item.id === 'map';
    return '<button class="nav-item' + (isMap ? ' active' : '') + '"'
      + (item.view ? ' data-view="' + item.view + '"' : '')
      + ' onclick="' + item.onclick + '">'
      + item.svg
      + '<span class="nav-label">' + item.label + '</span>'
      + (item.id === 'wish'
        ? '<span class="nav-badge" id="wishBadge" style="display:' + (loggedIn && wc > 0 ? 'block' : 'none') + '">' + wc + '</span>'
          + '<span class="nav-badge-lock" id="wishLock" style="display:' + (loggedIn ? 'none' : 'block') + '"></span>'
        : '')
      + '</button>';
  }).join('');
}

/* ── Public API ── */
window.lopNav = {
  refresh: _inject,
  buildIndex: _buildIndex,
  refreshIndex: _buildIndex,
};

})();
