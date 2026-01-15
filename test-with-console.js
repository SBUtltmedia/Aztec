import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    protocolTimeout: 60000
  });
  const page = await browser.newPage();

  // Log all console messages
  page.on('console', msg => console.log('[BROWSER]', msg.text()));

  console.log('[TEST] Navigating...');
  await page.goto('http://localhost:53134/Twine/EngineDemo.html?id=alice', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  await new Promise(r => setTimeout(r, 3000));

  console.log('[TEST] Checking initial state...');
  const initial = await page.evaluate(() => ({
    counter: window.SugarCube.State.variables.sharedCounter,
    userId: window.SugarCube.State.variables.userId
  }));
  console.log('Initial counter:', initial.counter);
  console.log('User ID:', initial.userId);

  // Navigate through the game flow
  console.log('[TEST] Navigating through game flow...');
  await page.evaluate(() => {
    window.initializeUser(window.SugarCube.State.variables.userId);
    window.SugarCube.Engine.play('Hub');
  });

  await new Promise(r => setTimeout(r, 1000));

  // Navigate to counter demo
  console.log('[TEST] Navigating to Shared Counter Demo...');
  await page.evaluate(() => {
    window.SugarCube.Engine.play('Shared Counter Demo');
  });

  await new Promise(r => setTimeout(r, 1000));

  console.log('[TEST] Clicking increment...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Increment'));
    console.log('[EVAL] Found button:', !!btn);
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 2000));

  const after = await page.evaluate(() => ({
    counter: window.SugarCube.State.variables.sharedCounter
  }));
  console.log('After increment:', after.counter);

  if (after.counter === initial.counter + 1) {
    console.log('✓ TEST PASSED');
  } else {
    console.log('✗ TEST FAILED');
  }

  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
