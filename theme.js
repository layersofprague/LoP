/* ══════════════════════════════════════════════════════════
   theme.js — světlý / tmavý / automatický režim

   MUSÍ být v <head> před vykreslením, jinak stránka blikne světlou
   barvou, než se aplikuje uložená volba.

   Režimy: 'light' (výchozí) · 'dark' · 'auto' (podle východu a západu
   slunce v Praze).

   Deklarace `color-scheme` brání prohlížečům (Samsung Internet, Chrome
   „Auto Dark Theme“) násilně invertovat barvy. Pokud si ale uživatel
   v prohlížeči zapne vynucení tmavého režimu na všech webech, přebije
   to i tuhle deklaraci — to je jeho volba přístupnosti a nejde ji
   obejít. Nastavení proto nabízí nápovědu, jak to v prohlížeči vypnout.
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'lop_theme';
  var MODES = ['light', 'dark', 'auto'];

  /* Souřadnice Prahy natvrdo — aplikace je o Praze, takže nemá smysl
     kvůli tomu žádat o přístup k poloze. */
  var PRAHA_LAT = 50.0755, PRAHA_LNG = 14.4378;

  /* ── Východ a západ slunce ──
     Standardní „sunrise equation“. Ověřeno proti slunovratům
     i rovnodennosti, odchylka do jedné minuty. */
  function _sunTimes(date) {
    var rad = Math.PI / 180;
    var toJulian = function (d) { return d.valueOf() / 86400000 + 2440587.5; };
    var toDate   = function (j) { return new Date((j - 2440587.5) * 86400000); };

    var lw = -PRAHA_LNG;                              // vzorec pracuje se západní délkou
    var n  = Math.round(toJulian(date) - 2451545.0 + 0.0008);
    var Js = n + lw / 360;
    var M  = (357.5291 + 0.98560028 * Js) % 360;      // střední anomálie
    var C  = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad)
           + 0.0003 * Math.sin(3 * M * rad);          // rovnice středu
    var lam = (M + C + 180 + 102.9372) % 360;         // ekliptikální délka
    var Jt  = 2451545.0 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lam * rad);

    var sinD = Math.sin(lam * rad) * Math.sin(23.44 * rad);
    var cosD = Math.cos(Math.asin(sinD));
    var cosW = (Math.sin(-0.833 * rad) - Math.sin(PRAHA_LAT * rad) * sinD)
             / (Math.cos(PRAHA_LAT * rad) * cosD);

    if (cosW >= 1 || cosW <= -1) return null;         // polární den / noc
    var w = Math.acos(cosW) / rad;
    return { rise: toDate(Jt - w / 360), set: toDate(Jt + w / 360) };
  }

  function _isNight(now) {
    now = now || new Date();
    var t = _sunTimes(now);
    if (!t) return false;                             // polární případ → světlý
    var ms = now.valueOf();
    return ms < t.rise.valueOf() || ms > t.set.valueOf();
  }

  /* ── Stav ── */
  function _storedMode() {
    try {
      var v = localStorage.getItem(KEY);
      return MODES.indexOf(v) !== -1 ? v : null;
    } catch (e) { return null; }
  }

  function _effective(mode) {
    return mode === 'auto' ? (_isNight() ? 'dark' : 'light') : mode;
  }

  function _apply(theme) {
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;                   // scrollbary, formuláře
    var cs = document.querySelector('meta[name="color-scheme"]');
    if (cs) cs.setAttribute('content', theme);
    var tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute('content', theme === 'dark' ? '#0F0F0D' : '#1a1a18');
  }

  var _mode = _storedMode() || 'light';
  _apply(_effective(_mode));

  window.lopThemeMode = _mode;                 // volba uživatele
  window.lopTheme     = _effective(_mode);     // co je právě vykreslené

  function _refresh() {
    var eff = _effective(_mode);
    if (eff === window.lopTheme) return;              // nic se nemění
    window.lopTheme = eff;
    _apply(eff);
    document.dispatchEvent(new CustomEvent('lop:themechange', {
      detail: { mode: _mode, theme: eff }
    }));
  }

  window.lopSetTheme = function (mode) {
    if (MODES.indexOf(mode) === -1) return;
    _mode = mode;
    window.lopThemeMode = mode;
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    _refresh();
  };

  /* V automatickém režimu se musí přepnout i bez reloadu — kontrola
     jednou za minutu a při návratu na kartu (telefon uspaný přes soumrak). */
  setInterval(function () { if (_mode === 'auto') _refresh(); }, 60000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && _mode === 'auto') _refresh();
  });

  /* Pro popisek v nastavení: kdy dnes vychází a zapadá slunce. */
  window.lopSunTimes = function () { return _sunTimes(new Date()); };

  /* ══════════════════════════════════════════════════════
     MĚŘÍTKO STRÁNKY

     Obdoba Ctrl+kolečko na počítači. Na stránkách s vlastními gesty
     (mapa, fullscreen fotek) je nativní zvětšování prsty vypnuté, aby
     se gesta nepraly — tenhle přepínač je náhrada, která funguje všude
     včetně PWA.

     Používá CSS `zoom`, ne velikost písma: projekt má rozměry v px,
     takže změna kořenového písma by na většinu prvků neměla vliv.
     ══════════════════════════════════════════════════════ */
  var SKEY = 'lop_scale';
  var STEPS = [0.9, 1, 1.1, 1.25, 1.5];

  function _storedScale() {
    try {
      var v = parseFloat(localStorage.getItem(SKEY));
      return STEPS.indexOf(v) !== -1 ? v : null;
    } catch (e) { return null; }
  }

  function _applyScale(v) {
    // Při 100 % se vlastnost odstraní úplně, ať do vykreslování nezasahuje
    document.documentElement.style.zoom = (v === 1) ? '' : String(v);
  }

  var _scale = _storedScale() || 1;
  _applyScale(_scale);
  window.lopScale = _scale;
  window.lopScaleSteps = STEPS;

  window.lopSetScale = function (v) {
    if (STEPS.indexOf(v) === -1) return;
    _scale = v;
    window.lopScale = v;
    try { localStorage.setItem(SKEY, String(v)); } catch (e) {}
    _applyScale(v);
    // Leaflet si drží rozměry v paměti a po změně měřítka je má špatně
    document.dispatchEvent(new CustomEvent('lop:scalechange', { detail: { scale: v } }));
  };

  /* Posun o krok nahoru/dolů; vrací true, pokud se něco změnilo. */
  window.lopScaleStep = function (dir) {
    var i = STEPS.indexOf(window.lopScale);
    if (i === -1) i = STEPS.indexOf(1);
    var next = i + (dir > 0 ? 1 : -1);
    if (next < 0 || next >= STEPS.length) return false;
    window.lopSetScale(STEPS[next]);
    return true;
  };
})();
