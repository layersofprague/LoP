/* ══════════════════════════════════════════════════════════
   report-modal.js — „Nahlásit nesrovnalost"

   Sdílená komponenta pro všechny detail stránky (H001, H002, …).
   Report se ukládá do Supabase tabulky `reports` — GitHub Pages je
   statický hosting, takže odsud e-mail odeslat nejde a klíč od
   e-mailové služby by v JS byl veřejný. Notifikaci na mail lze
   doplnit později přes Database Webhook, bez zásahu do frontendu.

   Použití na stránce:
     <script src="../report-modal.js"></script>
     <a onclick="LOP_REPORT.open()">Nahlásit nesrovnalost</a>

   Vyžaduje: i18n.js (t), volitelně auth (předvyplnění e-mailu).
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SUPA_URL = 'https://lomtaoctzetpweuepesp.supabase.co';
  var SUPA_KEY = 'sb_publishable_uAQBxCOYWpc_PrEc78fFzw_kbeH4xj5';

  var KINDS = ['facts', 'copyright', 'translation', 'other'];
  var THROTTLE_KEY = 'lop_report_last';
  var THROTTLE_MS = 60 * 1000;   // nejvýš 1 report za minutu z jednoho prohlížeče
  var MIN_FILL_MS = 2000;        // formulář vyplněný do 2 s = skoro jistě bot

  var _openedAt = 0;
  var _built = false;

  /* ── Přihlášený uživatel (stejný tvar session jako jinde v projektu) ── */
  function _session() {
    try { return JSON.parse(localStorage.getItem('lop_auth_session') || 'null'); }
    catch (e) { return null; }
  }
  function _userEmail() {
    var s = _session();
    return (s && s.user && s.user.email) ? s.user.email : '';
  }

  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  /* ── Styly ── */
  function _injectCss() {
    if (document.getElementById('lop-report-css')) return;
    var css = document.createElement('style');
    css.id = 'lop-report-css';
    css.textContent = [
      '.rep-backdrop{position:fixed;inset:0;z-index:9500;display:none;align-items:center;justify-content:center;',
      'background:rgba(17,17,17,.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:16px;overscroll-behavior:contain}',
      '.rep-backdrop.open{display:flex}',
      '.rep-box{background:var(--paper,#F8F8F6);border-radius:14px;max-width:460px;width:100%;',
      'max-height:calc(100dvh - 32px);overflow-y:auto;padding:20px 20px 18px;position:relative;',
      'box-shadow:0 12px 48px rgba(0,0,0,.22);font-family:Inter,system-ui,sans-serif}',
      '.rep-close{position:absolute;top:12px;right:14px;background:none;border:none;cursor:pointer;',
      'font-size:18px;line-height:1;color:var(--ink-4,#999994)}',
      '.rep-close:hover{color:var(--ink,#111)}',
      '.rep-title{font-size:17px;font-weight:700;letter-spacing:-.02em;color:var(--ink,#111);margin-bottom:8px;padding-right:24px}',
      '.rep-intro{font-size:12.5px;line-height:1.55;color:var(--ink-3,#666662);margin-bottom:14px}',
      '.rep-label{display:block;font-size:9px;letter-spacing:.14em;text-transform:uppercase;',
      'color:var(--ink-4,#999994);margin:12px 0 4px;font-weight:500}',
      '.rep-input,.rep-select,.rep-area{width:100%;box-sizing:border-box;font-family:inherit;font-size:13.5px;',
      'color:var(--ink,#111);background:#fff;border:1.5px solid var(--rule,#E8E8E6);border-radius:8px;padding:9px 11px}',
      '.rep-input:focus,.rep-select:focus,.rep-area:focus{outline:none;border-color:var(--ink-4,#999994)}',
      '.rep-area{min-height:96px;resize:vertical;line-height:1.5}',
      '.rep-static{font-size:13.5px;color:var(--ink-2,#333331);padding:9px 11px;background:var(--paper-2,#F0F0EE);',
      'border-radius:8px;border:1.5px solid var(--rule,#E8E8E6)}',
      '.rep-ctx{font-size:11px;color:var(--ink-5,#BABAB6);margin-top:10px;line-height:1.45}',
      '.rep-actions{display:flex;gap:8px;align-items:center;margin-top:16px}',
      '.rep-send{flex:1;padding:11px 16px;background:var(--ink,#111);color:var(--paper,#F8F8F6);border:none;',
      'border-radius:8px;font-family:inherit;font-size:13.5px;font-weight:600;cursor:pointer;transition:opacity .15s}',
      '.rep-send:hover{opacity:.85}',
      '.rep-send:disabled{opacity:.45;cursor:default}',
      '.rep-err{font-size:12px;color:#b04020;margin-top:10px;line-height:1.45;display:none}',
      '.rep-err.show{display:block}',
      /* honeypot — pro člověka neviditelné, pro robota lákavé */
      '.rep-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none}',
      '.rep-done{text-align:center;padding:14px 4px 6px}',
      '.rep-done-ico{width:44px;height:44px;border-radius:50%;background:var(--ok,#3d7a4a);color:#fff;',
      'display:flex;align-items:center;justify-content:center;margin:0 auto 12px}',
      '.rep-done-title{font-size:16px;font-weight:700;color:var(--ink,#111);margin-bottom:6px}',
      '.rep-done-sub{font-size:13px;line-height:1.55;color:var(--ink-3,#666662)}'
    ].join('');
    document.head.appendChild(css);
  }

  /* ── DOM ── */
  function _build() {
    if (_built) return;
    _injectCss();

    var wrap = document.createElement('div');
    wrap.className = 'rep-backdrop';
    wrap.id = 'repBackdrop';
    wrap.innerHTML =
      '<div class="rep-box" id="repBox" role="dialog" aria-modal="true">' +
        '<button class="rep-close" id="repClose" aria-label="' + _esc(t('report.close')) + '">✕</button>' +
        '<div id="repForm">' +
          '<div class="rep-title">' + _esc(t('report.title')) + '</div>' +
          '<div class="rep-intro">' + _esc(t('report.intro')) + '</div>' +
          '<label class="rep-label" for="repEmail">' + _esc(t('report.email')) + '</label>' +
          '<div id="repEmailSlot"></div>' +
          '<label class="rep-label" for="repKind">' + _esc(t('report.kind')) + '</label>' +
          '<select class="rep-select" id="repKind">' +
            KINDS.map(function (k) {
              return '<option value="' + k + '">' + _esc(t('report.kind_' + k)) + '</option>';
            }).join('') +
          '</select>' +
          '<label class="rep-label" for="repMsg">' + _esc(t('report.message')) + '</label>' +
          '<textarea class="rep-area" id="repMsg" placeholder="' + _esc(t('report.message_ph')) + '"></textarea>' +
          /* Honeypot: skutečný uživatel toto pole nikdy nevyplní. Plnohodnotná
             captcha (Turnstile) by potřebovala serverové ověření, které tu
             bez backendu nemáme — bez něj by byla jen dekorace. */
          '<input class="rep-hp" id="repHp" tabindex="-1" autocomplete="off" aria-hidden="true" placeholder="Website"/>' +
          '<div class="rep-ctx" id="repCtx"></div>' +
          '<div class="rep-err" id="repErr"></div>' +
          '<div class="rep-actions">' +
            '<button class="rep-send" id="repSend">' + _esc(t('report.send')) + '</button>' +
          '</div>' +
        '</div>' +
        '<div id="repDone" style="display:none">' +
          '<div class="rep-done">' +
            '<div class="rep-done-ico">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
            '</div>' +
            '<div class="rep-done-title">' + _esc(t('report.done_title')) + '</div>' +
            '<div class="rep-done-sub">' + _esc(t('report.done_sub')) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    document.getElementById('repClose').addEventListener('click', close);
    document.getElementById('repSend').addEventListener('click', _submit);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && wrap.classList.contains('open')) close();
    });

    _built = true;
  }

  /* ── Kontext stránky ── */
  function _ctx() {
    var id = (typeof PLACE_JSON_ID !== 'undefined') ? PLACE_JSON_ID : '';
    var title = (document.getElementById('placeTitle') || {}).textContent || document.title || '';
    return { placeId: id, page: title.trim(), url: location.href, lang: window.lopLang || 'cs' };
  }

  function _showErr(msg) {
    var el = document.getElementById('repErr');
    if (el) { el.textContent = msg; el.classList.add('show'); }
  }

  function _submit() {
    var errEl = document.getElementById('repErr');
    if (errEl) errEl.classList.remove('show');

    if (document.getElementById('repHp').value) return;                 // bot
    if (Date.now() - _openedAt < MIN_FILL_MS) return _showErr(t('report.err_fast'));

    var last = parseInt(localStorage.getItem(THROTTLE_KEY) || '0', 10);
    if (Date.now() - last < THROTTLE_MS) return _showErr(t('report.err_throttle'));

    var emailEl = document.getElementById('repEmail');
    var email = emailEl ? emailEl.value.trim() : _userEmail();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return _showErr(t('report.err_email'));

    var msg = document.getElementById('repMsg').value.trim();
    if (msg.length < 10) return _showErr(t('report.err_message'));

    var ctx = _ctx();
    var btn = document.getElementById('repSend');
    btn.disabled = true;
    btn.textContent = t('report.sending');

    fetch(SUPA_URL + '/rest/v1/reports', {
      method: 'POST',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': 'Bearer ' + SUPA_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        email: email,
        kind: document.getElementById('repKind').value,
        message: msg,
        place_id: ctx.placeId,
        page_title: ctx.page,
        page_url: ctx.url,
        lang: ctx.lang
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      localStorage.setItem(THROTTLE_KEY, String(Date.now()));
      document.getElementById('repForm').style.display = 'none';
      document.getElementById('repDone').style.display = '';
    }).catch(function (err) {
      console.error('[report] odeslání selhalo:', err);
      btn.disabled = false;
      btn.textContent = t('report.send');
      _showErr(t('report.err_send'));
    });
  }

  /* ── API ── */
  function open() {
    _build();

    // E-mail: přihlášený jen zobrazíme, nepřihlášený musí vyplnit
    var slot = document.getElementById('repEmailSlot');
    var mail = _userEmail();
    slot.innerHTML = mail
      ? '<div class="rep-static" id="repEmailStatic">' + _esc(mail) + '</div>'
      : '<input class="rep-input" id="repEmail" type="email" autocomplete="email" placeholder="' + _esc(t('report.email_ph')) + '"/>';
    if (mail) {
      var hidden = document.createElement('input');
      hidden.type = 'hidden'; hidden.id = 'repEmail'; hidden.value = mail;
      slot.appendChild(hidden);
    }

    var ctx = _ctx();
    document.getElementById('repCtx').textContent = t('report.ctx', { page: ctx.page });

    document.getElementById('repForm').style.display = '';
    document.getElementById('repDone').style.display = 'none';
    document.getElementById('repMsg').value = '';
    document.getElementById('repHp').value = '';
    var btn = document.getElementById('repSend');
    btn.disabled = false; btn.textContent = t('report.send');

    document.getElementById('repBackdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
    _openedAt = Date.now();
  }

  function close() {
    var w = document.getElementById('repBackdrop');
    if (w) w.classList.remove('open');
    document.body.style.overflow = '';
  }

  window.LOP_REPORT = { open: open, close: close };
})();
