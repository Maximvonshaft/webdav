## CLS.cn 智能爬虫

基于 **Crawlee + Playwright** 的财经快讯爬虫，同时集成：

- 代理池（Bright Data / ScraperAPI 等）
- Playwright Stealth 指纹伪装
- AI 解析链路（BeautifulSoup4 结构化 + GPT-4o 洞察）

### 1. 环境准备

- Node.js >= 18，Python >= 3.10
- 安装依赖：

  ```bash
  npm install
  npm run prepare      # 安装 Playwright Chromium
  python3 -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  ```

### 2. 配置 `.env`

```ini
CLS_BASE_URL=https://www.cls.cn
START_PATHS=/telegraph,/flash
MAX_REQUESTS=50
CONCURRENCY=5
HEADLESS=true

# 代理（Bright Data 示例）
PROXY_URLS=http://username:password@zproxy.lum-superproxy.io:22225
# 或 ScraperAPI
# DEFAULT_PROXY_URL=http://scraperapi:KEY@proxy-server:8001

# AI 配置
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4o-mini
ENABLE_AI_PARSING=true
AI_TEMPERATURE=0.2
```

### 3. 运行

```bash
npm run dev     # 开发模式
npm run crawl   # 生产模式
```

爬取结果默认写入 `storage/datasets/default`，可自动包含：

- 原始快讯结构
- BeautifulSoup4 提炼的标题、要点和实体
- GPT-4o 生成的要点、情绪、影响分等智能洞察

### 4. 关键技术点

- **Stealth 指纹**：`playwright-extra` + `playwright-extra-plugin-stealth`，兼容 Crawlee BrowserPool 指纹
- **代理池**：`ProxyConfiguration` 支持多 URL 轮询或单一出口；可按需扩展 Bright Data、ScraperAPI、Oxylabs 等
- **AI 解析**：
  - `scripts/bs_parser.py` 使用 BeautifulSoup4 提供结构化上下文
  - `OpenAiClient`（GPT-4o）根据结构化内容生成交易要点
- **数据安全**：所有敏感 key 存储在 `.env`，同时支持本地 Dataset / KV Storage / 外部 sink（可拓展）

### 5. 后续扩展建议

- 增加 Redis RequestQueue + 数据去重，支撑集群扩缩
- 引入 Apify Actors 或 Docker 镜像发布，方便自动化调度
- 针对关键频道（VIP、研报）补充账号体系与滑块识别（需遵守目标站点条款）
