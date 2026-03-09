#!/usr/bin/env node
(async () => {
  const q = process.argv.slice(2).join(' ').trim();
  if (!q) {
    console.error('Usage: node scripts/search_rmp.js "query"');
    process.exit(1);
  }

  const userAgent = 'node-fetch';
  const qEnc = encodeURIComponent(q);

  async function tryRmpSite(query) {
    const url = `https://www.ratemyprofessors.com/search/teachers?query=${encodeURIComponent(query)}`;
    try {
      const r = await fetch(url, { headers: { 'User-Agent': userAgent } });
      console.error(`[debug] RMP site fetch ${r.status} ${r.statusText} -> ${url}`);
      if (!r.ok) return null;
      return await r.text();
    } catch (e) {
      console.error('[debug] RMP site fetch error', e && e.message ? e.message : e);
      return null;
    }
  }

  async function tryDuckDuckGo(query) {
    const url = `https://duckduckgo.com/html/?q=site:ratemyprofessors.com+${encodeURIComponent(query)}`;
    const r = await fetch(url, { headers: { 'User-Agent': userAgent } });
    console.error(`[debug] DuckDuckGo fetch ${r.status} ${r.statusText} -> ${url}`);
    if (!r.ok) throw new Error(`DuckDuckGo fetch failed: ${r.status}`);
    return await r.text();
  }

  function parseHtmlForLinks(html) {
    // Match all anchors and inspect hrefs. Support DuckDuckGo redirect links with uddg= encoded target.
    const re = /<a[^>]*href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/a>/gi;
    const results = [];
    let m;
    while ((m = re.exec(html)) && results.length < 40) {
      try {
        const href = m[1];
        const rawText = m[2].replace(/<[^>]+>/g, '').trim();
        if (!rawText) continue;

        let finalUrl = null;

        if (/ratemyprofessors\.com/.test(href)) {
          finalUrl = href.startsWith('http') ? href : `https://www.ratemyprofessors.com${href}`;
        } else {
          // detect DuckDuckGo redirect with uddg param
          const ddMatch = href.match(/[?&]uddg=([^&]+)/);
          if (ddMatch && ddMatch[1]) {
            try {
              const dec = decodeURIComponent(ddMatch[1]);
              if (/ratemyprofessors\.com/.test(dec)) finalUrl = dec;
            } catch (_) {}
          }
          // some duckduckgo links use /l/?kh=...&uddg=...
          const urlObjMatch = href.match(/uddg=([^&]+)/);
          if (!finalUrl && urlObjMatch) {
            try {
              const dec2 = decodeURIComponent(urlObjMatch[1]);
              if (/ratemyprofessors\.com/.test(dec2)) finalUrl = dec2;
            } catch (_) {}
          }
        }

        if (finalUrl) {
          results.push({ name: rawText, url: finalUrl });
          if (results.length >= 20) break;
        }
      } catch (e) {
        // ignore parse errors for individual anchors
      }
    }
    return results;
  }

  try {
    let html = await tryRmpSite(q);
    if (!html) html = await tryDuckDuckGo(q);

    const results = parseHtmlForLinks(html);

    if ((!results || results.length === 0) && html) {
      try {
        const tmpPath = require('path').join(process.cwd(), 'tmp_rmp_debug.html');
        require('fs').writeFileSync(tmpPath, html, 'utf8');
        console.error('[debug] No links parsed — saved fetched HTML to', tmpPath);
        console.error('[debug] HTML snippet:', html.slice(0, 800).replace(/\n/g, ' '));
      } catch (e) {
        console.error('[debug] Failed saving debug HTML', e && e.message ? e.message : e);
      }
    }

    // Remove duplicates and keep first occurrences
    const seen = new Set();
    const uniq = [];
    for (const r of results) {
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      uniq.push(r);
    }

    console.log(JSON.stringify({ query: q, count: uniq.length, results: uniq.slice(0, 10) }, null, 2));
    console.log('\nResults:');
    uniq.slice(0, 10).forEach((r, i) => console.log(`${i + 1}. ${r.name} - ${r.url}`));
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
})();
