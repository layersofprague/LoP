/* ═══════════════════════════════════════════════════
   LayersOfPrague — i18n.js
   Jeden soubor (translations.json) pro všechny jazyky.
   Načíst jako PRVNÍ skript na každé stránce.

   Přidání jazyka:
     1. Přidat 'xx' do SUPPORTED_LANGS
     2. Ke každému klíči v translations.json přidat "xx": "..."
     3. Přidat tlačítko do header.js
   ═══════════════════════════════════════════════════ */

(function () {

const SUPPORTED_LANGS = ['cs', 'en'];
const DEFAULT_LANG    = 'cs';
const STORAGE_KEY     = 'lop_lang';

function _root() {
  const parts = location.pathname.split('/').filter(Boolean);
  const depth = parts.length - 1;
  if (depth <= 1) return './';
  return '../'.repeat(depth - 1);
}

function _detectLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  const browser = (navigator.language || '').slice(0, 2).toLowerCase();
  if (SUPPORTED_LANGS.includes(browser)) return browser;
  return DEFAULT_LANG;
}

const LANG = _detectLang();
window.lopLang = LANG;

/* ── Načtení synchronně (před renderem) ── */
let _T = {};

(function _load() {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', _root() + 'translations.json', false);
    xhr.send();
    if (xhr.status === 200) _T = JSON.parse(xhr.responseText);
    else console.warn('[i18n] translations.json nenalezen, status:', xhr.status);
  } catch (e) {
    console.warn('[i18n] Chyba načtení:', e);
  }
})();

/* ── t('key') — překlad s volitelnou interpolací ── */
// t('auth.ok_reset', { email: 'a@b.cz' }) → "Odkaz byl odeslán na a@b.cz."
window.t = function (key, vars) {
  const entry = _T[key];
  if (!entry) { console.warn('[i18n] Chybí klíč:', key); return key; }
  let str = entry[LANG] ?? entry[DEFAULT_LANG] ?? key;
  if (vars) {
    Object.keys(vars).forEach(k => {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    });
  }
  return str;
};

/* ── Přepnutí jazyka ── */
window.lopSetLang = function (lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  localStorage.setItem(STORAGE_KEY, lang);
  location.reload();
};

/* ── Plurál ── */
// cs: lopPlural(3, 'razítko', 'razítka', 'razítek') → 'razítka'
// en: lopPlural(3, 'stamp', null, 'stamps') → 'stamps'
window.lopPlural = function (n, one, few, many) {
  if (LANG === 'cs') {
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return few ?? many;
    return many;
  }
  return n === 1 ? one : (many ?? one + 's');
};

})();
