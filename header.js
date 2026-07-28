/* ═══════════════════════════════════════════════════
   LayersOfPrague — header.js
   Sdílená hlavička pro všechny stránky
   Použití:
     <div id="lop-header"></div>
     <script src="header.js"></script>        (kořen)
     <script src="../header.js"></script>     (place/, ar/, atd.)
   ═══════════════════════════════════════════════════ */

(function() {

/* ── Detekce hloubky cesty ── */
const _depth = (location.pathname.match(/\//g) || []).length;
// GitHub Pages: /LoP/ = hloubka 1, /LoP/place/ = hloubka 2
const _isRoot = !location.pathname.split('/').filter(Boolean).slice(-1)[0]?.includes('.html')
  || location.pathname.endsWith('index.html') || location.pathname.endsWith('map.html');

function _root() {
  // Vrátí relativní cestu ke kořeni projektu
  const parts = location.pathname.split('/').filter(Boolean);
  // Najdi index souboru — vše za posledním segmentem je kořen
  const depth = parts.length - 1; // minus filename
  if (depth <= 1) return './'; // jsme v kořeni (/LoP/)
  return '../'.repeat(depth - 1);
}

const ROOT = _root();

/* ── CSS ── */
const CSS = `
#lop-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 18px 6px;
  border-bottom: 1px solid var(--rule, #E8E8E6);
  background: var(--paper, #F8F8F6);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.lop-h-brand {
  display: flex; align-items: center;
  text-decoration: none;
}
.lop-h-logo {
  height: 36px; width: auto;
  display: block; object-fit: contain;
  margin-top: -4px;
}
@media (min-width: 400px) {
  .lop-h-logo { height: 46px; margin-top: -8px; }
}
.lop-h-actions {
  display: flex; align-items: center; gap: 2px;
}
.lop-h-btn {
  appearance: none; background: transparent; border: none;
  width: 38px; height: 38px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: var(--ink-3, #6a6a64);
  transition: background .15s, color .15s;
  position: relative;
  text-decoration: none;
}
.lop-h-btn:hover { background: var(--paper-2, #F0F0EE); }
.lop-h-btn svg { width: 19px; height: 19px; }
.lop-h-btn .lop-h-dot {
  position: absolute; top: 8px; right: 8px;
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent, #b04020);
}
.lop-h-btn.logged-in { color: var(--ink, #111111); }
#lop-settings-menu {
  position: fixed;
  top: var(--header-h, 52px); right: 0;
  z-index: 510;
  min-width: 200px;
  background: var(--paper, #F8F8F6);
  border: 1px solid var(--rule, #E8E8E6);
  border-radius: 0 0 0 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,.10);
  padding: 8px 0;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-6px);
  transition: opacity .18s, transform .18s;
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
#lop-settings-menu.open {
  opacity: 1;
  pointer-events: all;
  transform: translateY(0);
}
.lop-sm-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px;
  font-size: 13.5px; color: var(--ink-2, #333331);
  text-decoration: none; cursor: pointer;
  background: transparent; border: none; width: 100%;
  text-align: left; font-family: inherit;
  transition: background .12s;
}
.lop-sm-item:hover { background: var(--paper-2, #F0F0EE); }
.lop-sm-item svg { width: 16px; height: 16px; flex-shrink: 0; color: var(--ink-3, #6a6a64); }
.lop-sm-divider { height: 1px; background: var(--rule, #E8E8E6); margin: 4px 0; }
.lop-sm-lang-row {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px 10px;
}
.lop-sm-lang-btn {
  flex: 1; padding: 6px 0; border-radius: 6px;
  font-size: 12px; font-weight: 600; letter-spacing: .04em;
  font-family: 'Inter', system-ui, sans-serif;
  border: 1px solid var(--rule, #E8E8E6);
  background: transparent; cursor: pointer;
  color: var(--ink-3, #6a6a64);
  transition: background .12s, color .12s, border-color .12s;
}
.lop-sm-lang-btn.active {
  background: var(--ink, #111111);
  color: var(--paper, #F8F8F6);
  border-color: var(--ink, #111111);
}
.lop-sm-label {
  font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--ink-4, #999994); padding: 6px 16px 2px;
  font-family: 'Inter', system-ui, sans-serif;
}

.lop-h-profile-avatar {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--ink, #111111); color: var(--paper, #F8F8F6);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Fraunces', serif; font-style: italic;
  font-size: 13px; font-weight: 500; line-height: 1;
  flex-shrink: 0;
}
`;

/* ── HTML ── */
function _html() {
  const logoSrc = ROOT + 'logo-tight.png';
  const loginHref = ROOT + 'login.html?return=' + encodeURIComponent(location.href);
  return `
    <a class="lop-h-brand" href="${ROOT}map.html">
      <img class="lop-h-logo" src="${logoSrc}" alt="Layers of Prague"/>
    </a>
    <div class="lop-h-actions">
      <button class="lop-h-btn" id="lopHSearch" title="Hledat" style="display:none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      </button>
      <button class="lop-h-btn" id="lopHNotif" title="Notifikace">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
        <span class="lop-h-dot"></span>
      </button>
      <button class="lop-h-btn" id="lopHSettings" title="Nastavení" onclick="window.lopSettings.toggle()">
        <svg viewBox="-38 -38 76 76" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px">
          <path d="M-5.43,-30.52 L-3.48,-35.83 L3.48,-35.83 L5.43,-30.52 L13.55,-27.88 L18.25,-31.03 L23.88,-26.94 L22.33,-21.50 L27.35,-14.59 L33.00,-14.38 L35.15,-7.76 L30.70,-4.27 L30.70,4.27 L35.15,7.76 L33.00,14.38 L27.35,14.59 L22.33,21.50 L23.88,26.94 L18.25,31.03 L13.55,27.88 L5.43,30.52 L3.48,35.83 L-3.48,35.83 L-5.43,30.52 L-13.55,27.88 L-18.25,31.03 L-23.88,26.94 L-22.33,21.50 L-27.35,14.59 L-33.00,14.38 L-35.15,7.76 L-30.70,4.27 L-30.70,-4.27 L-35.15,-7.76 L-33.00,-14.38 L-27.35,-14.59 L-22.33,-21.50 L-23.88,-26.94 L-18.25,-31.03 L-13.55,-27.88 Z"/>
          <circle cx="0" cy="0" r="22"/>
          <circle cx="0" cy="-8.4" r="1.7" fill="currentColor" stroke="none"/>
          <line x1="0" y1="-2.6" x2="0" y2="10.6"/>
        </svg>
      </button>
      <button class="lop-h-btn" id="lopHProfile" title="Profil"
              onclick="window.lopAuth ? window.lopAuth.open() : location.href='${loginHref}'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
      </button>
    </div>
  `;
}

/* ── Auth stav ── */
function _updateAuth() {
  try {
    const s = JSON.parse(localStorage.getItem('lop_auth_session') || 'null');
    const loggedIn = !!(s && s.access_token && s.user);
    const btn = document.getElementById('lopHProfile');
    if (!btn) return;
    if (loggedIn) {
      btn.classList.add('logged-in');
      btn.title = s.user.email || 'Profil';
      const initial = (s.user.email || '?')[0].toUpperCase();
      btn.innerHTML = `<span class="lop-h-profile-avatar">${initial}</span>`;
      btn.onclick = () => { location.href = ROOT + 'profile.html'; };
    } else {
      btn.classList.remove('logged-in');
      btn.title = 'Přihlásit se';
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
      btn.onclick = () => {
        if (window.lopAuth) window.lopAuth.open('signin');
        else location.href = ROOT + 'login.html?return=' + encodeURIComponent(location.href);
      };
    }
  } catch(e) {}
}

/* ── Inject ── */
function _inject() {
  const el = document.getElementById('lop-header');
  if (!el) return;

  // CSS
  if (!document.getElementById('lop-header-css')) {
    const style = document.createElement('style');
    style.id = 'lop-header-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // HTML
  el.innerHTML = _html();

  // Kompenzace fixed headeru — stránka si řídí offset sama
  requestAnimationFrame(() => {
    if (typeof adjustTopbarOffset === 'function') adjustTopbarOffset();
    else document.body.style.paddingTop = el.offsetHeight + 'px';
  });

  // Auth
  _updateAuth();
}

/* ── Spuštění ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _inject);
} else {
  _inject();
}



/* ── Settings menu ── */
function _injectSettingsMenu() {
  if (document.getElementById('lop-settings-menu')) return;
  const lang = window.lopLang || 'cs';
  const div = document.createElement('div');
  div.innerHTML = `
    <div id="lop-settings-menu" role="menu">
      <div class="lop-sm-label">Jazyk / Language</div>
      <div class="lop-sm-lang-row">
        <button class="lop-sm-lang-btn${lang === 'cs' ? ' active' : ''}" onclick="window.lopSetLang('cs')">CS</button>
        <button class="lop-sm-lang-btn${lang === 'en' ? ' active' : ''}" onclick="window.lopSetLang('en')">EN</button>
      </div>
      <div class="lop-sm-divider"></div>
      <a class="lop-sm-item" href="${ROOT}oprojektu.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        ${window.lopLang === 'en' ? 'About the project' : 'O projektu'}
      </a>
    </div>
  `;
  document.body.appendChild(div.firstElementChild);

  // Close on outside click
  document.addEventListener('click', e => {
    const menu = document.getElementById('lop-settings-menu');
    const btn  = document.getElementById('lopHSettings');
    if (menu && !menu.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
      menu.classList.remove('open');
    }
  }, true);
}

window.lopSettings = {
  toggle() {
    _injectSettingsMenu();
    const menu = document.getElementById('lop-settings-menu');
    if (menu) menu.classList.toggle('open');
  }
};
/* ── Public API ── */
window.lopHeader = {
  refresh: _updateAuth
};

window._lopToggleLang = function() {
  const next = (window.lopLang === 'cs') ? 'en' : 'cs';
  window.lopSetLang ? window.lopSetLang(next) : (localStorage.setItem('lop_lang', next), location.reload());
};

})();
