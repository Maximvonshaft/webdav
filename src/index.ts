import { AppConfig } from './config.js';
import { logger } from './logger.js';
import { BeautifulSoupBridge } from './ai/beautifulSoupBridge.js';
import { OpenAiClient } from './ai/openaiClient.js';
import { createClsCrawler } from './crawler.js';

async function main() {
  const bsBridge = new BeautifulSoupBridge();
  const aiClient = new OpenAiClient(AppConfig);
  const crawler = createClsCrawler(AppConfig, aiClient, bsBridge);

  const startUrls = AppConfig.startPaths.map((path) => {
    const url = new URL(path, AppConfig.baseUrl);
    return url.toString();
  });

  logger.info(
    {
      startUrls,
      maxRequests: AppConfig.maxRequests,
      concurrency: AppConfig.concurrency,
      useProxy: Boolean(AppConfig.proxyUrls.length || AppConfig.defaultProxyUrl),
      aiEnabled: aiClient.isEnabled(),
    },
    '启动 cls.cn 爬虫',
  );

  await crawler.run(startUrls);

  logger.info('抓取结束，数据可在 storage/datasets/default 中查看');
}

main().catch((error) => {
  logger.error({ err: error }, '爬虫运行失败');
  process.exitCode = 1;
});
