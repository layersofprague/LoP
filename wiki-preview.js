/* ═══════════════ WIKI PREVIEW ═══════════════
   Živý náhled z Wikipedie pro pracovní vrstvu (places-development.json) —
   dočasné řešení ("teaser" budoucího stavu), dokud místa nemají vlastní
   fotky a lede texty. Používá oficiální REST API Wikipedie
   (page/summary), žádný klíč není potřeba, CORS povolen.

   Použití: window.lopWikiPreview(wikiUrl) -> Promise<{thumbnail, extract} | null>
   - thumbnail: URL obrázku (nebo null, pokud článek žádný nemá)
   - extract:   krátký text článku (celý, nekrácený — krácení řeší volající)

   Cachuje v paměti jen pro tuhle session (žádný localStorage) — při
   refreshi stránky se natáhne znovu, což je v pořádku, jde o pár desítek
   míst max, ne stovky dotazů najednou. */
(function () {
  const cache = new Map();

  window.lopWikiPreview = function (wikiUrl) {
    if (!wikiUrl) return Promise.resolve(null);
    if (cache.has(wikiUrl)) return cache.get(wikiUrl);

    const parts = wikiUrl.split('/wiki/');
    const title = parts[1];
    if (!title) return Promise.resolve(null);

    // Zachovat doménu (cs.wikipedia.org i případně en.wikipedia.org),
    // ať to funguje i pro budoucí anglické odkazy.
    const host = wikiUrl.match(/^https?:\/\/([^/]+)/)?.[1] || 'cs.wikipedia.org';
    const apiUrl = `https://${host}/api/rest_v1/page/summary/${title}`;

    const promise = fetch(apiUrl)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return null;
        return {
          thumbnail: data.thumbnail ? data.thumbnail.source : null,
          extract: data.extract || ''
        };
      })
      .catch(() => null);

    cache.set(wikiUrl, promise);
    return promise;
  };
})();
