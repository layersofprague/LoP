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

/* Verze v dotazu — bez ní podává GitHub Pages starou translations.json
   z cache a chybějící klíče se vypisují doslova ("overview.geo_short"). */
const LOP_DATA_VER = '20260826';

(function _load() {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', _root() + 'translations.json?v=' + LOP_DATA_VER, false);
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.send();
    if (xhr.status === 200) _T = JSON.parse(xhr.responseText);
    else console.warn('[i18n] translations.json nenalezen, status:', xhr.status);
  } catch (e) {
    console.warn('[i18n] Chyba načtení:', e);
  }
/* ── Kontrola nevyhodnocených šablon ──
   `${t('klíč')}` funguje jen uvnitř template literalu. Ve statickém HTML
   se nevyhodnotí a vypíše se doslova. Chyba je tichá — text vypadá jako
   text — proto ji hlásíme do konzole s odkazem na konkrétní prvek. */
function _lopCheckTemplates() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const found = [];
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeValue.includes('${t(') || n.nodeValue.includes('${ t(')) {
      found.push({ text: n.nodeValue.trim().slice(0, 70), el: n.parentElement });
    }
  }
  document.querySelectorAll('[title],[data-tooltip],[alt],[placeholder]').forEach(el => {
    ['title', 'data-tooltip', 'alt', 'placeholder'].forEach(a => {
      const v = el.getAttribute(a);
      if (v && v.includes('${t(')) found.push({ text: a + '="' + v.slice(0, 60) + '"', el: el });
    });
  });
  if (found.length) {
    console.warn('[i18n] ' + found.length + '× nevyhodnocená šablona ve statickém HTML '
      + '— patří do template literalu v JS, nebo dát prvku id a nastavit textContent:');
    found.forEach(f => console.warn('   ', f.text, f.el));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _lopCheckTemplates);
} else {
  _lopCheckTemplates();
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

/* ── Existuje klíč? ──
   Pro nepovinné texty (např. kurátorský titul čtvrti, který nemají všechny),
   kde by t() zbytečně hlásil chybějící klíč do konzole. */
window.lopHasKey = function (key) {
  return Object.prototype.hasOwnProperty.call(_T, key);
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
window.lopDataVer = LOP_DATA_VER;

window.lopPlural = function (n, one, few, many) {
  if (LANG === 'cs') {
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return few ?? many;
    return many;
  }
  return n === 1 ? one : (many ?? one + 's');
};

})();
