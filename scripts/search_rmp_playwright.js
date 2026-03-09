const { chromium } = require('playwright');

(async () => {
  const q = process.argv.slice(2).join(' ').trim();
  if (!q) { console.error('Usage: node scripts/search_rmp_playwright.js "query"'); process.exit(1); }

  const url = `https://www.ratemyprofessors.com/search/teachers?query=${encodeURIComponent(q)}`;
  const browser = await chromium.launch({ headless: true });
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const context = await browser.newContext({ userAgent, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Give scripts some time to run and render
    await page.waitForTimeout(3000);

    const selectors = ['a[href*="/professor/"]', 'a[href*="ShowRatings.jsp"]', 'a[href*="RateMyProfessor"]'];
    let results = [];
    for (const sel of selectors) {
      try {
        const items = await page.$$eval(sel, (els) => els.map(e => ({ name: (e.textContent||'').trim(), url: (e.href||'').toString() })).filter(i=>i.name && i.url));
        if (items && items.length) {
          results = results.concat(items);
        }
      } catch (e) {}
    }

    // Deduplicate by url
    const seen = new Set();
    const uniq = [];
    for (const r of results) {
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      uniq.push(r);
    }

    if ((!uniq || uniq.length === 0)) {
      // save page HTML for debugging
      try {
        const fs = require('fs');
        const p = require('path').join(process.cwd(), 'tmp_rmp_playwright.html');
        const content = await page.content();
        fs.writeFileSync(p, content, 'utf8');
        console.error('[debug] no results extracted; saved page HTML to', p);
        console.error('[debug] snippet:', content.slice(0,800).replace(/\n/g,' '));
      } catch (e) {
        console.error('[debug] failed saving page HTML', e && e.message ? e.message : e);
      }
    }

      // If no results found, try DuckDuckGo rendered search results and decode redirects
      if (results.length === 0) {
        try {
          const ddq = `https://duckduckgo.com/?q=site:ratemyprofessors.com+${encodeURIComponent(q)}`;
          await page.goto(ddq, { waitUntil: 'networkidle' });
          await page.waitForTimeout(1200);
          const ddItems = await page.$$eval('a.result__a', (els) => els.map(e => ({ href: e.getAttribute('href') || '', text: (e.textContent||'').trim() })));
          for (const it of ddItems) {
            try {
              let href = it.href || '';
              // DuckDuckGo may use /l/?kh=...&uddg=encodedURL
              const m = href.match(/[?&]uddg=([^&]+)/);
              if (m && m[1]) {
                href = decodeURIComponent(m[1]);
              }
              if (/ratemyprofessors\.com/.test(href)) results.push({ name: it.text, url: href });
            } catch (_) {}
          }
        } catch (e) {
          // ignore
        }
      }

    console.log(JSON.stringify({ query: q, count: uniq.length, results: uniq.slice(0, 20) }, null, 2));
    console.log('\nResults:');
    uniq.slice(0, 20).forEach((r, i) => console.log(`${i+1}. ${r.name} - ${r.url}`));
  } catch (err) {
    console.error('Error extracting RMP results:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    try { await browser.close(); } catch (_) {}
  }
})();
