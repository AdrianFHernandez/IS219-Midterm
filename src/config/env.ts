import dotenv from 'dotenv';
import path from 'path';

export function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  const result = dotenv.config({ path: envPath });

  const key = process.env.OPENAI_API_KEY ?? result.parsed?.OPENAI_API_KEY;
  if (key) {
    const masked = `${key.slice(0, 6)}...${key.slice(-6)}`;
    // Do not log full secrets; show masked preview for debugging only
    // This helps diagnose why commands sometimes require manual `OPENAI_API_KEY=` in the shell.
    // Keep output concise so CI logs remain clean.
    // eslint-disable-next-line no-console
    console.log(`Loaded OPENAI_API_KEY from ${result.error ? 'environment' : envPath}: ${masked}`);
  } else {
    // eslint-disable-next-line no-console
    console.warn('WARNING: OPENAI_API_KEY not found in environment or .env. Set OPENAI_API_KEY in your shell or in .env');
  }
}
