// Runs the in-page self-test (selftest.js) in headless Chromium and exits non-zero on any failure.
// Usage: node scripts/selftest.mjs      (needs the `playwright` package and its Chromium)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };

const server = http.createServer(async (req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(root, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/?selftest=1`;

const browser = await chromium.launch();
let code = 1;
try {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(url, { waitUntil: 'load' });
  const result = await page.waitForFunction(() => window.__selftest, null, { timeout: 180_000 })
    .then(h => h.jsonValue())
    .catch(() => null);
  if (!result) {
    console.error('selftest: did not finish within 180 s');
    pageErrors.forEach(e => console.error('page error: ' + e));
  } else {
    for (const f of result.failed) console.error(`FAIL ${f.name ?? JSON.stringify(f)}${f.err ? ' - ' + f.err : ''}`);
    console.log(`selftest: ${result.passed} passed, ${result.failed.length} failed, ${result.total} total`);
    code = result.failed.length === 0 && result.passed === result.total ? 0 : 1;
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(code);
