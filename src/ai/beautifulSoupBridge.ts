import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { logger } from '../logger.js';
import type { BeautifulSoupExtraction } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class BeautifulSoupBridge {
  private readonly scriptPath: string;

  constructor(scriptRelativePath = '../../scripts/bs_parser.py') {
    this.scriptPath = path.resolve(__dirname, scriptRelativePath);
  }

  async extract(html: string): Promise<BeautifulSoupExtraction> {
    return new Promise((resolve, reject) => {
      const process = spawn('python3', [this.scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      process.stdout.setEncoding('utf-8');
      process.stderr.setEncoding('utf-8');

      process.stdout.on('data', (chunk) => {
        stdout += chunk;
      });

      process.stderr.on('data', (chunk) => {
        stderr += chunk;
      });

      process.on('close', (code) => {
        if (code !== 0) {
          logger.error({ code, stderr }, 'BeautifulSoup 解析失败');
          return reject(new Error(stderr || 'BeautifulSoup 解析失败'));
        }

        try {
          resolve(JSON.parse(stdout));
        } catch (error) {
          reject(error);
        }
      });

      process.stdin.write(html);
      process.stdin.end();
    });
  }
}
