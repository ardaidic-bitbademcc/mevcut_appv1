const fs = require('fs');
const path = require('path');
const url = process.argv[2] || 'https://mevcut-appv1.onrender.com/';

(async () => {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const logs = [];
    const errors = [];
    const responses = [];

    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      logs.push({ type, text });
      if (type === 'error') errors.push({ source: 'console', text });
      console[type === 'error' ? 'error' : 'log'](`[console.${type}] ${text}`);
    });

    page.on('pageerror', err => {
      errors.push({ source: 'pageerror', text: err && err.stack ? err.stack : String(err) });
      console.error('[pageerror]', err && err.stack ? err.stack : err);
    });

    page.on('response', async resp => {
      try {
        if (!resp.ok()) {
          const url = resp.url();
          const status = resp.status();
          let text = '';
          try { text = await resp.text(); if (text.length > 1000) text = text.slice(0,1000) + '...'; } catch(e){}
          responses.push({ url, status, text });
          console.warn('[response not ok]', status, url);
        }
      } catch(e) {
        // ignore
      }
    });

    console.log('Opening', url);
    await page.setViewport({ width: 1200, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 }).catch(e => console.error('goto error', e && e.message));

  // Wait a little longer for dynamic errors
  await new Promise(r => setTimeout(r, 3000));

    const html = await page.evaluate(() => document.documentElement.outerHTML);
    const screenshotPath = path.resolve(process.cwd(), 'frontend-page-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const out = {
      url,
      timestamp: new Date().toISOString(),
      logs,
      errors,
      responses,
      snapshotFile: screenshotPath,
      htmlPreview: html.slice(0, 2000)
    };

    const outPath = path.resolve(process.cwd(), 'frontend-console-output.json');
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log('Wrote', outPath);
    console.log('Screenshot saved to', screenshotPath);
    if (errors.length === 0 && responses.length === 0) console.log('No console errors or failing responses detected.');

    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error('Script failed:', e && e.stack ? e.stack : e);
    process.exit(2);
  }
})();
