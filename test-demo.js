/**
 * Puppeteer Test for Multiplayer Engine Demo
 *
 * Tests the core multiplayer functionality:
 * - Shared Counter synchronization
 * - Message Board updates
 * - User Registry tracking
 *
 * Run with: node test-demo.js
 *
 * Prerequisites:
 * - npm run dev running on http://localhost:53134
 * - node tweeGazeDemo.js to compile the demo
 */

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:53134';
const DEMO_PATH = '/Twine/EngineDemo.html';

// Test users
const USERS = ['alice', 'bob', 'charlie'];

/**
 * Helper function to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for SugarCube to be ready
 */
async function waitForSugarCube(page) {
  await page.waitForFunction(() => {
    return window.SugarCube && window.SugarCube.State && window.SugarCube.State.variables;
  }, { timeout: 10000 });
}

/**
 * Get current passage name
 */
async function getCurrentPassage(page) {
  return await page.evaluate(() => {
    return window.SugarCube.State.passage;
  });
}

/**
 * Click a link by text content
 */
async function clickLink(page, text) {
  await page.evaluate((text) => {
    const links = Array.from(document.querySelectorAll('a'));
    const targetLink = links.find(a => a.textContent.includes(text));
    if (targetLink) {
      targetLink.click();
      return true;
    }
    throw new Error(`Link with text "${text}" not found`);
  }, text);
  await sleep(500);
}

/**
 * Click a button by text content
 */
async function clickButton(page, text) {
  await page.evaluate((text) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const targetButton = buttons.find(b => b.textContent.includes(text));
    if (targetButton) {
      targetButton.click();
      return true;
    }
    throw new Error(`Button with text "${text}" not found`);
  }, text);
  await sleep(300);
}

/**
 * Initialize a user and navigate to Hub
 */
async function initializeUser(page, userId) {
  console.log(`  [${userId}] Initializing...`);

  const url = `${BASE_URL}${DEMO_PATH}?id=${userId}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  await waitForSugarCube(page);

  // Check current passage
  let passage = await getCurrentPassage(page);
  console.log(`  [${userId}] Current passage: ${passage}`);

  if (passage === 'Start') {
    // Fill in userId if not set from URL
    await page.evaluate((uid) => {
      if (window.SugarCube.State.variables.userId === 'guest') {
        window.SugarCube.State.variables.userId = uid;
      }
    }, userId);

    // Click "Start Demo" button
    await clickButton(page, 'Start Demo');
    await sleep(500);

    passage = await getCurrentPassage(page);
    console.log(`  [${userId}] Advanced to: ${passage}`);
  }

  // Should now be at Hub
  passage = await getCurrentPassage(page);
  if (passage !== 'Hub') {
    throw new Error(`Expected Hub but got ${passage}`);
  }

  console.log(`  [${userId}] ✓ Initialized at Hub`);
}

/**
 * Test Shared Counter Demo
 */
async function testSharedCounter(page, userId) {
  console.log(`  [${userId}] Testing Shared Counter...`);

  // Navigate to Shared Counter Demo
  await clickLink(page, 'Shared Counter Demo');

  let passage = await getCurrentPassage(page);
  if (passage !== 'Shared Counter Demo') {
    throw new Error(`Expected "Shared Counter Demo" but got "${passage}"`);
  }

  // Get initial counter value
  const initialValue = await page.evaluate(() => {
    return window.SugarCube.State.variables.sharedCounter;
  });
  console.log(`  [${userId}] Initial counter: ${initialValue}`);

  // Click Increment button
  await clickButton(page, 'Increment (+1)');
  await sleep(500);

  // Verify counter incremented
  const afterIncrement = await page.evaluate(() => {
    return window.SugarCube.State.variables.sharedCounter;
  });

  if (afterIncrement !== initialValue + 1) {
    throw new Error(`Counter should be ${initialValue + 1} but is ${afterIncrement}`);
  }
  console.log(`  [${userId}] ✓ Increment worked: ${afterIncrement}`);

  // Click Add 10 button (compound operator test)
  await clickButton(page, 'Add 10 (+=)');
  await sleep(500);

  const afterAdd10 = await page.evaluate(() => {
    return window.SugarCube.State.variables.sharedCounter;
  });

  if (afterAdd10 !== afterIncrement + 10) {
    throw new Error(`Counter should be ${afterIncrement + 10} but is ${afterAdd10}`);
  }
  console.log(`  [${userId}] ✓ Compound operator (+=) worked: ${afterAdd10}`);

  // Return to Hub
  await clickLink(page, 'Back to Hub');

  console.log(`  [${userId}] ✓ Shared Counter test passed`);
}

/**
 * Test Message Board Demo
 */
async function testMessageBoard(page, userId) {
  console.log(`  [${userId}] Testing Message Board...`);

  // Navigate to Message Board
  await clickLink(page, 'Message Board Demo');

  let passage = await getCurrentPassage(page);
  if (passage !== 'Message Board Demo') {
    throw new Error(`Expected "Message Board Demo" but got "${passage}"`);
  }

  // Get initial message count
  const initialCount = await page.evaluate(() => {
    return window.SugarCube.State.variables.messageBoard.length;
  });
  console.log(`  [${userId}] Initial messages: ${initialCount}`);

  // Post a message
  const testMessage = `Hello from ${userId}!`;
  await page.evaluate((msg) => {
    const textbox = document.querySelector('input[type="text"]');
    if (textbox) {
      textbox.value = msg;
    }
  }, testMessage);

  await clickButton(page, 'Post Message');
  await sleep(500);

  // Verify message was posted
  const afterPost = await page.evaluate(() => {
    return window.SugarCube.State.variables.messageBoard.length;
  });

  if (afterPost !== initialCount + 1) {
    throw new Error(`Message count should be ${initialCount + 1} but is ${afterPost}`);
  }

  // Verify message content
  const lastMessage = await page.evaluate(() => {
    const messages = window.SugarCube.State.variables.messageBoard;
    return messages[messages.length - 1];
  });

  if (lastMessage.author !== userId || lastMessage.message !== testMessage) {
    throw new Error(`Message mismatch: expected "${testMessage}" from ${userId}`);
  }

  console.log(`  [${userId}] ✓ Posted message: "${testMessage}"`);

  // Return to Hub
  await clickLink(page, 'Back to Hub');

  console.log(`  [${userId}] ✓ Message Board test passed`);
}

/**
 * Test User Registry Demo
 */
async function testUserRegistry(page, userId) {
  console.log(`  [${userId}] Testing User Registry...`);

  // Navigate to User Registry
  await clickLink(page, 'User Registry Demo');

  let passage = await getCurrentPassage(page);
  if (passage !== 'User Registry Demo') {
    throw new Error(`Expected "User Registry Demo" but got "${passage}"`);
  }

  // Verify user exists in registry
  const userExists = await page.evaluate((uid) => {
    const users = window.SugarCube.State.variables.users;
    return users && users[uid] !== undefined;
  }, userId);

  if (!userExists) {
    throw new Error(`User ${userId} not found in registry`);
  }

  // Get initial score
  const initialScore = await page.evaluate((uid) => {
    return window.SugarCube.State.variables.users[uid].score;
  }, userId);
  console.log(`  [${userId}] Initial score: ${initialScore}`);

  // Gain 10 points
  await clickButton(page, 'Gain 10 Points');
  await sleep(500);

  const afterGain = await page.evaluate((uid) => {
    return window.SugarCube.State.variables.users[uid].score;
  }, userId);

  if (afterGain !== initialScore + 10) {
    throw new Error(`Score should be ${initialScore + 10} but is ${afterGain}`);
  }
  console.log(`  [${userId}] ✓ Gained points: ${afterGain}`);

  // Lose 5 points
  await clickButton(page, 'Lose 5 Points');
  await sleep(500);

  const afterLoss = await page.evaluate((uid) => {
    return window.SugarCube.State.variables.users[uid].score;
  }, userId);

  if (afterLoss !== afterGain - 5) {
    throw new Error(`Score should be ${afterGain - 5} but is ${afterLoss}`);
  }
  console.log(`  [${userId}] ✓ Lost points: ${afterLoss}`);

  // Return to Hub
  await clickLink(page, 'Back to Hub');

  console.log(`  [${userId}] ✓ User Registry test passed`);
}

/**
 * Test a single user
 */
async function testUser(browser, userId) {
  console.log(`\n[${userId}] Starting test...`);

  const page = await browser.newPage();

  try {
    // Initialize user
    await initializeUser(page, userId);

    // Run all tests
    await testSharedCounter(page, userId);
    await testMessageBoard(page, userId);
    await testUserRegistry(page, userId);

    // Verify we're back at Hub
    const finalPassage = await getCurrentPassage(page);
    if (finalPassage !== 'Hub') {
      throw new Error(`Should be at Hub but at ${finalPassage}`);
    }

    console.log(`[${userId}] ✓ All tests passed!`);

    return { success: true, userId };

  } catch (error) {
    console.error(`[${userId}] ✗ Test failed:`, error.message);

    // Take screenshot
    const screenshotPath = `/tmp/demo-error-${userId}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`[${userId}] Screenshot saved: ${screenshotPath}`);

    return { success: false, userId, error: error.message };
  }
}

/**
 * Test multiplayer synchronization
 */
async function testMultiplayerSync(browser) {
  console.log('\n[SYNC TEST] Testing real-time synchronization...');

  // Open two pages
  const alice = await browser.newPage();
  const bob = await browser.newPage();

  try {
    // Initialize both users
    await initializeUser(alice, 'alice');
    await initializeUser(bob, 'bob');

    console.log('  [SYNC] Both users initialized');

    // Alice navigates to Shared Counter
    await clickLink(alice, 'Shared Counter Demo');

    // Bob also navigates to Shared Counter
    await clickLink(bob, 'Shared Counter Demo');

    console.log('  [SYNC] Both at Shared Counter Demo');

    // Get initial counter value from both
    const aliceInitial = await alice.evaluate(() => {
      return window.SugarCube.State.variables.sharedCounter;
    });
    const bobInitial = await bob.evaluate(() => {
      return window.SugarCube.State.variables.sharedCounter;
    });

    if (aliceInitial !== bobInitial) {
      throw new Error(`Initial values don't match: Alice=${aliceInitial}, Bob=${bobInitial}`);
    }

    console.log(`  [SYNC] Initial counter: ${aliceInitial}`);

    // Alice increments counter
    await clickButton(alice, 'Increment (+1)');
    await sleep(1000); // Give time for sync

    // Check Bob's page updated
    const bobAfter = await bob.evaluate(() => {
      return window.SugarCube.State.variables.sharedCounter;
    });

    if (bobAfter !== aliceInitial + 1) {
      throw new Error(`Sync failed! Bob should see ${aliceInitial + 1} but sees ${bobAfter}`);
    }

    console.log(`  [SYNC] ✓ Counter synced to Bob: ${bobAfter}`);

    // Bob increments
    await clickButton(bob, 'Increment (+1)');
    await sleep(1000);

    // Check Alice's page updated
    const aliceAfter = await alice.evaluate(() => {
      return window.SugarCube.State.variables.sharedCounter;
    });

    if (aliceAfter !== bobAfter + 1) {
      throw new Error(`Sync failed! Alice should see ${bobAfter + 1} but sees ${aliceAfter}`);
    }

    console.log(`  [SYNC] ✓ Counter synced to Alice: ${aliceAfter}`);

    await alice.close();
    await bob.close();

    console.log('[SYNC TEST] ✓ Multiplayer synchronization works!');
    return { success: true };

  } catch (error) {
    console.error('[SYNC TEST] ✗ Failed:', error.message);
    await alice.close();
    await bob.close();
    return { success: false, error: error.message };
  }
}

/**
 * Main test suite
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('Multiplayer Engine Demo - Test Suite');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}${DEMO_PATH}`);
  console.log(`Test Users: ${USERS.join(', ')}`);
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    // Test each user sequentially (to see the flow clearly)
    const results = [];
    for (const userId of USERS) {
      const result = await testUser(browser, userId);
      results.push(result);
    }

    // Test multiplayer synchronization
    const syncResult = await testMultiplayerSync(browser);
    results.push(syncResult);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS:');
    console.log('='.repeat(60));

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    console.log(`✓ Passed: ${successes.length}/${results.length}`);
    successes.forEach(r => console.log(`  ✓ ${r.userId || 'SYNC TEST'}`));

    if (failures.length > 0) {
      console.log(`\n✗ Failed: ${failures.length}/${results.length}`);
      failures.forEach(r => console.log(`  ✗ ${r.userId || 'SYNC TEST'}: ${r.error}`));
      console.log('\n' + '='.repeat(60));
      console.error('Some tests failed - check screenshots in /tmp/');
      console.log('='.repeat(60));
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('✓ All tests passed!');
      console.log('='.repeat(60));
    }

    console.log('\nClosing browser...');
    await browser.close();

    process.exit(failures.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Test suite crashed:', error.message);
    console.error('='.repeat(60));
    await browser.close();
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);
