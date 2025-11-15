import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const ConfigSchema = z.object({
  CLS_BASE_URL: z.string().default('https://www.cls.cn'),
  START_PATHS: z
    .string()
    .default('/telegraph,/flash')
    .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean)),
  MAX_REQUESTS: z.coerce.number().default(50),
  CONCURRENCY: z.coerce.number().default(5),
  HEADLESS: z
    .string()
    .default('true')
    .transform((value) => value === 'true'),
  PROXY_URLS: z
    .string()
    .optional()
    .transform((value) => value?.split(',').map((item) => item.trim()).filter(Boolean) ?? []),
  DEFAULT_PROXY_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  ENABLE_AI_PARSING: z
    .string()
    .optional()
    .transform((value) => value !== 'false'),
  AI_TEMPERATURE: z.coerce.number().default(0.2),
});

const parsed = ConfigSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`配置校验失败: ${parsed.error.message}`);
}

export const AppConfig = {
  baseUrl: parsed.data.CLS_BASE_URL,
  startPaths: parsed.data.START_PATHS,
  maxRequests: parsed.data.MAX_REQUESTS,
  concurrency: parsed.data.CONCURRENCY,
  headless: parsed.data.HEADLESS,
  proxyUrls: parsed.data.PROXY_URLS,
  defaultProxyUrl: parsed.data.DEFAULT_PROXY_URL,
  openAiApiKey: parsed.data.OPENAI_API_KEY,
  openAiModel: parsed.data.OPENAI_MODEL,
  enableAiParsing: parsed.data.ENABLE_AI_PARSING,
  aiTemperature: parsed.data.AI_TEMPERATURE,
} as const;

export type ResolvedConfig = typeof AppConfig;
