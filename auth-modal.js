/* ═══════════════════════════════════════════════════
   LayersOfPrague — auth-modal.js
   Sdílený auth modal (přihlášení / registrace / reset)
   Nahrazuje redirect na login.html pro všechny stránky.

   Použití:
     <script src="auth-modal.js"></script>        (kořen)
     <script src="../auth-modal.js"></script>      (place/, ar/, atd.)

   API:
     window.lopAuth.open(view?)     — otevře modal ('signin' | 'register' | 'reset')
     window.lopAuth.close()         — zavře modal
     window.lopAuth.isLoggedIn()    — vrátí bool
     window.lopAuth.onLogin(fn)     — callback po přihlášení (fn dostane session)
     window.lopAuth.onLogout(fn)    — callback po odhlášení
     window.lopAuth.signOut()       — odhlásí uživatele
   ═══════════════════════════════════════════════════ */

(function() {

const SUPA_URL = 'https://lomtaoctzetpweuepesp.supabase.co';
const SUPA_KEY = 'sb_publishable_uAQBxCOYWpc_PrEc78fFzw_kbeH4xj5';
const API      = SUPA_URL + '/auth/v1';
const SESS_KEY = 'lop_auth_session';

/* ── Callbacks ── */
const _loginCbs  = [];
const _logoutCbs = [];

/* ── Session helpers ── */
function saveSession(s)  { try { localStorage.setItem(SESS_KEY, JSON.stringify(s)); } catch(e) {} }
function clearSession()  { try { localStorage.removeItem(SESS_KEY); } catch(e) {} }
function loadSession()   { try { return JSON.parse(localStorage.getItem(SESS_KEY) || 'null'); } catch(e) { return null; } }
function isLoggedIn()    { const s = loadSession(); return !!(s && s.access_token && s.user); }

/* ── Supabase fetch ── */
async function apiPost(path, body) {
  const r = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY },
    body: JSON.stringify(body)
  });
  return r.json();
}
async function apiGet(path, token) {
  const r = await fetch(API + path, { headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + token } });
  return r.json();
}

/* ══════════════════════════════════════
   CSS
══════════════════════════════════════ */
const CSS = `
#lop-auth-backdrop {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(26,24,20,.55);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex; align-items: flex-end; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity .25s cubic-bezier(.22,.8,.36,1);
}
@media (min-width: 520px) {
  #lop-auth-backdrop { align-items: center; }
}
#lop-auth-backdrop.open {
  opacity: 1; pointer-events: all;
}
#lop-auth-modal {
  width: 100%; max-width: 440px;
  background: var(--paper, #eeefeb);
  border-radius: 20px 20px 0 0;
  padding: 0 0 env(safe-area-inset-bottom, 0);
  transform: translateY(24px);
  transition: transform .3s cubic-bezier(.22,.8,.36,1);
  max-height: 94svh; overflow-y: auto;
  position: relative;
}
@media (min-width: 520px) {
  #lop-auth-modal {
    border-radius: 20px;
    transform: translateY(12px) scale(.97);
    max-height: 90svh;
  }
}
#lop-auth-backdrop.open #lop-auth-modal {
  transform: none;
}

/* drag handle */
.lam-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: var(--rule, #cbcec5);
  margin: 12px auto 0;
}
@media (min-width: 520px) { .lam-handle { display: none; } }

/* header */
.lam-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 16px 20px 0;
}
.lam-close {
  appearance: none; background: transparent; border: none;
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ink-3, #6a6a64);
  flex-shrink: 0; margin-top: -2px;
  transition: background .15s;
}
.lam-close:hover { background: var(--paper-2, #e6e7e2); }
.lam-close svg { width: 18px; height: 18px; }

/* title */
.lam-kick {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: .18em; text-transform: uppercase;
  color: var(--ink-3, #6a6a64); margin-bottom: 4px;
}
.lam-title {
  font-family: 'Fraunces', serif;
  font-weight: 400; font-size: 34px;
  letter-spacing: -.02em; line-height: 1.05;
  color: var(--ink, #1a1a18);
}
.lam-title em { font-style: italic; color: var(--ink-3, #6a6a64); }
.lam-sub {
  font-size: 13.5px; color: var(--ink-3, #6a6a64);
  line-height: 1.5; margin-top: 6px;
}

/* body */
.lam-body { padding: 20px 20px 24px; }

/* field */
.lam-field { display: flex; flex-direction: column; gap: 7px; margin-bottom: 13px; }
.lam-field label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
  color: var(--ink-3, #6a6a64);
}
.lam-field input {
  padding: 13px 16px;
  background: var(--paper-2, #e6e7e2);
  border: 1px solid var(--rule, #cbcec5);
  border-radius: 10px;
  font-size: 16px; color: var(--ink, #1a1a18);
  font-family: 'Inter', system-ui, sans-serif;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.lam-field input:focus {
  border-color: var(--ink, #1a1a18);
  box-shadow: 0 0 0 3px rgba(26,24,20,.06);
}
.lam-field input::placeholder { color: var(--ink-4, #9a9a94); }

/* submit */
.lam-submit {
  width: 100%; padding: 14px;
  background: var(--ink, #1a1a18); color: var(--paper, #eeefeb);
  border: none; border-radius: 10px;
  font-size: 15px; font-weight: 500;
  font-family: 'Inter', system-ui, sans-serif;
  cursor: pointer; margin-top: 4px;
  transition: background .15s; letter-spacing: .01em;
}
.lam-submit:hover { background: var(--ink-2, #3a3a36); }
.lam-submit:disabled { opacity: .5; cursor: default; }

/* messages */
.lam-msg {
  padding: 10px 14px; border-radius: 8px;
  font-size: 13px; line-height: 1.45;
  margin-bottom: 14px; display: none;
}
.lam-msg.err { background: #fde8e3; border: 1px solid #f0b8a8; color: var(--accent, #b04020); }
.lam-msg.ok  { background: #e3f0e6; border: 1px solid #a8d0b0; color: var(--ok, #3d7a4a); }

/* switch row */
.lam-switch {
  display: flex; gap: 6px; flex-wrap: wrap;
  margin-top: 18px; padding-top: 16px;
  border-top: 1px solid var(--rule, #cbcec5);
  font-size: 13px; color: var(--ink-3, #6a6a64);
}
.lam-switch a {
  color: var(--ink, #1a1a18); font-weight: 500;
  cursor: pointer; text-decoration: underline;
  text-underline-offset: 2px;
}
.lam-switch a:hover { color: var(--accent, #b04020); }

/* logged-in state */
.lam-user {
  text-align: center; padding: 4px 0 4px;
}
.lam-avatar {
  width: 64px; height: 64px; border-radius: 50%;
  background: var(--paper-3, #dadcd4); border: 2px solid var(--rule, #cbcec5);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Fraunces', serif; font-size: 28px;
  color: var(--ink, #1a1a18); margin: 0 auto 12px;
}
.lam-user-email { font-size: 14px; color: var(--ink-2, #3a3a36); margin-bottom: 20px; }
.lam-signout {
  width: 100%; padding: 12px;
  background: transparent; color: var(--ink-3, #6a6a64);
  border: 1px solid var(--rule, #cbcec5); border-radius: 10px;
  font-size: 13px; font-family: 'Inter', system-ui, sans-serif;
  cursor: pointer; transition: all .15s; margin-top: 8px;
}
.lam-signout:hover { background: var(--paper-2, #e6e7e2); color: var(--ink, #1a1a18); }
`;

/* ══════════════════════════════════════
   HTML
══════════════════════════════════════ */
const HTML = `
<div id="lop-auth-backdrop">
  <div id="lop-auth-modal" role="dialog" aria-modal="true" aria-label="Přihlášení">
    <div class="lam-handle"></div>

    <!-- ── PŘIHLÁŠENÍ ── -->
    <div id="lamViewSignin">
      <div class="lam-head">
        <div>
          <div class="lam-kick">Vítejte zpět</div>
          <h2 class="lam-title">Přihlaste <em>se</em></h2>
          <p class="lam-sub">Pro ukládání míst a wishlist.</p>
        </div>
        <button class="lam-close" onclick="window.lopAuth.close()" aria-label="Zavřít">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="lam-body">
        <div class="lam-msg err" id="lamErrSignin"></div>
        <div class="lam-field">
          <label>Email</label>
          <input type="email" id="lamEmailSignin" placeholder="vas@email.cz" autocomplete="email"/>
        </div>
        <div class="lam-field">
          <label>Heslo</label>
          <input type="password" id="lamPassSignin" placeholder="••••••••" autocomplete="current-password"/>
        </div>
        <button class="lam-submit" id="lamBtnSignin" onclick="window.lopAuth._doSignIn()">Přihlásit se</button>
        <div class="lam-switch">
          Nemáte účet? <a onclick="window.lopAuth._show('register')">Registrovat se</a>
          &nbsp;·&nbsp;
          <a onclick="window.lopAuth._show('reset')">Zapomenuté heslo</a>
        </div>
      </div>
    </div>

    <!-- ── REGISTRACE ── -->
    <div id="lamViewRegister" style="display:none">
      <div class="lam-head">
        <div>
          <div class="lam-kick">Nový účet</div>
          <h2 class="lam-title">Registrace</h2>
          <p class="lam-sub">Bezplatný účet pro ukládání míst napříč zařízeními.</p>
        </div>
        <button class="lam-close" onclick="window.lopAuth.close()" aria-label="Zavřít">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="lam-body">
        <div class="lam-msg err" id="lamErrRegister"></div>
        <div class="lam-msg ok"  id="lamOkRegister"></div>
        <div class="lam-field">
          <label>Email</label>
          <input type="email" id="lamEmailRegister" placeholder="vas@email.cz" autocomplete="email"/>
        </div>
        <div class="lam-field">
          <label>Heslo <span style="font-size:9px;opacity:.6">(min. 6 znaků)</span></label>
          <input type="password" id="lamPassRegister" placeholder="••••••••" autocomplete="new-password"/>
        </div>
        <button class="lam-submit" id="lamBtnRegister" onclick="window.lopAuth._doRegister()">Vytvořit účet</button>
        <div class="lam-switch">
          Máte účet? <a onclick="window.lopAuth._show('signin')">Přihlásit se</a>
        </div>
      </div>
    </div>

    <!-- ── RESET HESLA ── -->
    <div id="lamViewReset" style="display:none">
      <div class="lam-head">
        <div>
          <div class="lam-kick">Obnova přístupu</div>
          <h2 class="lam-title">Zapomenuté <em>heslo</em></h2>
          <p class="lam-sub">Pošleme vám odkaz pro obnovu hesla.</p>
        </div>
        <button class="lam-close" onclick="window.lopAuth.close()" aria-label="Zavřít">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="lam-body">
        <div class="lam-msg err" id="lamErrReset"></div>
        <div class="lam-msg ok"  id="lamOkReset"></div>
        <div class="lam-field">
          <label>Email</label>
          <input type="email" id="lamEmailReset" placeholder="vas@email.cz" autocomplete="email"/>
        </div>
        <button class="lam-submit" id="lamBtnReset" onclick="window.lopAuth._doReset()">Odeslat odkaz</button>
        <div class="lam-switch">
          <a onclick="window.lopAuth._show('signin')">Zpět na přihlášení</a>
        </div>
      </div>
    </div>

    <!-- ── PŘIHLÁŠENÝ ── -->
    <div id="lamViewLoggedIn" style="display:none">
      <div class="lam-head">
        <div>
          <div class="lam-kick">Účet</div>
          <h2 class="lam-title">Jste <em>přihlášeni</em></h2>
        </div>
        <button class="lam-close" onclick="window.lopAuth.close()" aria-label="Zavřít">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="lam-body">
        <div class="lam-user">
          <div class="lam-avatar" id="lamAvatar"></div>
          <div class="lam-user-email" id="lamUserEmail"></div>
          <button class="lam-submit" onclick="window.lopAuth.close()">Pokračovat</button>
          <button class="lam-signout" onclick="window.lopAuth.signOut()">Odhlásit se</button>
        </div>
      </div>
    </div>

  </div>
</div>
`;

/* ══════════════════════════════════════
   Inject do DOM
══════════════════════════════════════ */
function _inject() {
  if (document.getElementById('lop-auth-backdrop')) return;

  // CSS
  const style = document.createElement('style');
  style.id = 'lop-auth-modal-css';
  style.textContent = CSS;
  document.head.appendChild(style);

  // HTML
  const wrap = document.createElement('div');
  wrap.innerHTML = HTML;
  document.body.appendChild(wrap.firstElementChild);

  // Zavření kliknutím na backdrop
  document.getElementById('lop-auth-backdrop').addEventListener('click', e => {
    if (e.target.id === 'lop-auth-backdrop') _close();
  });

  // Enter key
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lop-auth-backdrop').classList.contains('open')) return;
    if (e.key === 'Escape') { _close(); return; }
    if (e.key !== 'Enter') return;
    if (_currentView === 'signin')   _doSignIn();
    if (_currentView === 'register') _doRegister();
    if (_currentView === 'reset')    _doReset();
  });
}

/* ══════════════════════════════════════
   View management
══════════════════════════════════════ */
let _currentView = 'signin';

function _show(view) {
  _currentView = view;
  const map = { signin: 'Signin', register: 'Register', reset: 'Reset', loggedIn: 'LoggedIn' };
  ['Signin','Register','Reset','LoggedIn'].forEach(v => {
    const el = document.getElementById('lamView' + v);
    if (el) el.style.display = 'none';
  });
  const key = map[view] || 'Signin';
  const el = document.getElementById('lamView' + key);
  if (el) el.style.display = 'block';
  // Focus první input
  const inp = el?.querySelector('input');
  if (inp) setTimeout(() => inp.focus(), 80);
}

function _clearMsg(...ids) {
  ids.forEach(id => { const el = document.getElementById(id); if (el) { el.textContent = ''; el.style.display = 'none'; } });
}
function _showErr(id, msg) { const el = document.getElementById(id); if (el) { el.textContent = msg; el.style.display = 'block'; } }
function _showOk(id, msg)  { const el = document.getElementById(id); if (el) { el.textContent = msg; el.style.display = 'block'; } }
function _setLoading(id, on, label) { const btn = document.getElementById(id); if (btn) { btn.disabled = on; btn.textContent = on ? '…' : label; } }

/* ══════════════════════════════════════
   Open / Close
══════════════════════════════════════ */
function _open(view) {
  _inject(); // idempotent
  const bd = document.getElementById('lop-auth-backdrop');
  if (!bd) return;

  // Zjisti stav přihlášení
  const s = loadSession();
  if (s && s.access_token && s.user) {
    const letter = (s.user.email || '?')[0].toUpperCase();
    const av = document.getElementById('lamAvatar');
    const em = document.getElementById('lamUserEmail');
    if (av) av.textContent = letter;
    if (em) em.textContent = s.user.email;
    _show('loggedIn');
  } else {
    _show(view || 'signin');
  }

  bd.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function _close() {
  const bd = document.getElementById('lop-auth-backdrop');
  if (bd) bd.classList.remove('open');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════
   Auth actions
══════════════════════════════════════ */
async function _doSignIn() {
  _clearMsg('lamErrSignin');
  const email = document.getElementById('lamEmailSignin')?.value.trim() || '';
  const pass  = document.getElementById('lamPassSignin')?.value || '';
  if (!email) { _showErr('lamErrSignin', 'Zadejte emailovou adresu.'); return; }
  if (!pass)  { _showErr('lamErrSignin', 'Zadejte heslo.'); return; }
  _setLoading('lamBtnSignin', true, 'Přihlásit se');
  try {
    const data = await apiPost('/token?grant_type=password', { email, password: pass });
    if (data.error) throw new Error(data.error.message || data.msg || 'Nesprávný email nebo heslo.');
    saveSession(data);
    _setLoading('lamBtnSignin', false, 'Přihlásit se');
    _close();
    // Refresh hlavičky a nav
    if (window.lopHeader?.refresh) window.lopHeader.refresh();
    if (window.lopNav?.refresh)    window.lopNav.refresh();
    // Callbacks
    _loginCbs.forEach(fn => { try { fn(data); } catch(e) {} });
  } catch(e) {
    _showErr('lamErrSignin', e.message);
    _setLoading('lamBtnSignin', false, 'Přihlásit se');
  }
}

async function _doRegister() {
  _clearMsg('lamErrRegister', 'lamOkRegister');
  const email = document.getElementById('lamEmailRegister')?.value.trim() || '';
  const pass  = document.getElementById('lamPassRegister')?.value || '';
  if (!email) { _showErr('lamErrRegister', 'Zadejte emailovou adresu.'); return; }
  if (!pass || pass.length < 6) { _showErr('lamErrRegister', 'Heslo musí mít alespoň 6 znaků.'); return; }
  _setLoading('lamBtnRegister', true, 'Vytvořit účet');
  try {
    const data = await apiPost('/signup', { email, password: pass });
    if (data.error) throw new Error(data.error.message || data.msg || 'Chyba registrace.');
    _showOk('lamOkRegister', 'Účet vytvořen! Zkontrolujte email pro potvrzení.');
    _setLoading('lamBtnRegister', false, 'Vytvořit účet');
  } catch(e) {
    _showErr('lamErrRegister', e.message);
    _setLoading('lamBtnRegister', false, 'Vytvořit účet');
  }
}

async function _doReset() {
  _clearMsg('lamErrReset', 'lamOkReset');
  const email = document.getElementById('lamEmailReset')?.value.trim() || '';
  if (!email) { _showErr('lamErrReset', 'Zadejte emailovou adresu.'); return; }
  _setLoading('lamBtnReset', true, 'Odeslat odkaz');
  try {
    const data = await apiPost('/recover', { email });
    if (data.error) throw new Error(data.error.message || 'Chyba.');
    _showOk('lamOkReset', 'Odkaz byl odeslán na ' + email + '.');
    _setLoading('lamBtnReset', false, 'Odeslat odkaz');
  } catch(e) {
    _showErr('lamErrReset', e.message);
    _setLoading('lamBtnReset', false, 'Odeslat odkaz');
  }
}

async function _signOut() {
  const s = loadSession();
  if (s?.access_token) {
    await fetch(API + '/logout', {
      method: 'POST',
      headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + s.access_token }
    }).catch(() => {});
  }
  clearSession();
  _close();
  if (window.lopHeader?.refresh) window.lopHeader.refresh();
  if (window.lopNav?.refresh)    window.lopNav.refresh();
  _logoutCbs.forEach(fn => { try { fn(); } catch(e) {} });
}

/* ══════════════════════════════════════
   Public API
══════════════════════════════════════ */
window.lopAuth = {
  open:        _open,
  close:       _close,
  isLoggedIn:  isLoggedIn,
  signOut:     _signOut,
  onLogin:     fn => _loginCbs.push(fn),
  onLogout:    fn => _logoutCbs.push(fn),
  // interní — voláno z inline onclick v HTML modalu
  _show:       _show,
  _doSignIn:   _doSignIn,
  _doRegister: _doRegister,
  _doReset:    _doReset,
};

// Inject při načtení
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _inject);
} else {
  _inject();
}

})();
