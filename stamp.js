/* ═══════════════════════════════════════════════════════════
   LayersOfPrague — generátor razítka (SVG)
   window.stampSVG(opts) → string
   window.qualityLevel(score) → 1..5
   Razítko = kruhový "otisk" v barvě kategorie. Kvalita otisku
   (podle AR skóre, po 20 %) řízena pravými SVG filtry:
     • rough  — autentický gumový otisk: rozkmit okrajů + výpadky inkoustu
     • bleed  — rozpitý / přetisk (mokré razítko, prosakující barva)
     • faded  — slabý / nedotlačený otisk (bledne)
     • skew   — křivý / dvojitý otisk (rotace + ghost)
   Orientace: arcTop · arcBoth · center · sealCastle
   Volby: eccentric (excentrický otisk + prosvítající základní kružnice),
          castle ('ink' | 'color'), dateLabel (datum místo roku)
   ═══════════════════════════════════════════════════════════ */
(function () {
  const CAT_COLOR = { hist: '#4A4A48', arch: '#3B5F84', fun: '#E0A020' };
  const CASTLE_SRC = (typeof window !== 'undefined' && window.CASTLE_DATA_URI) || 'castle.png';

  function qualityLevel(score) {
    const s = Math.max(0, Math.min(100, +score || 0));
    return Math.max(1, Math.min(5, Math.ceil(s / 20)));
  }

  function hashSeed(str) {
    let h = 0;
    for (let i = 0; i < String(str).length; i++) h = (h * 31 + str.charCodeAt(i)) % 997;
    return h;
  }

  // ── parametry degradace, indexované úrovní 1..5 (5 = ostré) ──
  const P = {
    rough: {
      disp:  { 5: 3.3, 4: 4.3, 3: 5.5, 2: 7.5, 1: 9.6 },
      slope: { 5: 9,    4: 9,   3: 8.5, 2: 8,   1: 7 },
      off:   { 5: -1.5, 4: -2.0, 3: -2.5, 2: -3.0, 1: -3.35 },
    },
    bleed: {
      rad:  { 5: 0,    4: 0.35, 3: 0.7, 2: 1.05, 1: 1.5 },
      blur: { 5: 0.22, 4: 0.5,  3: 1.0, 2: 1.7,  1: 2.6 },
    },
    faded: {
      op:    { 5: 1,    4: 0.82, 3: 0.64, 2: 0.48, 1: 0.34 },
      blur:  { 5: 0.12, 4: 0.28, 3: 0.45, 2: 0.6,  1: 0.85 },
      slope: { 4: 9,    3: 8,    2: 7,    1: 6 },
      off:   { 4: -0.8, 3: -1.7, 2: -2.4, 1: -2.8 },
    },
  };

  function buildFilter(fid, style, L, seed) {
    const fr = `x="-30%" y="-30%" width="160%" height="160%"`;
    if (style === 'bleed') {
      return `<filter id="${fid}" ${fr}>
        <feMorphology operator="dilate" radius="${P.bleed.rad[L]}" in="SourceGraphic" result="f"/>
        <feGaussianBlur in="f" stdDeviation="${P.bleed.blur[L]}"/>
      </filter>`;
    }
    if (style === 'faded') {
      const drop = L < 5
        ? `<feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" seed="${seed + 5}" result="g"/>
           <feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${P.faded.slope[L]} ${P.faded.off[L]}" result="m"/>
           <feComposite in="b" in2="m" operator="in" result="c"/>`
        : `<feOffset in="b" result="c"/>`;
      return `<filter id="${fid}" ${fr}>
        <feGaussianBlur in="SourceGraphic" stdDeviation="${P.faded.blur[L]}" result="b"/>
        ${drop}
        <feComponentTransfer in="c"><feFuncA type="linear" slope="${P.faded.op[L]}"/></feComponentTransfer>
      </filter>`;
    }
    // rough (a základ pro skew)
    const drop = `<feTurbulence type="fractalNoise" baseFrequency="0.86" numOctaves="2" seed="${seed + 3}" result="g"/>
         <feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${P.rough.slope[L]} ${P.rough.off[L]}" result="m"/>
         <feComposite in="d" in2="m" operator="in"/>`;
    return `<filter id="${fid}" ${fr}>
      <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="2" seed="${seed}" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="${P.rough.disp[L]}" xChannelSelector="R" yChannelSelector="G" result="d"/>
      ${drop}
    </filter>`;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function wrapLines(str, max) {
    const words = String(str).split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      if (!cur) cur = w;
      else if ((cur + ' ' + w).length <= max) cur += ' ' + w;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }

  const SERIF = "'Fraunces', Georgia, serif";
  const MONO = "'JetBrains Mono', ui-monospace, monospace";

  // ── znak hradu (Hradčany) — geometrie společná ──
  const CX = 100, CY = 49, CW = 46, CH = 29; // umístění nad kódem
  function castleInk(ink, uid, r) {
    r = r || { x: CX - CW / 2, y: CY, w: CW, h: CH };
    return `<mask id="cm-${uid}" style="mask-type:alpha"><image xlink:href="${CASTLE_SRC}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" preserveAspectRatio="xMidYMid meet"/></mask>
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${ink}" mask="url(#cm-${uid})"/>`;
  }
  function castleColor() {
    return `<image xlink:href="${CASTLE_SRC}" x="${CX - CW / 2}" y="${CY}" width="${CW}" height="${CH}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  // ── prázdný / nezískaný slot ──
  function emptySVG(o) {
    const ink = '#aeb1a8';
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;overflow:visible">
      <circle cx="100" cy="100" r="92" fill="none" stroke="${ink}" stroke-width="1.4" stroke-dasharray="3 5" opacity="0.42"/>
      <circle cx="100" cy="100" r="82" fill="none" stroke="${ink}" stroke-width="0.8" stroke-dasharray="2 5" opacity="0.3"/>
      <text x="100" y="108" text-anchor="middle" font-family="${MONO}" font-size="22" font-weight="600" fill="${ink}" opacity="0.4" letter-spacing="1.5">${esc(o.code || '???')}</text>
      <text x="100" y="132" text-anchor="middle" font-family="${MONO}" font-size="8" fill="${ink}" opacity="0.4" letter-spacing="3">NEZÍSKÁNO</text>
    </svg>`;
  }

  function stampSVG(o) {
    o = o || {};
    if (o.locked || o.empty) return emptySVG(o);
    const cat = o.cat || 'hist';
    const ink = CAT_COLOR[cat] || '#4A4A48';
    const code = o.code || 'H000';
    const name = o.name || '';
    const year = o.year || '';
    const orientation = o.orientation || 'arcTop';
    const style = o.style || 'rough';
    const L = qualityLevel(o.score == null ? 100 : o.score);
    const seed = hashSeed(code + name);
    const uid = o.uid || (code + '-' + style + '-' + orientation + '-' + L + '-' + (o.k || 0));
    const fid = 'stf-' + uid;
    const topId = 'tp-' + uid;
    const botId = 'bp-' + uid;
    const datId = 'dt-' + uid;

    // rotace + excentricita: perfektní při 100 % (náklon 0°, vystředěno),
    // čím nižší skóre, tím víc křivé a excentrické
    const dir = seed % 2 ? 1 : -1;
    const scoreVal = o.score == null ? 100 : o.score;
    const miss = Math.min(1, Math.max(0, (100 - scoreVal) / 70));
    let rot = 0, dx = 0, dy = 0;
    if (o.eccentric) {
      const sr = ((seed % 9) - 4) / 4;
      const mag = style === 'skew' ? 13 : 8.5;
      rot = ((sr || 0.5) * mag + dir * 2) * miss;
      const ox = ((seed * 3) % 11) - 5;
      const oy = ((seed * 5) % 9) - 4;
      dx = (ox >= 0 ? 1 : -1) * (3.5 + Math.abs(ox)) * 1.4 * miss;
      dy = (oy >= 0 ? 1 : -1) * (3.5 + Math.abs(oy)) * 1.4 * miss;
    } else {
      rot = (style === 'skew' ? 1.7 : 0.7) * dir * miss;
    }
    // šedý kruh vymezení ("nezískané") vždy pod každým razítkem
    const baseRing = `<circle cx="100" cy="100" r="94" fill="none" stroke="#aeb1a8" stroke-width="1.2" stroke-dasharray="2 6" opacity="0.5"/>`;

    const filterMarkup = buildFilter(fid, style === 'skew' ? 'rough' : style, L, seed);

    const rings =
      `<circle cx="100" cy="100" r="94" fill="none" stroke="${ink}" stroke-width="3.4"/>
       <circle cx="100" cy="100" r="85.5" fill="none" stroke="${ink}" stroke-width="1"/>`;

    let inner = '';
    let extraCastle = '';

    if (orientation === 'sealCastle') {
      // E/F: hrad nad kódem · jméno nahoře · datum + LAYERS OF PRAGUE po obloucích dole
      const castleMode = o.castle || 'ink';
      const dateTxt = (o.dateLabel || year || '').toString();
      if (castleMode === 'color') extraCastle = castleColor();
      inner = `${rings}
        <defs>
          <path id="${topId}" d="M 28 100 A 72 72 0 0 1 172 100"/>
          <path id="${datId}" d="M 45 100 A 55 55 0 0 0 155 100"/>
          <path id="${botId}" d="M 27 100 A 73 73 0 0 0 173 100"/>
        </defs>
        <text font-family="${MONO}" font-size="11" font-weight="500" letter-spacing="2" fill="${ink}">
          <textPath href="#${topId}" startOffset="50%" text-anchor="middle">${esc(name.toUpperCase())}</textPath>
        </text>
        ${castleMode === 'ink' ? castleInk(ink, uid) : ''}
        <text x="100" y="116" text-anchor="middle" font-family="${SERIF}" font-size="36" font-weight="600" fill="${ink}" letter-spacing="1">${esc(code)}</text>
        <text font-family="${MONO}" font-size="8" letter-spacing="1.5" fill="${ink}">
          <textPath href="#${datId}" startOffset="50%" text-anchor="middle">★ ${esc(dateTxt)} ★</textPath>
        </text>
        <text font-family="${MONO}" font-size="8.5" letter-spacing="3" fill="${ink}">
          <textPath href="#${botId}" startOffset="50%" text-anchor="middle">LAYERS OF PRAGUE</textPath>
        </text>`;
    } else if (orientation === 'sealF') {
      // finální F: Layers of Prague + datum nahoře, hrad větší, kód, název dole
      const dateTxt = (o.dateLabel || year || '').toString();
      const dId = 'df-' + uid;
      inner = `${rings}
        <defs>
          <path id="${topId}" d="M 26 100 A 74 74 0 0 1 174 100"/>
          <path id="${dId}" d="M 42 100 A 58 58 0 0 1 158 100"/>
          <path id="${botId}" d="M 27 100 A 73 73 0 0 0 173 100"/>
        </defs>
        <text font-family="${MONO}" font-size="8.5" font-weight="500" letter-spacing="3" fill="${ink}">
          <textPath href="#${topId}" startOffset="50%" text-anchor="middle">LAYERS OF PRAGUE</textPath>
        </text>
        <text font-family="${MONO}" font-size="8.5" letter-spacing="1.5" fill="${ink}">
          <textPath href="#${dId}" startOffset="50%" text-anchor="middle">${esc(dateTxt)}</textPath>
        </text>
        ${castleInk(ink, uid, { x: 73, y: 57, w: 54, h: 33 })}
        <text x="100" y="122" text-anchor="middle" font-family="${SERIF}" font-size="33" font-weight="600" fill="${ink}" letter-spacing="1">${esc(code)}</text>
        <text font-family="${MONO}" font-size="10.5" font-weight="500" letter-spacing="2" fill="${ink}">
          <textPath href="#${botId}" startOffset="50%" text-anchor="middle">${esc(name.toUpperCase())}</textPath>
        </text>`;
    } else if (orientation === 'center') {
      const lines = wrapLines(name.toUpperCase(), 12);
      const ly = 118 - (lines.length - 1) * 8;
      const nameTsp = lines.map((l, i) =>
        `<tspan x="100" dy="${i === 0 ? 0 : 15}">${esc(l)}</tspan>`).join('');
      inner = `${rings}
        <circle cx="100" cy="100" r="73" fill="none" stroke="${ink}" stroke-width="0.7" opacity="0.5"/>
        <text x="100" y="58" text-anchor="middle" font-family="${MONO}" font-size="7.5" letter-spacing="3" fill="${ink}">LAYERS OF PRAGUE</text>
        <text x="100" y="92" text-anchor="middle" font-family="${SERIF}" font-size="34" font-weight="600" fill="${ink}" letter-spacing="1">${esc(code)}</text>
        <text y="${ly}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="11.5" font-weight="500" fill="${ink}" letter-spacing="0.5">${nameTsp}</text>
        <text x="100" y="156" text-anchor="middle" font-family="${MONO}" font-size="9" letter-spacing="2" fill="${ink}">★ ${esc(year)} ★</text>`;
    } else if (orientation === 'arcBoth') {
      inner = `${rings}
        <defs>
          <path id="${topId}" d="M 26 100 A 74 74 0 0 1 174 100"/>
          <path id="${botId}" d="M 26 100 A 74 74 0 0 0 174 100"/>
        </defs>
        <text font-family="${MONO}" font-size="11" font-weight="500" letter-spacing="2.5" fill="${ink}">
          <textPath href="#${topId}" startOffset="50%" text-anchor="middle">${esc(name.toUpperCase())}</textPath>
        </text>
        <text font-family="${MONO}" font-size="8.5" letter-spacing="3" fill="${ink}">
          <textPath href="#${botId}" startOffset="50%" text-anchor="middle">LAYERS OF PRAGUE ★ ${esc(year)}</textPath>
        </text>
        <text x="100" y="108" text-anchor="middle" font-family="${SERIF}" font-size="40" font-weight="600" fill="${ink}" letter-spacing="1">${esc(code)}</text>
        <line x1="62" y1="124" x2="138" y2="124" stroke="${ink}" stroke-width="0.7" opacity="0.55"/>`;
    } else {
      // arcTop (výchozí)
      inner = `${rings}
        <defs><path id="${topId}" d="M 28 100 A 72 72 0 0 1 172 100"/></defs>
        <text font-family="${MONO}" font-size="11.5" font-weight="500" letter-spacing="2" fill="${ink}">
          <textPath href="#${topId}" startOffset="50%" text-anchor="middle">${esc(name.toUpperCase())}</textPath>
        </text>
        <text x="100" y="104" text-anchor="middle" font-family="${SERIF}" font-size="40" font-weight="600" fill="${ink}" letter-spacing="1">${esc(code)}</text>
        <text x="100" y="132" text-anchor="middle" font-family="${MONO}" font-size="9" letter-spacing="2.5" fill="${ink}">★ ${esc(year)} ★</text>`;
    }

    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="width:100%;height:100%;display:block;overflow:visible">
      <defs>${filterMarkup}</defs>
      ${baseRing}
      <g transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${rot.toFixed(2)} 100 100)">
        <g filter="url(#${fid})" opacity="0.92">${inner}</g>
        ${extraCastle}
      </g>
    </svg>`;
  }

  window.stampSVG = stampSVG;
  window.qualityLevel = qualityLevel;
  window.CAT_COLOR = CAT_COLOR;
})();
