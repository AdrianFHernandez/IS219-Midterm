import OpenAI from 'openai';

export interface WebSearchResult {
  text: string;
  raw: unknown;
}

export class OpenAIWebSearchService {
  constructor(private readonly client: OpenAI) {}

  async search(query: string, model: string): Promise<WebSearchResult> {
    const response = await this.client.responses.create({
      model,
      // use the preview tool type supported by the SDK typings
      tools: [{ type: 'web_search_preview' as any }],
      input: query
    });

    return {
      text: response.output_text ?? '',
      raw: response
    };
  }
}
