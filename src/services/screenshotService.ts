import { chromium } from 'playwright';
import type { GeminiService } from './geminiService';
import { writeImageFile } from '../core/output';
import sharp from 'sharp';

export interface ScreenshotReviewResult {
  path: string;
  review: string | null;
  raw?: unknown;
}

export class ScreenshotService {
  constructor(private readonly geminiService: GeminiService | null) {}

  async captureAndReview(
    url: string,
    outDir = 'images',
    model = 'models/gemini-1.0',
    compress = true,
    maxWidth = 1600,
    quality = 80
  ): Promise<ScreenshotReviewResult> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    const buffer = await page.screenshot({ fullPage: true });
    await browser.close();

    // include outDir in the generated filename input so different folders can be represented
    const imagePath = await writeImageFile(`${outDir}-screenshot-${url}`, Buffer.from(buffer));

    if (!this.geminiService) {
      return { path: imagePath, review: null };
    }

    // Prepare media: optionally compress/resize before sending to Gemini
    let mediaBuffer: Buffer = Buffer.from(buffer);
    if (compress) {
      try {
        mediaBuffer = await sharp(buffer)
          .resize({ width: maxWidth, withoutEnlargement: true })
          .jpeg({ quality })
          .toBuffer();
      } catch (err) {
        // If compression fails, fall back to original buffer
        mediaBuffer = Buffer.from(buffer);
      }
    }

    const b64 = mediaBuffer.toString('base64');
    const media = [
      {
        mimeType: 'image/jpeg',
        data: b64
      }
    ];

    const prompt = `You are an expert UX and accessibility reviewer. Provide concise, actionable feedback on the screenshot of the website at ${url}. Include design, layout, color, typography, hierarchy, and accessibility suggestions.`;

    try {
      const result = await this.geminiService.generate({ model, prompt, media });

      return { path: imagePath, review: result.text, raw: result.raw };
    } catch (err) {
      return { path: imagePath, review: null, raw: err instanceof Error ? err.message : err };
    }
  }
}
