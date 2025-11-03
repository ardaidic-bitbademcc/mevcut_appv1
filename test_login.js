const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Capture all console logs
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture network errors
  page.on('requestfailed', request => {
    console.log(`[NETWORK ERROR] ${request.url()} - ${request.failure().errorText}`);
  });

  console.log('Opening https://mevcut-appv1.vercel.app/');
  await page.goto('https://mevcut-appv1.vercel.app/', { waitUntil: 'domcontentloaded' });

  // Wait a moment for page to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Fill login form and submit
    await page.type('input[name="email"]', 'test@test.com');
    await page.type('input[name="password"]', 'test123');
    
    console.log('Attempting login...');
    await page.click('button[type="submit"]');
    
    // Wait for response or error
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.log('Login test error:', error.message);
  }

  await browser.close();
})();