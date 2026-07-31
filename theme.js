/* ══════════════════════════════════════════════════════════
   theme.js — světlý / tmavý režim

   MUSÍ být první skript v <head>, jinak stránka při načtení blikne
   světlou barvou, než se aplikuje uložená volba.

   Výchozí je SVĚTLÝ režim a deklaruje se přes `color-scheme`, což
   zabrání prohlížečům (Samsung Internet „Dark mode", Chrome
   „Auto Dark Theme“) násilně invertovat barvy. Bez téhle deklarace
   si prohlížeč myslí, že web o barevných schématech nic neví,
   a přebarví ho za nás.

   Pozor: pokud si uživatel v prohlížeči zapne vynucení tmavého
   režimu „na všech webech“, přebije to i tuhle deklaraci. To je
   jeho volba přístupnosti a nejde (ani by se nemělo) obcházet.
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'lop_theme';
  var VALID = ['light', 'dark'];

  function _stored() {
    try {
      var v = localStorage.getItem(KEY);
      return VALID.indexOf(v) !== -1 ? v : null;
    } catch (e) { return null; }
  }

  /* Záměrně se neřídíme prefers-color-scheme — výchozí je světlý režim
     a tmavý si uživatel volí ručně v nastavení. */
  function _apply(theme) {
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Vlastní vykreslování prvků prohlížeče (scrollbary, formuláře)
    root.style.colorScheme = theme;
  }

  var _current = _stored() || 'light';
  _apply(_current);

  window.lopTheme = _current;

  window.lopSetTheme = function (theme) {
    if (VALID.indexOf(theme) === -1) return;
    _current = theme;
    window.lopTheme = theme;
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    _apply(theme);

    // Barva systémové lišty prohlížeče
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0F0F0D' : '#1a1a18');

    document.dispatchEvent(new CustomEvent('lop:themechange', { detail: { theme: theme } }));
  };
})();
