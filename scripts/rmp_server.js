const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 3010;

function sendFile(res, file) {
  const full = path.join(__dirname, file);
  fs.readFile(full, (err, data) => {
    if (err) { res.statusCode = 500; res.end('Error'); return; }
    res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : 'text/plain');
    res.end(data);
  });
}

async function fetchRmp(q) {
  const qEnc = encodeURIComponent(q);
  let text = '';
  // Try direct site search first
  try {
    const target = `https://www.ratemyprofessors.com/search/teachers?query=${qEnc}`;
    const res = await fetch(target, { headers: { 'User-Agent': 'node-fetch' } });
    if (res.ok) text = await res.text();
  } catch (_) {}

  // Fallback to DuckDuckGo site search when direct search yields no content
  if (!text) {
    const ddg = `https://duckduckgo.com/html/?q=site:ratemyprofessors.com+${qEnc}`;
    const res2 = await fetch(ddg, { headers: { 'User-Agent': 'node-fetch' } });
    if (!res2.ok) throw new Error('Fallback search failed');
    text = await res2.text();
  }

  const re = /<a[^>]*href=\"([^\"\s]*ratemyprofessors.com[^\"\s]*)\"[^>]*>([\s\S]*?)<\/a>/gi;
  const results = [];
  let m;
  while ((m = re.exec(text)) && results.length < 10) {
    const href = m[1];
    const rawName = m[2].replace(/<[^>]+>/g, '').trim();
    if (!rawName) continue;
    const url = href.startsWith('http') ? href : 'https://www.ratemyprofessors.com' + href;
    results.push({ name: rawName, url });
  }

  // If no results found via simple HTML fetch, try a Playwright-rendered site search
  if (results.length === 0) {
    try {
      const pw = await searchRmpByPlaywright(q);
      if (pw && pw.length) return pw;
    } catch (err) {
      // ignore
    }
  }

  return results;
}


async function searchRmpByPlaywright(q) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
    const target = `https://www.ratemyprofessors.com/search/teachers?query=${encodeURIComponent(q)}`;
    await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1200);

    const items = await page.evaluate(() => {
      const out = [];
      try {
        const anchors = Array.from(document.querySelectorAll('a'));
        for (const a of anchors) {
          const href = a.getAttribute('href') || '';
          if (href.includes('/professor/')) {
            const name = (a.innerText || a.textContent || '').trim();
            if (name) out.push({ name, url: href.startsWith('http') ? href : 'https://www.ratemyprofessors.com' + href });
          }
        }
      } catch (e) {}
      return out;
    });

    await page.close();
    return items;
  } catch (err) {
    console.error('searchRmpByPlaywright error', err && err.message ? err.message : err);
    return [];
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
async function fetchScholar(q) {
  const qEnc = encodeURIComponent(q);
  const url = `https://scholar.google.com/scholar?q=${qEnc}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'node-fetch' } });
    if (!res.ok) throw new Error(`Scholar fetch failed: ${res.status}`);
    const text = await res.text();
    // parse results: look for h3.gs_rt anchors
    const re = /<h3[^>]*class="gs_rt"[^>]*>\s*(?:<a[^>]*href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/a>|([^<]+))\s*<\/h3>/gi;
    const results = [];
    let m;
    while ((m = re.exec(text)) && results.length < 20) {
      const href = m[1];
      const title = (m[2] || m[3] || '').replace(/<[^>]+>/g, '').trim();
      if (!title) continue;
      results.push({ title, url: href || null });
    }
    return results;
  } catch (err) {
    return [];
  }
}

// removed DuckDuckGo web scraping — not used anymore

const { chromium } = require('playwright');

async function fetchRenderedPage(url) {
  // Render the page using Playwright and return the HTML content
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    // wait a bit for client-side rendering
    await page.waitForTimeout(1000);
    const html = await page.content();
    await page.close();
    return html;
  } catch (err) {
    console.error('fetchRenderedPage error', err && err.message ? err.message : err);
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function fetchRmpProfile(url) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    // Wait for rating element or some page content to appear; RMP is client-rendered.
    try {
      await page.waitForSelector('[class*="RatingValue__Numerator"], h1, a[href*="/school/"]', { timeout: 5000 });
    } catch (_) {
      // ignore, we'll attempt extraction even if selector didn't appear
    }

    const data = await page.evaluate(() => {
      const pick = (sel) => { try { const el = document.querySelector(sel); return el ? el.innerText.trim() : null; } catch { return null; } };
      // Try common selectors observed on RMP pages
      const rating = pick('[class*="RatingValue__Numerator"], [data-testid*="rating"]') || pick('.RatingValue__Numerator') || pick('.breakdown-header') || null;
      const name = pick('h1') || pick('[class*="NameTitle__Name"]') || pick('.ProfessorName');
      // number of ratings
      let numRatings = null;
      try {
        const anchors = Array.from(document.querySelectorAll('a'));
        for (const a of anchors) {
          const t = (a.innerText||'').trim();
          if (/\d+\s+ratings?/i.test(t) || /Overall Quality Based on/.test(t)) { numRatings = t; break; }
        }
      } catch(e){}
      const dept = pick('a[href*="/search/professors"], a[href*="/school/"]') || pick('.TeacherDepartment__StyledDepartmentLink');

      // Try to extract a few review texts
      const reviews = [];
      try {
        const nodes = document.querySelectorAll('[class*="RatingsList"] [class*="Comments"], [class*="Comments__Comment"] , [class*="Rating__Comment"] , .Comments__StyledComment');
        if (nodes && nodes.length) {
          for (let i=0;i<Math.min(5,nodes.length);i++) {
            const t = nodes[i].innerText.trim(); if (t) reviews.push(t);
          }
        }
      } catch(e){}

      // Fallback: find any paragraph-like text blocks that look like reviews
      if (reviews.length === 0) {
        try {
          const cand = Array.from(document.querySelectorAll('p, li, div'))
            .map(n=>n.innerText||'')
            .filter(t=>t && t.length>40 && t.length<1000);
          for (let i=0;i<Math.min(5,cand.length);i++) reviews.push(cand[i].trim());
        } catch(e){}
      }

      return { rating, name, numRatings, dept, reviews };
    });

    await page.close();
    return data;
  } catch (err) {
    console.error('fetchRmpProfile error', err && err.message ? err.message : err);
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function fetchGemini(q) {
  const apiKey = process.env.Gemini_api_key || process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  // Allow overriding endpoint via env, otherwise default to Google Generative API path.
  const endpoint = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate';

  // Prompt the LLM to return JSON with an array of search results.
  const promptText = `Search the web for the query: "${q}". Return a JSON array named \"results\" with up to 10 objects, each having keys: title, url, snippet. Respond with only valid JSON.`;

  try {
    const body = {
      prompt: { text: promptText },
      temperature: 0.0,
      max_output_tokens: 512,
      // ask for a single best candidate
      candidate_count: 1
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // Try to surface useful error body
      const txt = await res.text().catch(() => '');
      throw new Error(`Gemini fetch failed ${res.status}: ${txt}`);
    }

    const text = await res.text();
    // Helper: try to parse JSON safely
    const tryJson = (s) => { try { return JSON.parse(s); } catch (_) { return null; } };

    // 1) Try raw JSON parse
    let parsed = tryJson(text);
    if (parsed) {
      if (Array.isArray(parsed.results)) return parsed.results;
    }

    // 2) If parsed, try to find common fields that contain JSON text
    const extractCandidatesText = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      if (Array.isArray(obj.results)) return JSON.stringify({results: obj.results});
      if (obj.output && Array.isArray(obj.output) && obj.output[0] && obj.output[0].content) return obj.output[0].content;
      if (obj.candidates && Array.isArray(obj.candidates) && obj.candidates[0] && obj.candidates[0].content) return obj.candidates[0].content;
      if (obj.responses && Array.isArray(obj.responses) && obj.responses[0] && obj.responses[0].candidates && obj.responses[0].candidates[0]) return obj.responses[0].candidates[0].content;
      if (obj.choices && Array.isArray(obj.choices) && obj.choices[0]) {
        if (obj.choices[0].message && obj.choices[0].message.content) return obj.choices[0].message.content;
        if (typeof obj.choices[0].text === 'string') return obj.choices[0].text;
      }
      if (typeof obj.output_text === 'string') return obj.output_text;
      if (typeof obj.generated_text === 'string') return obj.generated_text;
      return null;
    };

    let candidatesText = null;
    if (parsed) candidatesText = extractCandidatesText(parsed);
    // 3) If we didn't parse JSON, try to extract a JSON substring from the raw text
    if (!candidatesText) {
      const mArr = text.match(/\[[\s\S]*?\]/);
      if (mArr) candidatesText = mArr[0];
      else {
        const mObj = text.match(/\{[\s\S]*?\}/);
        if (mObj) candidatesText = mObj[0];
      }
    }

    // 4) If we have a content block, try to parse it for `results` or an array
    if (candidatesText) {
      let inner = tryJson(candidatesText);
      if (inner) {
        if (Array.isArray(inner)) return inner.slice(0, 10);
        if (Array.isArray(inner.results)) return inner.results.slice(0, 10);
      }
      // sometimes the content is a wrapped object
      const maybe = tryJson(`{"results":${candidatesText}}`);
      if (maybe && Array.isArray(maybe.results)) return maybe.results.slice(0, 10);
    }

    // 5) As a last resort, try to extract URLs from the response text and return them as simple results
    const urls = [];
    const urlRe = /https?:\/\/[\w\-./?=&%#]+/gi;
    let m;
    while ((m = urlRe.exec(text)) && urls.length < 10) {
      urls.push({ title: m[0], url: m[0] });
    }
    return urls;
  } catch (err) {
    console.error('fetchGemini error:', err && err.message ? err.message : err);
    return [];
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/' || req.url === '/index.html') return sendFile(res, 'rmp_ui.html');
    if (req.url.startsWith('/api/rmp-search')) {
      const u = new URL(req.url, `http://localhost:${PORT}`);
      const q = u.searchParams.get('q') || '';
      const results = await fetchRmp(q);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ query: q, results }));
      return;
    }

      if (req.url.startsWith('/api/fetch-page')) {
        const u = new URL(req.url, `http://localhost:${PORT}`);
        const target = u.searchParams.get('url');
        const saveFlag = u.searchParams.get('save') || '';
        if (!target) { res.statusCode = 400; res.end('Missing url'); return; }
        const html = await fetchRenderedPage(target);
        if (!html) { res.statusCode = 502; res.end('Failed to render page'); return; }
        // optionally save rendered HTML
        if (saveFlag && ['1','true','yes'].includes(saveFlag.toLowerCase())) {
          try {
            const safe = (new URL(target).hostname || 'page').replace(/[^a-z0-9.\-]/gi,'_');
            const ts = Date.now();
            const dir = path.join(__dirname, '..', 'research', `${safe}_${ts}`);
            fs.mkdirSync(dir, { recursive: true });
            const htmlPath = path.join(dir, 'page.html');
            fs.writeFileSync(htmlPath, html, 'utf8');
            const metaPath = path.join(dir, 'metadata.json');
            fs.writeFileSync(metaPath, JSON.stringify({ url: target, savedAt: ts }, null, 2));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, saved: htmlPath }));
            return;
          } catch (err) {
            console.error('save rendered page failed', err && err.message ? err.message : err);
          }
        }
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
        return;
      }

      if (req.url.startsWith('/api/fetch-rmp-profile')) {
        const u = new URL(req.url, `http://localhost:${PORT}`);
        const target = u.searchParams.get('url');
        const saveFlag = u.searchParams.get('save') || '';
        if (!target) { res.statusCode = 400; res.end('Missing url'); return; }
        const prof = await fetchRmpProfile(target);
        if (!prof) { res.statusCode = 502; res.end('Failed to fetch profile'); return; }
        if (saveFlag && ['1','true','yes'].includes(saveFlag.toLowerCase())) {
          try {
            const safe = (prof.name || 'profile').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
            const ts = Date.now();
            const dir = path.join(__dirname, '..', 'research', `${safe}_${ts}`);
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify({ url: target, profile: prof }, null, 2));
            fs.writeFileSync(path.join(dir, 'notes.md'), `# Profile: ${prof.name}\n\nFetched ${new Date(ts).toISOString()}\n`);
            prof._saved = path.join(dir, 'metadata.json');
          } catch (err) { console.error('save profile failed', err && err.message ? err.message : err); }
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(prof));
        return;
      }

    if (req.url.startsWith('/api/search-all')) {
      const u = new URL(req.url, `http://localhost:${PORT}`);
      const q = u.searchParams.get('q') || '';
      const sourcesParam = u.searchParams.get('sources') || 'rmp,scholar,google';
      const saveFlag = u.searchParams.get('save') || '';
      const sources = sourcesParam.split(',').map(s => s.trim().toLowerCase());

      const out = { query: q, sources: {} };
      if (sources.includes('rmp')) {
        out.sources.rmp = await fetchRmp(q);
        // For each candidate RMP result, attempt to fetch profile details if a profile URL is present
        if (Array.isArray(out.sources.rmp) && out.sources.rmp.length) {
          for (let i = 0; i < out.sources.rmp.length; i++) {
            const it = out.sources.rmp[i];
            try {
              const profileUrl = it.url && it.url.includes('ratemyprofessors.com') ? (it.url.startsWith('http') ? it.url : 'https://www.ratemyprofessors.com' + it.url) : null;
              if (profileUrl) {
                const prof = await fetchRmpProfile(profileUrl);
                if (prof) {
                  out.sources.rmp[i]._profile = prof;
                }
              }
            } catch (err) {
              // ignore per-item errors
            }
          }
        }
      }
      if (sources.includes('scholar')) out.sources.scholar = await fetchScholar(q);
      if (sources.includes('google') || sources.includes('gemini')) {
        out.sources.google = await fetchGemini(q);
      }
      // optionally save results to research/<slug>_<ts>/metadata.json when ?save=true
      let savedPath = null;
      if (saveFlag && ['1', 'true', 'yes'].includes(saveFlag.toLowerCase())) {
        try {
          const safe = (q || 'query').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
          const ts = Date.now();
          const dir = path.join(__dirname, '..', 'research', `${safe}_${ts}`);
          fs.mkdirSync(dir, { recursive: true });
          const metaPath = path.join(dir, 'metadata.json');
          fs.writeFileSync(metaPath, JSON.stringify(out, null, 2));
          const notesPath = path.join(dir, 'notes.md');
          fs.writeFileSync(notesPath, `# Research: ${q}\n\nSaved from /api/search-all on ${new Date(ts).toISOString()}\n`);
          savedPath = metaPath;
          out._saved = savedPath;
        } catch (err) {
          console.error('save research failed', err && err.message ? err.message : err);
        }
      }

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(out));
      return;
    }
    // serve the UI file path
    if (req.url === '/rmp_ui.html') return sendFile(res, 'rmp_ui.html');

    res.statusCode = 404; res.end('Not found');
  } catch (err) {
    res.statusCode = 500; res.end(String(err));
  }
});

server.listen(PORT, () => {
  console.log(`RMP server listening on http://localhost:${PORT}`);
});
