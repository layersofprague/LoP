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
  || location.pathname.endsWith('index.html');

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
  border-bottom: 1px solid var(--rule, #cbcec5);
  background: var(--paper, #eeefeb);
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
.lop-h-btn:hover { background: var(--paper-2, #e6e7e2); }
.lop-h-btn svg { width: 19px; height: 19px; }
.lop-h-btn .lop-h-dot {
  position: absolute; top: 8px; right: 8px;
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent, #b04020);
}
.lop-h-btn.logged-in { color: var(--ink, #1a1a18); }
.lop-h-profile-avatar {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--ink, #1a1a18); color: var(--paper, #eeefeb);
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
    <a class="lop-h-brand" href="${ROOT}index.html">
      <img class="lop-h-logo" src="${logoSrc}" alt="Layers of Prague"/>
    </a>
    <div class="lop-h-actions">
      <button class="lop-h-btn" id="lopHSearch" title="Hledat" style="display:none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      </button>
      <button class="lop-h-btn" id="lopHNotif" title="Notifikace">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
        <span class="lop-h-dot"></span>
      </button>
      <a class="lop-h-btn" href="${ROOT}oprojektu.html" title="O projektu / Nastavení">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          <line x1="12" y1="13" x2="12" y2="11"/>
          <line x1="12" y1="10" x2="12.01" y2="10"/>
        </svg>
      </a>
      <button class="lop-h-btn" id="lopHProfile" title="Profil"
              onclick="window.lopAuth ? window.lopAuth.open() : location.href='${loginHref}'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
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
      btn.onclick = () => {
        if (window.lopAuth) window.lopAuth.open('loggedIn');
        else location.href = ROOT + 'profil.html';
      };
    } else {
      btn.classList.remove('logged-in');
      btn.title = 'Přihlásit se';
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
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

/* ── Public API ── */
window.lopHeader = {
  refresh: _updateAuth
};

})();
