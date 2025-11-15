export type ClsArticle = {
  id: string;
  title: string;
  publishedAt: string;
  author?: string;
  category?: string;
  summary?: string;
  url: string;
  aiInsights?: {
    keyPoints: string[];
    sentiment: string;
    impactScore: number;
    suggestedActions?: string[];
  };
  structuredContent?: {
    title?: string;
    highlights: string[];
    entities: string[];
  };
  rawHtml?: string;
};

export type BeautifulSoupExtraction = {
  title?: string;
  highlights: string[];
  entities: string[];
};
