import fs from 'fs';
import path from 'path';

export type ResearchRecord = {
  query: string;
  timestamp: number;
  results: Array<{ title: string; url: string; snippet?: string }>;
  summary?: string;
};

export class ResearchLibrary {
  private baseDir: string;

  constructor(baseDir = path.join(process.cwd(), 'research')) {
    this.baseDir = baseDir;
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  save(record: ResearchRecord): string {
    const safe = record.query.replace(/[^a-z0-9]+/gi, '_').substring(0, 80) || 'query';
    const ts = record.timestamp || Date.now();
    const dir = path.join(this.baseDir, `${safe}_${ts}`);
    fs.mkdirSync(dir, { recursive: true });

    const json = JSON.stringify(record, null, 2);
    const metaPath = path.join(dir, 'metadata.json');
    fs.writeFileSync(metaPath, json);

    // Save simple text file with summary and snippets
    const txt = [] as string[];
    txt.push(`# Query: ${record.query}`);
    txt.push(`# Timestamp: ${new Date(record.timestamp).toISOString()}`);
    if (record.summary) {
      txt.push('\n## Summary\n');
      txt.push(record.summary);
    }
    txt.push('\n## Results\n');
    for (const r of record.results) {
      txt.push(`- ${r.title}`);
      txt.push(`  URL: ${r.url}`);
      if (r.snippet) txt.push(`  Snippet: ${r.snippet}`);
      txt.push('');
    }

    fs.writeFileSync(path.join(dir, 'notes.md'), txt.join('\n'));
    return dir;
  }
}
