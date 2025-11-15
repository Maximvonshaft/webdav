import { PlaywrightCrawler, ProxyConfiguration } from '@crawlee/playwright';
import type { PlaywrightCrawlerOptions } from '@crawlee/playwright';
import { Dataset, log } from 'crawlee';
import { addExtra } from 'playwright-extra';
import StealthPlugin from 'playwright-extra-plugin-stealth';
import playwright from 'playwright';
import type { Page } from 'playwright';
import type { ResolvedConfig } from './config.js';
import { logger } from './logger.js';
import type { BeautifulSoupBridge } from './ai/beautifulSoupBridge.js';
import type { OpenAiClient } from './ai/openaiClient.js';
import type { ClsArticle } from './types.js';

const playwrightExtra = addExtra(playwright);
playwrightExtra.use(StealthPlugin());

export const createClsCrawler = (
  config: ResolvedConfig,
  aiClient: OpenAiClient,
  bsBridge: BeautifulSoupBridge,
) => {
  const proxyConfiguration =
    config.proxyUrls.length > 0 || config.defaultProxyUrl
      ? new ProxyConfiguration({
          proxyUrls: config.proxyUrls.length ? config.proxyUrls : undefined,
          newUrlFunction: config.defaultProxyUrl
            ? () => config.defaultProxyUrl as string
            : undefined,
        })
      : undefined;

  const options: PlaywrightCrawlerOptions = {
    maxRequestsPerCrawl: config.maxRequests,
    maxConcurrency: config.concurrency,
    requestHandlerTimeoutSecs: 90,
    navigationTimeoutSecs: 45,
    headless: config.headless,
    launchContext: {
      playwright: playwrightExtra,
      launchOptions: {
        headless: config.headless,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
      },
    },
    browserPoolOptions: {
      useFingerprints: true,
      fingerprintOptions: {
        fingerprintGeneratorOptions: {
          browsers: [
            {
              name: 'chrome',
              minVersion: 120,
            },
          ],
        },
      },
    },
    proxyConfiguration,
    requestHandler: async ({ page, request }) => {
      log.info(`抓取 ${request.url}`);
      await page.goto(request.url, { waitUntil: 'networkidle' });
      await page.waitForLoadState('domcontentloaded');

      const articles = await extractArticlesFromPage(page.url(), page);

      for (const article of articles) {
        try {
          const structured = await bsBridge.extract(article.rawHtml ?? '');
          const enriched = await aiClient.enrichArticle({
            ...article,
            structuredContent: structured,
          });
          await Dataset.pushData(enriched);
        } catch (error) {
          logger.error({ err: error, articleId: article.id }, '处理文章失败');
        }
      }
    },
  };

  return new PlaywrightCrawler(options);
};

async function extractArticlesFromPage(currentUrl: string, page: Page): Promise<ClsArticle[]> {
  const articleLocator = page.locator('[data-id]');
  const count = await articleLocator.count();

  const articles: ClsArticle[] = [];

  for (let index = 0; index < count; index += 1) {
    const locator = articleLocator.nth(index);
    const html = await locator.innerHTML();
    const data = await locator.evaluate((element) => {
      const findText = (selector: string) =>
        element.querySelector(selector)?.textContent?.trim() ?? undefined;
      const findHref = (selector: string) =>
        (element.querySelector(selector) as HTMLAnchorElement | null)?.href;

      const id = element.getAttribute('data-id') ?? crypto.randomUUID();
      const title = findText('h3, h2, .title') ?? '未命名快讯';
      const summary = findText('.content, p, article') ?? '';
      const timestamp =
        element.querySelector('time')?.getAttribute('datetime') ??
        findText('.time') ??
        new Date().toISOString();
      const category = findText('.cate, .tag');
      const author = findText('.author');
      const url = findHref('a') ?? '';

      return {
        id,
        title,
        summary,
        timestamp,
        category,
        author,
        url,
      };
    });

    const absoluteUrl = data.url
      ? new URL(data.url, currentUrl).toString()
      : currentUrl;

    const article: ClsArticle = {
      id: data.id,
      title: data.title,
      summary: data.summary,
      publishedAt: data.timestamp,
      category: data.category,
      author: data.author,
      url: absoluteUrl,
      rawHtml: html,
    };

    articles.push(article);
  }

  return articles;
}
