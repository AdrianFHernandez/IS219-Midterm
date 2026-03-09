export type SearchResult = {
  title: string;
  url: string;
  snippet?: string;
};

export interface ISearchProvider {
  search(query: string, limit?: number): Promise<SearchResult[]>;
}
