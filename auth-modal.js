/* ═══════════════════════════════════════════════════
   LayersOfPrague — auth-modal.js
   ═══════════════════════════════════════════════════ */

(function() {

const SUPA_URL = 'https://lomtaoctzetpweuepesp.supabase.co';
const SUPA_KEY = 'sb_publishable_uAQBxCOYWpc_PrEc78fFzw_kbeH4xj5';
const API      = SUPA_URL + '/auth/v1';
const SESS_KEY = 'lop_auth_session';

const _loginCbs  = [];
const _logoutCbs = [];

function saveSession(s)  { try { localStorage.setItem(SESS_KEY, JSON.stringify(s)); } catch(e) {} }
function clearSession()  { try { localStorage.removeItem(SESS_KEY); } catch(e) {} }
function loadSession()   { try { return JSON.parse(localStorage.getItem(SESS_KEY) || 'null'); } catch(e) { return null; } }
function isLoggedIn()    { const s = loadSession(); return !!(s && s.access_token && s.user); }

async function apiPost(path, body) {
  const r = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY },
    body: JSON.stringify(body)
  });
  return r.json();
}

const CSS = `
#lop-auth-backdrop {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(26,24,20,.55);
  backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
  display: flex; align-items: flex-end; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity .25s cubic-bezier(.22,.8,.36,1);
}
@media (min-width: 520px) { #lop-auth-backdrop { align-items: center; } }
#lop-auth-backdrop.open { opacity: 1; pointer-events: all; }
#lop-auth-modal {
  width: 100%; max-width: 440px;
  background: var(--paper, #eeefeb);
  border-radius: 20px 20px 0 0;
  padding: 0 0 env(safe-area-inset-bottom, 0);
  transform: translateY(24px);
  transition: transform .3s cubic-bezier(.22,.8,.36,1);
  max-height: 94svh; overflow-y: auto; position: relative;
}
@media (min-width: 520px) {
  #lop-auth-modal { border-radius: 20px; transform: translateY(12px) scale(.97); max-height: 90svh; }
}
#lop-auth-backdrop.open #lop-auth-modal { transform: none; }
.lam-handle { width: 36px; height: 4px; border-radius: 2px; background: var(--rule, #cbcec5); margin: 12px auto 0; }
@media (min-width: 520px) { .lam-handle { display: none; } }
.lam-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 16px 20px 0; }
.lam-close { appearance: none; background: transparent; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink-3, #6a6a64); flex-shrink: 0; margin-top: -2px; transition: background .15s; }
.lam-close:hover { background: var(--paper-2, #e6e7e2); }
.lam-close svg { width: 18px; height: 18px; }
.lam-kick { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--ink-3, #6a6a64); margin-bottom: 4px; }
.lam-title { font-family: 'Fraunces', serif; font-weight: 400; font-size: 34px; letter-spacing: -.02em; line-height: 1.05; color: var(--ink, #1a1a18); }
.lam-title em { font-style: italic; color: var(--ink-3, #6a6a64); }
.lam-sub { font-size: 13.5px; color: var(--ink-3, #6a6a64); line-height: 1.5; margin-top: 6px; }
.lam-body { padding: 20px 20px 24px; }
.lam-field { display: flex; flex-direction: column; gap: 7px; margin-bottom: 13px; }
.lam-field label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3, #6a6a64); }
.lam-field input { padding: 13px 16px; background: var(--paper-2, #e6e7e2); border: 1px solid var(--rule, #cbcec5); border-radius: 10px; font-size: 16px; color: var(--ink, #1a1a18); font-family: 'Inter', system-ui, sans-serif; outline: none; transition: border-color .15s, box-shadow .15s; }
.lam-field input:focus { border-color: var(--ink, #1a1a18); box-shadow: 0 0 0 3px rgba(26,24,20,.06); }
.lam-field input::placeholder { color: var(--ink-4, #9a9a94); }
.lam-submit { width: 100%; padding: 14px; background: var(--ink, #1a1a18); color: var(--paper, #eeefeb); border: none; border-radius: 10px; font-size: 15px; font-weight: 500; font-family: 'Inter', system-ui, sans-serif; cursor: pointer; margin-top: 4px; transition: background .15s; letter-spacing: .01em; }
.lam-submit:hover { background: var(--ink-2, #3a3a36); }
.lam-submit:disabled { opacity: .5; cursor: default; }
.lam-msg { padding: 10px 14px; border-radius: 8px; font-size: 13px; line-height: 1.45; margin-bottom: 14px; display: none; }
.lam-msg.err { background: #fde8e3; border: 1px solid #f0b8a8; color: var(--accent, #b04020); }
.lam-msg.ok  { background: #e3f0e6; border: 1px solid #a8d0b0; color: var(--ok, #3d7a4a); }
.lam-switch { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--rule, #cbcec5); font-size: 13px; color: var(--ink-3, #6a6a64); }
.lam-switch a { color: var(--ink, #1a1a18); font-weight: 500; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.lam-switch a:hover { color: var(--accent, #b04020); }
.lam-user { text-align: center; padding: 4px 0 4px; }
.lam-avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--paper-3, #dadcd4); border: 2px solid var(--rule, #cbcec5); display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-size: 28px; color: var(--ink, #1a1a18); margin: 0 auto 12px; }
.lam-user-email { font-size: 14px; color: var(--ink-2, #3a3a36); margin-bottom: 20px; }
.lam-signout { width: 100%; padding: 12px; background: transparent; color: var(--ink-3, #6a6a64); border: 1px solid var(--rule, #cbcec5); border-radius: 10px; font-size: 13px; font-family: 'Inter', system-ui, sans-serif; cursor: pointer; transition: all .15s; margin-top: 8px; }
.lam-signout:hover { background: var(--paper-2, #e6e7e2); color: var(--ink, #1a1a18); }
`;

const SVG_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const BTN_CLOSE = `<button class="lam-close" onclick="window.lopAuth.close()" aria-label="${t('auth.close')}">${SVG_CLOSE}</button>`;

const HTML = `
<div id="lop-auth-backdrop">
  <div id="lop-auth-modal" role="dialog" aria-modal="true" ${`aria-label="${t('auth.sign_in')}"`}>
    <div class="lam-handle"></div>
    <div id="lamViewSignin">
      <div class="lam-head">
        <div><div class="lam-kick">${t('auth.welcome_back')}</div><h2 class="lam-title">${t('auth.sign_in')}</h2><p class="lam-sub">${t('auth.sign_in_sub')}</p></div>
        ${BTN_CLOSE}
      </div>
      <div class="lam-body">
        <div class="lam-msg err" id="lamErrSignin"></div>
        <div class="lam-field"><label>${t('auth.label_email')}</label><input type="email" id="lamEmailSignin" placeholder="${t('auth.placeholder_email')}" autocomplete="email"/></div>
        <div class="lam-field"><label>${t('auth.label_password')}</label><input type="password" id="lamPassSignin" placeholder="••••••••" autocomplete="current-password"/></div>
        <button class="lam-submit" id="lamBtnSignin" onclick="window.lopAuth._doSignIn()">${t('auth.btn_signin')}</button>
        <div class="lam-switch">${t('auth.no_account')} <a onclick="window.lopAuth._show('register')">${t('auth.link_register')}</a> &nbsp;·&nbsp; <a onclick="window.lopAuth._show('reset')">${t('auth.link_forgot')}</a></div>
      </div>
    </div>
    <div id="lamViewRegister" style="display:none">
      <div class="lam-head">
        <div><div class="lam-kick">${t('auth.new_account')}</div><h2 class="lam-title">${t('auth.register')}</h2><p class="lam-sub">${t('auth.register_sub')}</p></div>
        ${BTN_CLOSE}
      </div>
      <div class="lam-body">
        <div class="lam-msg err" id="lamErrRegister"></div>
        <div class="lam-msg ok"  id="lamOkRegister"></div>
        <div class="lam-field"><label>${t('auth.label_email')}</label><input type="email" id="lamEmailRegister" placeholder="${t('auth.placeholder_email')}" autocomplete="email"/></div>
        <div class="lam-field"><label>${t('auth.label_password')} <span style="font-size:9px;opacity:.6">(${t('auth.label_pass_hint')})</span></label><input type="password" id="lamPassRegister" placeholder="••••••••" autocomplete="new-password"/></div>
        <button class="lam-submit" id="lamBtnRegister" onclick="window.lopAuth._doRegister()">${t('auth.btn_register')}</button>
        <div class="lam-switch">${t('auth.have_account')} <a onclick="window.lopAuth._show('signin')">${t('auth.link_signin')}</a></div>
      </div>
    </div>
    <div id="lamViewReset" style="display:none">
      <div class="lam-head">
        <div><div class="lam-kick">${t('auth.recovery')}</div><h2 class="lam-title">${t('auth.forgot')}</h2><p class="lam-sub">${t('auth.forgot_sub')}</p></div>
        ${BTN_CLOSE}
      </div>
      <div class="lam-body">
        <div class="lam-msg err" id="lamErrReset"></div>
        <div class="lam-msg ok"  id="lamOkReset"></div>
        <div class="lam-field"><label>${t('auth.label_email')}</label><input type="email" id="lamEmailReset" placeholder="${t('auth.placeholder_email')}" autocomplete="email"/></div>
        <button class="lam-submit" id="lamBtnReset" onclick="window.lopAuth._doReset()">${t('auth.btn_send_link')}</button>
        <div class="lam-switch"><a onclick="window.lopAuth._show('signin')">${t('auth.link_back')}</a></div>
      </div>
    </div>
    <div id="lamViewLoggedIn" style="display:none">
      <div class="lam-head">
        <div><div class="lam-kick">${t('auth.account')}</div><h2 class="lam-title">${t('auth.logged_in')}</h2></div>
        ${BTN_CLOSE}
      </div>
      <div class="lam-body">
        <div class="lam-user">
          <div class="lam-avatar" id="lamAvatar"></div>
          <div class="lam-user-email" id="lamUserEmail"></div>
          <button class="lam-submit" onclick="window.lopAuth.close()">${t('auth.btn_continue')}</button>
          <button class="lam-signout" onclick="window.lopAuth.signOut()">${t('auth.btn_signout')}</button>
        </div>
      </div>
    </div>
  </div>
</div>
`;

function _inject() {
  if (document.getElementById('lop-auth-backdrop')) return;
  const style = document.createElement('style');
  style.id = 'lop-auth-modal-css';
  style.textContent = CSS;
  document.head.appendChild(style);
  const wrap = document.createElement('div');
  wrap.innerHTML = HTML;
  document.body.appendChild(wrap.firstElementChild);
  document.getElementById('lop-auth-backdrop').addEventListener('click', e => {
    if (e.target.id === 'lop-auth-backdrop') _close();
  });
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lop-auth-backdrop').classList.contains('open')) return;
    if (e.key === 'Escape') { _close(); return; }
    if (e.key !== 'Enter') return;
    if (_currentView === 'signin')   _doSignIn();
    if (_currentView === 'register') _doRegister();
    if (_currentView === 'reset')    _doReset();
  });
}

let _currentView = 'signin';

function _show(view) {
  _currentView = view;
  const map = { signin: 'Signin', register: 'Register', reset: 'Reset', loggedIn: 'LoggedIn' };
  ['Signin','Register','Reset','LoggedIn'].forEach(v => {
    const el = document.getElementById('lamView' + v);
    if (el) el.style.display = 'none';
  });
  const el = document.getElementById('lamView' + (map[view] || 'Signin'));
  if (el) { el.style.display = 'block'; const inp = el.querySelector('input'); if (inp) setTimeout(() => inp.focus(), 80); }
}

function _clearMsg(...ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) { el.textContent = ''; el.style.display = 'none'; } }); }
function _showErr(id, msg) { const el = document.getElementById(id); if (el) { el.textContent = msg; el.style.display = 'block'; } }
function _showOk(id, msg)  { const el = document.getElementById(id); if (el) { el.textContent = msg; el.style.display = 'block'; } }
function _setLoading(id, on, label) { const btn = document.getElementById(id); if (btn) { btn.disabled = on; btn.textContent = on ? '\u2026' : label; } }

function _open(view) {
  _inject();
  const bd = document.getElementById('lop-auth-backdrop');
  if (!bd) return;
  const s = loadSession();
  if (s && s.access_token && s.user) {
    const av = document.getElementById('lamAvatar');
    const em = document.getElementById('lamUserEmail');
    if (av) av.textContent = (s.user.email || '?')[0].toUpperCase();
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

async function _doSignIn() {
  _clearMsg('lamErrSignin');
  const email = document.getElementById('lamEmailSignin')?.value.trim() || '';
  const pass  = document.getElementById('lamPassSignin')?.value || '';
  if (!email) { _showErr('lamErrSignin', t('auth.err_email')); return; }
  if (!pass)  { _showErr('lamErrSignin', t('auth.err_password')); return; }
  _setLoading('lamBtnSignin', true, t('auth.btn_signin'));
  try {
    const data = await apiPost('/token?grant_type=password', { email, password: pass });
    if (data.error) throw new Error(data.error.message || data.msg || t('auth.err_wrong'));
    saveSession(data);
    _setLoading('lamBtnSignin', false, t('auth.btn_signin'));
    _close();
    if (window.lopHeader?.refresh) window.lopHeader.refresh();
    if (window.lopNav?.refresh)    window.lopNav.refresh();
    _loginCbs.forEach(fn => { try { fn(data); } catch(e) {} });
  } catch(e) {
    _showErr('lamErrSignin', e.message);
    _setLoading('lamBtnSignin', false, t('auth.btn_signin'));
  }
}

async function _doRegister() {
  _clearMsg('lamErrRegister', 'lamOkRegister');
  const email = document.getElementById('lamEmailRegister')?.value.trim() || '';
  const pass  = document.getElementById('lamPassRegister')?.value || '';
  if (!email) { _showErr('lamErrRegister', t('auth.err_email')); return; }
  if (!pass || pass.length < 6) { _showErr('lamErrRegister', t('auth.err_short_pass')); return; }
  _setLoading('lamBtnRegister', true, t('auth.btn_register'));
  try {
    const data = await apiPost('/signup', { email, password: pass });
    if (data.error) throw new Error(data.error.message || data.msg || t('auth.err_generic'));
    _showOk('lamOkRegister', t('auth.ok_registered'));
    _setLoading('lamBtnRegister', false, t('auth.btn_register'));
  } catch(e) {
    _showErr('lamErrRegister', e.message);
    _setLoading('lamBtnRegister', false, t('auth.btn_register'));
  }
}

async function _doReset() {
  _clearMsg('lamErrReset', 'lamOkReset');
  const email = document.getElementById('lamEmailReset')?.value.trim() || '';
  if (!email) { _showErr('lamErrReset', t('auth.err_email')); return; }
  _setLoading('lamBtnReset', true, t('auth.btn_send_link'));
  try {
    const data = await apiPost('/recover', { email });
    if (data.error) throw new Error(data.error.message || t('auth.err_generic'));
    _showOk('lamOkReset', t('auth.ok_reset', { email: email }));
    _setLoading('lamBtnReset', false, t('auth.btn_send_link'));
  } catch(e) {
    _showErr('lamErrReset', e.message);
    _setLoading('lamBtnReset', false, t('auth.btn_send_link'));
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

window.lopAuth = {
  open: _open, close: _close, isLoggedIn: isLoggedIn, signOut: _signOut,
  onLogin: fn => _loginCbs.push(fn), onLogout: fn => _logoutCbs.push(fn),
  _show: _show, _doSignIn: _doSignIn, _doRegister: _doRegister, _doReset: _doReset,
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _inject);
} else {
  _inject();
}

})();
