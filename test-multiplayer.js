import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    protocolTimeout: 60000
  });

  console.log('[MULTIPLAYER TEST] Starting two-client test...\n');

  // Create two pages (two clients)
  const pageAlice = await browser.newPage();
  const pageBob = await browser.newPage();

  // Track console messages for both clients
  const aliceMessages = [];
  const bobMessages = [];

  pageAlice.on('console', msg => {
    const text = msg.text();
    if (text.includes('[th-set]') || text.includes('stateUpdate')) {
      aliceMessages.push(text);
      console.log('[ALICE]', text);
    }
  });

  pageBob.on('console', msg => {
    const text = msg.text();
    if (text.includes('[th-set]') || text.includes('stateUpdate')) {
      bobMessages.push(text);
      console.log('[BOB]', text);
    }
  });

  // Connect Alice
  console.log('[TEST] Connecting Alice...');
  await pageAlice.goto('http://localhost:53134/Twine/EngineDemo.html?id=alice', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  await new Promise(r => setTimeout(r, 2000));

  // Navigate Alice to counter demo
  await pageAlice.evaluate(() => {
    window.initializeUser(window.SugarCube.State.variables.userId);
    window.SugarCube.Engine.play('Hub');
  });
  await new Promise(r => setTimeout(r, 500));
  await pageAlice.evaluate(() => {
    window.SugarCube.Engine.play('Shared Counter Demo');
  });
  await new Promise(r => setTimeout(r, 1000));

  // Connect Bob
  console.log('\n[TEST] Connecting Bob...');
  await pageBob.goto('http://localhost:53134/Twine/EngineDemo.html?id=bob', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  await new Promise(r => setTimeout(r, 2000));

  // Navigate Bob to counter demo
  await pageBob.evaluate(() => {
    window.initializeUser(window.SugarCube.State.variables.userId);
    window.SugarCube.Engine.play('Hub');
  });
  await new Promise(r => setTimeout(r, 500));
  await pageBob.evaluate(() => {
    window.SugarCube.Engine.play('Shared Counter Demo');
  });
  await new Promise(r => setTimeout(r, 1000));

  // Get initial counter values
  const aliceInitial = await pageAlice.evaluate(() =>
    window.SugarCube.State.variables.sharedCounter
  );
  const bobInitial = await pageBob.evaluate(() =>
    window.SugarCube.State.variables.sharedCounter
  );

  console.log('\n[TEST] Initial state:');
  console.log('  Alice sees counter:', aliceInitial);
  console.log('  Bob sees counter:', bobInitial);

  // Alice clicks increment
  console.log('\n[TEST] Alice clicks increment button...');
  await pageAlice.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Increment (+1)'));
    if (btn) btn.click();
  });

  // Wait for synchronization
  await new Promise(r => setTimeout(r, 2000));

  // Check both clients see the update
  const aliceAfter = await pageAlice.evaluate(() =>
    window.SugarCube.State.variables.sharedCounter
  );
  const bobAfter = await pageBob.evaluate(() =>
    window.SugarCube.State.variables.sharedCounter
  );

  console.log('\n[TEST] After Alice\'s increment:');
  console.log('  Alice sees counter:', aliceAfter);
  console.log('  Bob sees counter:', bobAfter);

  // Bob clicks add 10
  console.log('\n[TEST] Bob clicks Add 10 button...');
  await pageBob.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Add 10'));
    if (btn) btn.click();
  });

  // Wait for synchronization
  await new Promise(r => setTimeout(r, 2000));

  // Check both clients see Bob's update
  const aliceFinal = await pageAlice.evaluate(() =>
    window.SugarCube.State.variables.sharedCounter
  );
  const bobFinal = await pageBob.evaluate(() =>
    window.SugarCube.State.variables.sharedCounter
  );

  console.log('\n[TEST] After Bob\'s Add 10:');
  console.log('  Alice sees counter:', aliceFinal);
  console.log('  Bob sees counter:', bobFinal);

  // Verify results
  console.log('\n[MULTIPLAYER TEST RESULTS]');
  let passed = 0;
  let failed = 0;

  if (aliceInitial === bobInitial) {
    console.log('✓ Both clients start with same counter value');
    passed++;
  } else {
    console.log('✗ Clients have different initial values (Alice:', aliceInitial, 'Bob:', bobInitial, ')');
    failed++;
  }

  if (aliceAfter === bobAfter && aliceAfter === aliceInitial + 1) {
    console.log('✓ Alice\'s increment synced to Bob');
    passed++;
  } else {
    console.log('✗ Alice\'s increment not synced (Alice:', aliceAfter, 'Bob:', bobAfter, 'Expected:', aliceInitial + 1, ')');
    failed++;
  }

  if (aliceFinal === bobFinal && bobFinal === bobAfter + 10) {
    console.log('✓ Bob\'s Add 10 synced to Alice');
    passed++;
  } else {
    console.log('✗ Bob\'s Add 10 not synced (Alice:', aliceFinal, 'Bob:', bobFinal, 'Expected:', bobAfter + 10, ')');
    failed++;
  }

  // Check that both clients see each other's last actions
  const aliceUserData = await pageAlice.evaluate(() =>
    window.SugarCube.State.variables.users
  );
  const bobUserData = await pageBob.evaluate(() =>
    window.SugarCube.State.variables.users
  );

  console.log('\n[USER DATA SYNC]');
  console.log('  Alice sees users:', Object.keys(aliceUserData || {}));
  console.log('  Bob sees users:', Object.keys(bobUserData || {}));

  if (aliceUserData && bobUserData &&
      aliceUserData.alice && aliceUserData.bob &&
      bobUserData.alice && bobUserData.bob) {
    console.log('✓ Both clients see both users');
    passed++;
  } else {
    console.log('✗ User data not fully synced');
    failed++;
  }

  console.log(`\n${passed} tests passed, ${failed} tests failed`);

  if (failed === 0) {
    console.log('✓ MULTIPLAYER TEST PASSED');
  } else {
    console.log('✗ MULTIPLAYER TEST FAILED');
  }

  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
