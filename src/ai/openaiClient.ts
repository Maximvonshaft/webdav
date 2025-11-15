import OpenAI from 'openai';
import { logger } from '../logger.js';
import type { ClsArticle } from '../types.js';
import type { ResolvedConfig } from '../config.js';

export class OpenAiClient {
  private readonly client?: OpenAI;
  private readonly enabled: boolean;

  constructor(private readonly config: ResolvedConfig) {
    this.enabled = Boolean(config.openAiApiKey && config.enableAiParsing);
    if (this.enabled && config.openAiApiKey) {
      this.client = new OpenAI({
        apiKey: config.openAiApiKey,
      });
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public async enrichArticle(article: ClsArticle): Promise<ClsArticle> {
    if (!this.enabled || !this.client) {
      return article;
    }

    const prompt = [
      '你是财经快讯解读专家，请根据原文内容输出结构化 JSON：',
      '- keyPoints: 3 条要点，简洁中文',
      '- sentiment: bull/bear/neutral',
      '- impactScore: 0-100',
      '- suggestedActions: 面向交易员的建议（可选）',
      '原文：',
      JSON.stringify({
        title: article.title,
        summary: article.summary,
        extracted: article.structuredContent,
      }),
    ].join('\n');

    try {
      const response = await this.client.responses.create({
        model: this.config.openAiModel,
        temperature: this.config.aiTemperature,
        input: [
          {
            role: 'system',
            content: '输出 JSON，符合 {keyPoints: string[], sentiment: string, impactScore: number, suggestedActions?: string[]}。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'cls_article_ai_insights',
            schema: {
              type: 'object',
              properties: {
                keyPoints: {
                  type: 'array',
                  items: { type: 'string' },
                },
                sentiment: { type: 'string' },
                impactScore: { type: 'number' },
                suggestedActions: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
              required: ['keyPoints', 'sentiment', 'impactScore'],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.output?.[0]?.content?.[0];
      if (content && content.type === 'output_text') {
        const parsed = JSON.parse(content.text());
        return {
          ...article,
          aiInsights: parsed,
        };
      }
    } catch (error) {
      logger.error({ err: error }, 'OpenAI 解析失败');
    }

    return article;
  }
}
