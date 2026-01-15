import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting Unity Demo test...\n');

  const browser = await puppeteer.launch({
    headless: false,
    protocolTimeout: 120000,
    args: ['--window-size=1200,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Unity') || text.includes('Scene') || text.includes('Bridge')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log(`[ERROR] ${error.message}`);
  });

  console.log('📍 Navigating to Unity Demo...');
  await page.goto('http://localhost:53134/?nick=Pieck&id=1768512740692', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  console.log('⏳ Waiting for page to load...');
  await new Promise(r => setTimeout(r, 5000));

  // Take screenshot of initial state
  console.log('📸 Taking screenshot of Start scene...');
  await page.screenshot({ path: 'unity-demo-start.png', fullPage: false });

  // Check what's visible
  const pageText = await page.evaluate(() => {
    return {
      passageText: document.querySelector('.passage')?.innerText || 'No passage text',
      unityFrame: !!document.getElementById('unity-frame'),
      unityCanvas: !!document.querySelector('canvas')
    };
  });

  console.log('\n📊 Page state:');
  console.log('  Unity iframe exists:', pageText.unityFrame);
  console.log('  Unity canvas exists:', pageText.unityCanvas);
  console.log('  Passage text preview:', pageText.passageText.substring(0, 100));

  // Navigate to Hub
  console.log('\n🔄 Navigating to Hub...');
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Hub'));
    if (link) link.click();
  });

  await new Promise(r => setTimeout(r, 3000));

  console.log('📸 Taking screenshot of Hub scene...');
  await page.screenshot({ path: 'unity-demo-hub.png', fullPage: false });

  // Navigate to Shared Counter Demo
  console.log('\n🔄 Navigating to Shared Counter Demo...');
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Shared Counter'));
    if (link) link.click();
  });

  await new Promise(r => setTimeout(r, 3000));

  console.log('📸 Taking screenshot of Shared Counter Demo scene...');
  await page.screenshot({ path: 'unity-demo-counter.png', fullPage: false });

  console.log('\n✅ Test complete! Screenshots saved:');
  console.log('  - unity-demo-start.png');
  console.log('  - unity-demo-hub.png');
  console.log('  - unity-demo-counter.png');

  console.log('\n⏰ Keeping browser open for 10 seconds for inspection...');
  await new Promise(r => setTimeout(r, 10000));

  await browser.close();
  console.log('✅ Browser closed.');
})();
