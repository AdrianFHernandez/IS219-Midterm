export interface RmpResult {
  name: string;
  url: string;
  snippet?: string;
}

export class RmpService {
  private base = 'https://www.ratemyprofessors.com';

  async search(query: string, limit = 5): Promise<RmpResult[]> {
    const q = encodeURIComponent(query);
    // Try RMP search page first; if it doesn't return useful content, fallback to DuckDuckGo site search
    let text = '';
      try {
        const url = `${this.base}/search/teachers?query=${q}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'node-fetch' } });
        if (res.ok) text = await res.text();
      } catch (_) {}

      if (!text) {
        const ddg = `https://duckduckgo.com/html/?q=site:ratemyprofessors.com+${q}`;
        const res2 = await fetch(ddg, { headers: { 'User-Agent': 'node-fetch' } });
        if (!res2.ok) throw new Error(`Fallback search failed: ${res2.status}`);
        text = await res2.text();
      }

      // Find professor links and names. This is a best-effort HTML regex parse.
      const re = /<a[^>]*href="([^"\s]*ratemyprofessors.com[^"\s]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const results: RmpResult[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) && results.length < limit) {
      const href = m[1];
      // remove inner tags from name
      const rawName = m[2].replace(/<[^>]+>/g, '').trim();
      if (!rawName) continue;
      const full = `${this.base}${href}`;
      results.push({ name: rawName, url: full });
    }

    return results;
  }
}
