/* ═══════════════════════════════════════════════════════
   LayersOfPrague — auth.js
   Sdílená autentizační komponenta
   Použití: <script src="/auth.js"></script> nebo <script src="../auth.js"></script>
   ═══════════════════════════════════════════════════════ */

(function() {

const SUPA_URL = 'https://lomtaoctzetpweuepesp.supabase.co';
const SUPA_KEY = 'sb_publishable_uAQBxCOYWpc_PrEc78fFzw_kbeH4xj5';
const API      = SUPA_URL + '/auth/v1';

/* ── Stav ──────────────────────────────────────────── */
let _session = null;
let _listeners = [];

function getUser()    { return _session?.user || null; }
function getSession() { return _session; }
function isLoggedIn() { return !!_session?.user; }

function onAuthChange(fn) { _listeners.push(fn); }
function _notify() { _listeners.forEach(fn => fn(getUser())); }

/* ── Supabase Auth API ─────────────────────────────── */
async function _post(path, body) {
  const r = await fetch(API + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPA_KEY
    },
    body: JSON.stringify(body)
  });
  return r.json();
}

async function _get(path, token) {
  const r = await fetch(API + path, {
    headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + token }
  });
  return r.json();
}

async function signUp(email, password) {
  const data = await _post('/signup', { email, password });
  if (data.error) throw new Error(data.error.message || data.msg || 'Chyba registrace');
  return data;
}

async function signIn(email, password) {
  const data = await _post('/token?grant_type=password', { email, password });
  if (data.error) throw new Error(data.error.message || data.msg || 'Nesprávný email nebo heslo');
  _session = data;
  _saveSession(data);
  _notify();
  return data;
}

async function signOut() {
  if (_session?.access_token) {
    await fetch(API + '/logout', {
      method: 'POST',
      headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + _session.access_token }
    }).catch(() => {});
  }
  _session = null;
  _clearSession();
  _notify();
}

async function resetPassword(email) {
  const data = await _post('/recover', { email });
  if (data.error) throw new Error(data.error.message || 'Chyba');
  return data;
}

/* ── Session persistence ───────────────────────────── */
const SESSION_KEY = 'lop_auth_session';

function _saveSession(s) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch(e) {}
}
function _clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
}
function _loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch(e) { return null; }
}

async function _refreshSession(s) {
  if (!s?.refresh_token) return null;
  try {
    const data = await _post('/token?grant_type=refresh_token', { refresh_token: s.refresh_token });
    if (data.error || !data.access_token) return null;
    _session = data;
    _saveSession(data);
    return data;
  } catch(e) { return null; }
}

async function _initSession() {
  const stored = _loadSession();
  if (!stored?.access_token) { _notify(); return; }

  // Ověř platnost tokenu
  const user = await _get('/user', stored.access_token);
  if (user.id) {
    _session = { ...stored, user };
    _notify();
  } else {
    // Token expiroval — zkus refresh
    const refreshed = await _refreshSession(stored);
    if (refreshed) {
      const u = await _get('/user', refreshed.access_token);
      if (u.id) { _session.user = u; _notify(); }
    } else {
      _clearSession();
      _notify();
    }
  }
}

/* ── Modal HTML ────────────────────────────────────── */
function _injectModal() {
  if (document.getElementById('lopAuthModal')) return;

  const css = `
    #lopAuthModal {
      display: none; position: fixed; inset: 0; z-index: 9999;
      background: rgba(26,24,20,.55); backdrop-filter: blur(4px);
      align-items: center; justify-content: center;
    }
    #lopAuthModal.open { display: flex; }
    #lopAuthBox {
      background: #eeefeb; border: 1px solid #cbcec5;
      border-radius: 14px; padding: 28px 24px 24px;
      width: min(420px, calc(100vw - 32px));
      box-shadow: 0 16px 48px rgba(26,24,20,.2);
      position: relative;
    }
    #lopAuthBox h2 {
      font-family: 'Fraunces', serif; font-weight: 400;
      font-size: 26px; letter-spacing: -.015em;
      color: #1a1a18; margin-bottom: 4px;
    }
    #lopAuthBox h2 em { font-style: italic; color: #6a6a64; }
    .lop-auth-sub {
      font-size: 13px; color: #6a6a64; margin-bottom: 20px;
    }
    .lop-auth-field {
      display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;
    }
    .lop-auth-field label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
      color: #6a6a64;
    }
    .lop-auth-field input {
      padding: 11px 14px;
      background: #e6e7e2; border: 1px solid #cbcec5;
      border-radius: 8px; font-size: 15px; color: #1a1a18;
      outline: none; transition: border-color .15s;
      font-family: 'Inter', sans-serif;
    }
    .lop-auth-field input:focus { border-color: #1a1a18; }
    .lop-auth-btn {
      width: 100%; padding: 13px;
      background: #1a1a18; color: #eeefeb;
      border: none; border-radius: 8px;
      font-size: 14px; font-weight: 500;
      cursor: pointer; margin-top: 8px;
      transition: background .15s;
      font-family: 'Inter', sans-serif;
    }
    .lop-auth-btn:hover { background: #3a3a36; }
    .lop-auth-btn:disabled { opacity: .5; cursor: default; }
    .lop-auth-switch {
      text-align: center; margin-top: 16px;
      font-size: 13px; color: #6a6a64;
    }
    .lop-auth-switch a {
      color: #1a1a18; font-weight: 500; cursor: pointer;
      text-decoration: underline;
    }
    .lop-auth-err {
      background: #fde8e3; border: 1px solid #f0b8a8;
      border-radius: 6px; padding: 9px 12px;
      font-size: 13px; color: #b04020;
      margin-bottom: 12px; display: none;
    }
    .lop-auth-ok {
      background: #e3f0e6; border: 1px solid #a8d0b0;
      border-radius: 6px; padding: 9px 12px;
      font-size: 13px; color: #3d7a4a;
      margin-bottom: 12px; display: none;
    }
    .lop-auth-close {
      position: absolute; top: 14px; right: 14px;
      background: transparent; border: none; cursor: pointer;
      color: #9a9a94; padding: 4px;
    }
    .lop-auth-close:hover { color: #1a1a18; }
    .lop-auth-close svg { width: 18px; height: 18px; display: block; }
    #lopAuthUserBox {
      text-align: center;
    }
    .lop-auth-avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: #dadcd4; border: 2px solid #cbcec5;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Fraunces', serif; font-size: 24px;
      color: #1a1a18; margin: 0 auto 12px;
    }
    .lop-auth-email {
      font-size: 14px; color: #3a3a36; margin-bottom: 20px;
    }
    .lop-auth-signout {
      width: 100%; padding: 11px;
      background: transparent; color: #6a6a64;
      border: 1px solid #cbcec5; border-radius: 8px;
      font-size: 13px; cursor: pointer;
      transition: all .15s;
      font-family: 'Inter', sans-serif;
    }
    .lop-auth-signout:hover { background: #e6e7e2; color: #1a1a18; }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.id = 'lopAuthModal';
  modal.innerHTML = `
    <div id="lopAuthBox">
      <button class="lop-auth-close" onclick="window.lopAuth.closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <!-- Přihlášení -->
      <div id="lopAuthSignIn">
        <h2>Přihlaste <em>se</em></h2>
        <div class="lop-auth-sub">Pro ukládání míst a přístup k zajímavostem</div>
        <div class="lop-auth-err" id="lopAuthErr"></div>
        <div class="lop-auth-ok" id="lopAuthOk"></div>
        <div class="lop-auth-field">
          <label>Email</label>
          <input type="email" id="lopAuthEmail" placeholder="vas@email.cz" autocomplete="email"/>
        </div>
        <div class="lop-auth-field" id="lopAuthPassField">
          <label>Heslo</label>
          <input type="password" id="lopAuthPass" placeholder="••••••••" autocomplete="current-password"/>
        </div>
        <button class="lop-auth-btn" id="lopAuthSubmit" onclick="window.lopAuth._submit()">Přihlásit se</button>
        <div class="lop-auth-switch">
          Nemáte účet? <a onclick="window.lopAuth._switchMode('register')">Registrovat se</a>
          &nbsp;·&nbsp;
          <a onclick="window.lopAuth._switchMode('reset')">Zapomenuté heslo</a>
        </div>
      </div>
      <!-- Přihlášený uživatel -->
      <div id="lopAuthUserBox" style="display:none">
        <div class="lop-auth-avatar" id="lopAuthAvatar"></div>
        <div class="lop-auth-email" id="lopAuthUserEmail"></div>
        <button class="lop-auth-signout" onclick="window.lopAuth._doSignOut()">Odhlásit se</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Zavřít kliknutím na pozadí
  modal.addEventListener('click', e => { if (e.target === modal) window.lopAuth.closeModal(); });

  // Enter v inputech
  modal.addEventListener('keydown', e => {
    if (e.key === 'Enter') window.lopAuth._submit();
    if (e.key === 'Escape') window.lopAuth.closeModal();
  });
}

/* ── Modal logika ──────────────────────────────────── */
let _mode = 'signin'; // signin | register | reset

function openModal() {
  _injectModal();
  _renderModal();
  document.getElementById('lopAuthModal').classList.add('open');
  setTimeout(() => {
    const el = document.getElementById('lopAuthEmail');
    if (el) el.focus();
  }, 50);
}

function closeModal() {
  const m = document.getElementById('lopAuthModal');
  if (m) m.classList.remove('open');
}

function _renderModal() {
  const signInBox = document.getElementById('lopAuthSignIn');
  const userBox   = document.getElementById('lopAuthUserBox');
  if (!signInBox) return;

  if (isLoggedIn()) {
    signInBox.style.display = 'none';
    userBox.style.display = 'block';
    const u = getUser();
    const letter = (u.email || '?')[0].toUpperCase();
    document.getElementById('lopAuthAvatar').textContent = letter;
    document.getElementById('lopAuthUserEmail').textContent = u.email;
    return;
  }

  signInBox.style.display = 'block';
  userBox.style.display = 'none';

  const title    = signInBox.querySelector('h2');
  const sub      = signInBox.querySelector('.lop-auth-sub');
  const passField= document.getElementById('lopAuthPassField');
  const btn      = document.getElementById('lopAuthSubmit');
  const sw       = signInBox.querySelector('.lop-auth-switch');
  _clearMessages();

  if (_mode === 'signin') {
    title.innerHTML = 'Přihlaste <em>se</em>';
    sub.textContent = 'Pro ukládání míst a přístup k zajímavostem';
    passField.style.display = 'flex';
    btn.textContent = 'Přihlásit se';
    sw.innerHTML = `Nemáte účet? <a onclick="window.lopAuth._switchMode('register')">Registrovat se</a> &nbsp;·&nbsp; <a onclick="window.lopAuth._switchMode('reset')">Zapomenuté heslo</a>`;
  } else if (_mode === 'register') {
    title.innerHTML = 'Registrace';
    sub.textContent = 'Vytvořte si bezplatný účet';
    passField.style.display = 'flex';
    btn.textContent = 'Vytvořit účet';
    sw.innerHTML = `Máte účet? <a onclick="window.lopAuth._switchMode('signin')">Přihlásit se</a>`;
  } else if (_mode === 'reset') {
    title.innerHTML = 'Obnovit heslo';
    sub.textContent = 'Pošleme vám odkaz na obnovu hesla';
    passField.style.display = 'none';
    btn.textContent = 'Odeslat odkaz';
    sw.innerHTML = `<a onclick="window.lopAuth._switchMode('signin')">Zpět na přihlášení</a>`;
  }
}

function _switchMode(mode) {
  _mode = mode;
  _renderModal();
  setTimeout(() => { const el = document.getElementById('lopAuthEmail'); if (el) el.focus(); }, 50);
}

function _clearMessages() {
  const err = document.getElementById('lopAuthErr');
  const ok  = document.getElementById('lopAuthOk');
  if (err) { err.style.display = 'none'; err.textContent = ''; }
  if (ok)  { ok.style.display = 'none';  ok.textContent = ''; }
}

function _showErr(msg) {
  const el = document.getElementById('lopAuthErr');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function _showOk(msg) {
  const el = document.getElementById('lopAuthOk');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

async function _submit() {
  const email = (document.getElementById('lopAuthEmail')?.value || '').trim();
  const pass  = (document.getElementById('lopAuthPass')?.value  || '').trim();
  const btn   = document.getElementById('lopAuthSubmit');
  _clearMessages();

  if (!email) { _showErr('Zadejte emailovou adresu.'); return; }

  btn.disabled = true;
  btn.textContent = '…';

  try {
    if (_mode === 'signin') {
      if (!pass) { _showErr('Zadejte heslo.'); btn.disabled = false; btn.textContent = 'Přihlásit se'; return; }
      await signIn(email, pass);
      closeModal();
      _updateAllProfileButtons();
    } else if (_mode === 'register') {
      if (!pass || pass.length < 6) { _showErr('Heslo musí mít alespoň 6 znaků.'); btn.disabled = false; btn.textContent = 'Vytvořit účet'; return; }
      await signUp(email, pass);
      _showOk('Zkontrolujte email — poslali jsme vám potvrzovací odkaz.');
      btn.disabled = false; btn.textContent = 'Vytvořit účet';
    } else if (_mode === 'reset') {
      await resetPassword(email);
      _showOk('Odkaz na obnovu hesla byl odeslán.');
      btn.disabled = false; btn.textContent = 'Odeslat odkaz';
    }
  } catch(e) {
    _showErr(e.message);
    btn.disabled = false;
    btn.textContent = _mode === 'signin' ? 'Přihlásit se' : _mode === 'register' ? 'Vytvořit účet' : 'Odeslat odkaz';
  }
}

async function _doSignOut() {
  await signOut();
  closeModal();
  _updateAllProfileButtons();
}

/* ── Profil tlačítka ───────────────────────────────── */
function _updateAllProfileButtons() {
  // Aktualizuj vizuální stav všech .top-btn[title="Profil"]
  document.querySelectorAll('.top-btn[title="Profil"]').forEach(btn => {
    if (isLoggedIn()) {
      btn.style.color = 'var(--ink)';
      btn.title = getUser().email;
    } else {
      btn.style.color = '';
      btn.title = 'Profil';
    }
  });

  // Aktualizuj paywall sekce pokud existují
  if (typeof window.lopUpdatePaywall === 'function') window.lopUpdatePaywall();
}

/* ── Init ──────────────────────────────────────────── */
async function _init() {
  _injectModal();

  // Profil tlačítko otevírá modal
  document.querySelectorAll('.top-btn[title="Profil"]').forEach(btn => {
    btn.onclick = () => openModal();
  });

  // Načti session
  await _initSession();
  _updateAllProfileButtons();
}

// Spusť po DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _init);
} else {
  _init();
}

/* ── Public API ────────────────────────────────────── */
window.lopAuth = {
  openModal,
  closeModal,
  getUser,
  getSession,
  isLoggedIn,
  signIn,
  signUp,
  signOut,
  onAuthChange,
  // interní (voláno z HTML)
  _submit,
  _switchMode,
  _doSignOut,
};

})();
