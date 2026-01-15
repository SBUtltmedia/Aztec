import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    protocolTimeout: 60000
  });
  const page = await browser.newPage();

  // Capture console messages and errors
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    console.log('[BROWSER]', text);

    if (msg.type() === 'error' || text.includes('Error:')) {
      // Ignore 404 errors for non-critical resources (CSS, images, etc.)
      if (!text.includes('Failed to load resource') && !text.includes('404')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', error => {
    const errorMsg = error.message;
    console.log('[PAGE ERROR]', errorMsg);
    pageErrors.push(errorMsg);
  });

  console.log('[TEST] Navigating...');
  await page.goto('http://localhost:53134/Twine/EngineDemo.html?id=alice', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  await new Promise(r => setTimeout(r, 2000));

  console.log('[TEST] Checking initial state...');
  const passage = await page.evaluate(() => window.SugarCube.State.passage);
  console.log('Current passage:', passage);

  const initial = await page.evaluate(() => ({
    counter: window.SugarCube.State.variables.sharedCounter,
    userId: window.SugarCube.State.variables.userId
  }));
  console.log('Initial counter:', initial.counter);
  console.log('User ID:', initial.userId);

  // Navigate through the game flow
  console.log('[TEST] Navigating through game flow...');

  // Initialize user and go to Hub
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

  // Test 1: Increment button
  console.log('\n[TEST 1] Testing Increment (+1) button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Increment (+1)'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  const afterIncrement = await page.evaluate(() => ({
    counter: window.SugarCube.State.variables.sharedCounter,
    lastAction: window.SugarCube.State.variables.users?.alice?.lastAction
  }));
  console.log('After increment:', afterIncrement.counter);
  console.log('Last action:', afterIncrement.lastAction);

  // Test 2: Decrement button
  console.log('\n[TEST 2] Testing Decrement (-1) button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Decrement (-1)'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  const afterDecrement = await page.evaluate(() => ({
    counter: window.SugarCube.State.variables.sharedCounter,
    lastAction: window.SugarCube.State.variables.users?.alice?.lastAction
  }));
  console.log('After decrement:', afterDecrement.counter);
  console.log('Last action:', afterDecrement.lastAction);

  // Test 3: Compound operator (+=)
  console.log('\n[TEST 3] Testing Add 10 (+=) button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Add 10'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  const afterAdd10 = await page.evaluate(() => ({
    counter: window.SugarCube.State.variables.sharedCounter,
    lastAction: window.SugarCube.State.variables.users?.alice?.lastAction
  }));
  console.log('After add 10:', afterAdd10.counter);
  console.log('Last action:', afterAdd10.lastAction);

  // Test 4: Reset button
  console.log('\n[TEST 4] Testing Reset to 0 button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Reset'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  const afterReset = await page.evaluate(() => ({
    counter: window.SugarCube.State.variables.sharedCounter,
    lastAction: window.SugarCube.State.variables.users?.alice?.lastAction
  }));
  console.log('After reset:', afterReset.counter);
  console.log('Last action:', afterReset.lastAction);

  // Verify test results
  console.log('\n[RESULTS]');
  let passed = 0;
  let failed = 0;

  if (afterReset.counter === 0) {
    console.log('✓ Final counter is 0');
    passed++;
  } else {
    console.log('✗ Final counter is not 0 (got', afterReset.counter, ')');
    failed++;
  }

  if (afterReset.lastAction && afterReset.lastAction.includes('Reset')) {
    console.log('✓ Last action recorded correctly');
    passed++;
  } else {
    console.log('✗ Last action not recorded (got', afterReset.lastAction, ')');
    failed++;
  }

  // Check for JavaScript errors
  console.log('\n[ERROR CHECK]');
  if (consoleErrors.length === 0 && pageErrors.length === 0) {
    console.log('✓ No JavaScript errors');
    passed++;
  } else {
    console.log('✗ JavaScript errors detected:');
    consoleErrors.forEach(err => console.log('  - Console:', err));
    pageErrors.forEach(err => console.log('  - Page:', err));
    failed++;
  }

  console.log(`\n${passed} tests passed, ${failed} tests failed`);

  if (failed === 0) {
    console.log('✓ ALL TESTS PASSED');
  } else {
    console.log('✗ SOME TESTS FAILED');
  }

  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
