import https from 'https';
import { ISearchProvider, SearchResult } from './SearchProvider';

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

/**
 * A very small DuckDuckGo HTML search provider.
 * No API key required. Not perfect but useful as a fallback.
 */
export class DuckDuckGoSearchProvider implements ISearchProvider {
  async search(query: string, limit = 5): Promise<SearchResult[]> {
    const q = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html?q=${q}`;

    const html = await fetchUrl(url);

    // Very small HTML parsing using regex to extract results
    const results: SearchResult[] = [];
    const linkRe = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i;

    let m;
    while ((m = linkRe.exec(html)) && results.length < limit) {
      const rawUrl = m[1];
      const titleHtml = m[2].replace(/<[^>]+>/g, '');
      const title = titleHtml.trim();
      // Try to find a snippet after this match
      const after = html.slice(m.index + m[0].length, m.index + m[0].length + 400);
      const s = snippetRe.exec(after);
      const snippet = s ? s[1].replace(/<[^>]+>/g, '').trim() : undefined;

      results.push({ title, url: rawUrl, snippet });
    }

    // Fallback: if no results found, try parsing simple <a href> entries
    if (results.length === 0) {
      const simpleRe = /<a[^>]+href="(https?:\/\/[^"']+)"[^>]*>([^<]{10,200})<\/a>/gi;
      while ((m = simpleRe.exec(html)) && results.length < limit) {
        const rawUrl = m[1];
        const title = m[2].trim();
        results.push({ title, url: rawUrl });
      }
    }

    return results;
  }
}
