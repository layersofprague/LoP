/* ═══════════════════════════════════════════════════
   LayersOfPrague — tags.js
   Slovník tagů. Pouze STRUKTURA, žádné labely.
   Labely žijí v translations.json pod klíči tag.<slug>
   Načítat jako <script src="tags.js"></script> PŘED nav.js
   ═══════════════════════════════════════════════════ */

(function () {

/* ── SLOHY ──
   Kódy odpovídají STYLE_NAMES v map.html a poli styleCode v a-map.json.
   Místo nese jeden sloh v poli `style`, ne v `tags`. */
const STYLES = {
  Ro: { key: 'style.romanesque'      },
  Go: { key: 'style.gothic'          },
  Op: { key: 'style.fortification'   },
  Re: { key: 'style.renaissance'     },
  Ba: { key: 'style.baroque'         },
  Kl: { key: 'style.classicism'      },
  Hi: { key: 'style.historicism'     },
  Se: { key: 'style.artnouveau'      },
  Ku: { key: 'style.cubism'          },
  Mo: { key: 'style.modernism'       },
  Fu: { key: 'style.functionalism'   },
  So: { key: 'style.sorela'          },
  Br: { key: 'style.brutalism'       },
  In: { key: 'style.industrial'      },
  De: { key: 'style.deconstructivism'},
  Sa: { key: 'style.contemporary'    },
  U:  { key: 'style.publicart'       },
};

/* ── TYPOLOGIE ──
   Slug → { kind }. Slug jde do URL (?tag=tower) a do places.json.
   Nikdy neměnit — je to veřejný identifikátor.
   kind: 'building' | 'space' | 'infra' | 'object' | 'theme' */
const TAGS = {
  /* stavby */
  'building':     { kind: 'building' },
  'tower':        { kind: 'building' },
  'castle':       { kind: 'building' },
  'cathedral':    { kind: 'building' },
  'church':       { kind: 'building' },
  'monastery':    { kind: 'building' },
  'synagogue':    { kind: 'building' },
  'palace':       { kind: 'building' },
  'villa':        { kind: 'building' },
  'theatre':      { kind: 'building' },
  'museum':       { kind: 'building' },
  'factory':      { kind: 'building' },
  'brewery':      { kind: 'building' },
  'warehouse':    { kind: 'building' },

  /* prostory */
  'square':       { kind: 'space' },
  'park':         { kind: 'space' },
  'garden':       { kind: 'space' },
  'cemetery':     { kind: 'space' },
  'courtyard':    { kind: 'space' },
  'waterfront':   { kind: 'space' },

  /* infrastruktura */
  'bridge':       { kind: 'infra' },
  'port':         { kind: 'infra' },
  'railway':      { kind: 'infra' },
  'station':      { kind: 'infra' },
  'fortification':{ kind: 'infra' },
  'bastion':      { kind: 'infra' },
  'gate':         { kind: 'infra' },
  'waterworks':   { kind: 'infra' },

  /* objekty */
  'monument':     { kind: 'object' },
  'statue':       { kind: 'object' },
  'fountain':     { kind: 'object' },
  'clock':        { kind: 'object' },

  /* neformální lokality — čtvrti, které katastr nezná, ale lidé je používají */
  'letna':        { kind: 'locality' },
  'bubny':        { kind: 'locality' },
  'kampa':        { kind: 'locality' },
  'petrin':       { kind: 'locality' },
  'naplavka':     { kind: 'locality' },
  'stvanice':     { kind: 'locality' },

  /* témata */
  'communism':    { kind: 'theme' },
  'demolished':   { kind: 'theme' },
  'unesco':       { kind: 'theme' },
  'river':        { kind: 'theme' },
};


/* ── KATASTRÁLNÍ ÚZEMÍ ──
   Praha jich má 112. `pr` = primární městský obvod.
   Katastry rozdělené mezi víc obvodů mají `split: true` — u těch se
   obvod ukládá u místa, neodvozuje se odsud. */
const DISTRICTS = {
  'stare-mesto':  { pr: 1 },
  'nove-mesto':   { pr: 1, split: true },   // menší část Praha 2
  'mala-strana':  { pr: 1 },
  'hradcany':     { pr: 1 },
  'josefov':      { pr: 1 },
  'vysehrad':     { pr: 2 },
  'vinohrady':    { pr: 2, split: true },   // též Praha 3, 10
  'zizkov':       { pr: 3 },
  'karlin':       { pr: 8 },
  'holesovice':   { pr: 7 },
  'bubenec':      { pr: 6, split: true },   // 48 % Praha 6, 52 % Praha 7
  'dejvice':      { pr: 6 },
  'brevnov':      { pr: 6 },
  'stresovice':   { pr: 6 },
  'smichov':      { pr: 5 },
  'nusle':        { pr: 4, split: true },   // též Praha 2
  'podoli':       { pr: 4 },
  'vrsovice':     { pr: 10 },
  'liben':        { pr: 8, split: true },   // též Praha 7, 9
  'troja':        { pr: 7 },
};

/* ── ALIASY ──
   Starý slug → kanonický. Plnit AŽ při skutečném přejmenování slugu,
   který už je venku v URL. Předem vymýšlené aliasy jsou jen balast. */
const ALIASES = {
};

/* ── API ── */
window.LOP_TAGS = {
  styles:    STYLES,
  tags:      TAGS,
  districts: DISTRICTS,
  aliases:   ALIASES,

  /** Kanonický slug (rozřeší alias, ořízne diakritiku a mezery) */
  canon(slug) {
    if (!slug) return null;
    const s = String(slug).trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
    return ALIASES[s] || (TAGS[s] ? s : null);
  },

  /** Přeložený label tagu. Fallback = slug. */
  label(slug) {
    const s = this.canon(slug);
    if (!s) return slug;
    return (window.t ? window.t('tag.' + s) : null) || s;
  },

  /** Přeložený název slohu podle kódu. Fallback = kód. */
  styleLabel(code) {
    const st = STYLES[code];
    if (!st) return code;
    return (window.t ? window.t(st.key) : null) || code;
  },

  /** Existuje slug ve slovníku? (pro validaci places.json) */
  isValid(slug) { return this.canon(slug) !== null; },

  /** Přeložený název katastru. Fallback = slug. */
  districtLabel(slug) {
    if (!slug) return slug;
    return (window.t ? window.t('district.' + slug) : null) || slug;
  },

  /** Zobrazovací lokalita: "Holešovice, Praha 7" */
  placeLocation(place) {
    const d = this.districtLabel(place.district);
    const n = place.prague || (DISTRICTS[place.district] || {}).pr;
    return n ? d + ', Praha ' + n : d;
  },

  /** Seznam slugů daného druhu */
  byKind(kind) {
    return Object.keys(TAGS).filter(s => TAGS[s].kind === kind);
  },
};

})();
