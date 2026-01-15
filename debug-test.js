import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER]', msg.text()));

  await page.goto('http://localhost:53134/Twine/EngineDemo.html?id=alice', {
    waitUntil: 'networkidle0'
  });

  await new Promise(r => setTimeout(r, 2000));

  // Navigate to counter
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const link = links.find(l => l.textContent.includes('Shared Counter Demo'));
    if (link) link.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  // Check if button exists
  const buttonInfo = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.map(b => ({
      text: b.textContent.trim(),
      onclick: b.onclick ? 'has onclick' : 'no onclick'
    }));
  });

  console.log('Buttons:', JSON.stringify(buttonInfo, null, 2));

  console.log('\n✓ Check browser window for more details');
  console.log('Press Ctrl+C when done\n');

  await new Promise(() => {}); // Keep alive
})();
