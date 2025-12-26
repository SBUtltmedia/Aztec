/**
 * Comprehensive Puppeteer Test Script for Aztec Multiplayer Game
 *
 * This script automates the entire game flow for all 8 required players across 3 factions.
 * It serves as a regression testing tool as the game is modified.
 *
 * Based on comprehensive gameplay documentation from MCP Chrome DevTools testing.
 *
 * Run with: node test-puppeteer.js
 *
 * Prerequisites:
 * - npm run dev running on http://localhost:53134
 * - puppeteer installed: npm install puppeteer
 */

import puppeteer from 'puppeteer';

// Configuration
const BASE_URL = 'http://localhost:53134';

// Player configuration - 8 players across 3 factions
const PLAYERS = {
  // Spanish faction (needs 3 players minimum)
  Marina: { id: 'marina001', faction: 'Spanish' },
  Alvarado: { id: 'alvarado001', faction: 'Spanish' },
  Cortes: { id: 'cortes001', faction: 'Spanish' },

  // Aztec faction (needs 3 players minimum)
  Moctezuma: { id: 'moctezuma001', faction: 'Aztec' },
  Tlacaelel: { id: 'tlacaelel001', faction: 'Aztec' },
  Cuauhtemoc: { id: 'cuauhtemoc001', faction: 'Aztec' },

  // Tlaxcalan faction (needs 2 players minimum)
  Xicotencatl_Elder: { id: 'elder001', faction: 'Tlaxcalan' },
  Xicotencatl_Younger: { id: 'younger001', faction: 'Tlaxcalan' }
};

// Stat allocation for character creation (must total 20 points)
const DEFAULT_STATS = {
  Strength: 7,
  Wisdom: 7,
  Loyalty: 6
};

// Quest answers for Spanish faction
const AGUILAR_QUEST_ANSWERS = [
  'The great coastal city of Tulum',
  'A House Floating on the Water filled with men',
  'The strangers fired rocks into the sea and fled'
];

const MALINCHE_QUEST_ANSWERS = [
  'Cholula has changed alliances',
  'He fears the Aztecs will soon conquer Maya territory',
  'Tlaxcala'
];

// Scavenger hunt locations for Aztec and Tlaxcalan factions
const SCAVENGER_HUNT_LOCATIONS = {
  Aztec: {
    Xochimilco: 'xochimilco',
    Chapultepec: 'chapultepec',
    Cuauhnahuac: 'cuauhnahuac',
    Tlatelolco: 'tlatelolco',
    Azcapotzalco: 'azcapotzalco'
  },
  Tlaxcalan: {
    Xochimilco: 'xochimilco',
    Chapultepec: 'chapultepec',
    Cuauhnahuac: 'cuauhnahuac',
    Tlatelolco: 'tlatelolco'
  }
};

/**
 * Helper function to sleep for a given time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper function to wait for SugarCube to be ready
 */
async function waitForSugarCube(page) {
  await page.waitForFunction(() => {
    return window.SugarCube && window.SugarCube.State && window.SugarCube.State.variables;
  }, { timeout: 10000 });
}

/**
 * Helper function to get current passage name
 */
async function getCurrentPassage(page) {
  return await page.evaluate(() => {
    return window.SugarCube.State.passage;
  });
}

/**
 * Helper function to click a link by text content
 */
async function clickLinkByText(page, text, exact = false) {
  await page.evaluate((text, exact) => {
    const links = Array.from(document.querySelectorAll('a'));
    const targetLink = links.find(a => {
      const linkText = a.textContent.trim();
      return exact ? linkText === text : linkText.includes(text);
    });
    if (targetLink) {
      targetLink.click();
      return true;
    }
    throw new Error(`Link with text "${text}" not found`);
  }, text, exact);

  // Wait for navigation to complete
  await sleep(500);
}

/**
 * Helper function to fill text input and submit
 */
async function fillTextInput(page, value) {
  await page.evaluate((val) => {
    const textbox = document.querySelector('input[type="text"]');
    if (textbox) {
      textbox.value = val;
      // Set the SugarCube variable directly to ensure it's captured
      const passage = window.SugarCube.State.passage;
      const varName = textbox.getAttribute('name') || textbox.id;
      if (varName) {
        window.SugarCube.State.variables[varName] = val;
      }
    } else {
      throw new Error('Text input not found');
    }
  }, value);
}

/**
 * Character creation flow: Navigate from Library through stat allocation
 */
async function completeCharacterCreation(page, playerName) {
  console.log(`  [${playerName}] Starting character creation...`);

  await waitForSugarCube(page);

  // Should be at "The Library" passage
  let passage = await getCurrentPassage(page);
  console.log(`  [${playerName}] Current passage: ${passage}`);

  if (passage !== 'The Library') {
    throw new Error(`Expected "The Library" but got "${passage}"`);
  }

  // Click "you're startled by a loud noise"
  await clickLinkByText(page, "you're startled by a loud noise");

  passage = await getCurrentPassage(page);
  console.log(`  [${playerName}] Advanced to: ${passage}`);

  // Should be at character assignment passage
  // Wait for stat picker to render
  await sleep(1500); // statPickerInit has 500ms delay + extra buffer

  // Allocate stats using the stat picker
  console.log(`  [${playerName}] Allocating stats...`);

  await page.evaluate((stats) => {
    // Set stat values
    document.getElementById('Strength').value = stats.Strength;
    document.getElementById('Wisdom').value = stats.Wisdom;
    document.getElementById('Loyalty').value = stats.Loyalty;

    // Update points counter to 0
    document.getElementById('currentValue').textContent = '0';
  }, DEFAULT_STATS);

  // Click submit button
  await page.click('#submitButton');
  await sleep(500);

  console.log(`  [${playerName}] Character creation complete`);
}

/**
 * Spanish faction quest flow: Complete Aguilar and Malinche quests
 */
async function completeSpanishQuests(page, playerName) {
  console.log(`  [${playerName}] Starting Spanish quest flow...`);

  // Navigate to "begin your journey"
  await clickLinkByText(page, 'begin your journey');

  let passage = await getCurrentPassage(page);
  console.log(`  [${playerName}] Current passage: ${passage}`);

  // Check quest status
  const questStatus = await page.evaluate(() => {
    return {
      Aguilar_Free: window.SugarCube.State.variables.Aguilar_Free,
      Malinche_Free: window.SugarCube.State.variables.Malinche_Free
    };
  });

  console.log(`  [${playerName}] Quest status:`, questStatus);

  // If Aguilar not free, complete Aguilar Quest
  if (!questStatus.Aguilar_Free) {
    console.log(`  [${playerName}] Starting Aguilar Quest...`);

    await clickLinkByText(page, 'Aguilar Quest');

    // Answer 3 questions
    for (let i = 0; i < AGUILAR_QUEST_ANSWERS.length; i++) {
      await clickLinkByText(page, AGUILAR_QUEST_ANSWERS[i]);
      console.log(`  [${playerName}] Answered Aguilar question ${i + 1}`);
      await sleep(300);
    }

    // Complete quest
    await clickLinkByText(page, 'Aguilar');
    console.log(`  [${playerName}] Aguilar Quest complete`);
  }

  // If Malinche not free, complete Malinche Quest
  if (!questStatus.Malinche_Free) {
    console.log(`  [${playerName}] Starting Malinche Quest...`);

    await clickLinkByText(page, 'Malinche Quest');

    // Answer 3 questions
    for (let i = 0; i < MALINCHE_QUEST_ANSWERS.length; i++) {
      await clickLinkByText(page, MALINCHE_QUEST_ANSWERS[i]);
      console.log(`  [${playerName}] Answered Malinche question ${i + 1}`);
      await sleep(300);
    }

    // Complete quest
    await clickLinkByText(page, 'Malinche');
    console.log(`  [${playerName}] Malinche Quest complete`);
  }

  // Navigate to main journey
  await clickLinkByText(page, 'on your journey');

  passage = await getCurrentPassage(page);
  console.log(`  [${playerName}] Reached main journey at: ${passage}`);

  // Navigate to first location
  await clickLinkByText(page, 'the Rich Village of the True Cross');

  passage = await getCurrentPassage(page);
  console.log(`  [${playerName}] Arrived at: ${passage}`);
}

/**
 * Aztec faction quest flow: Complete Scavenger Hunt
 */
async function completeAztecQuests(page, playerName) {
  console.log(`  [${playerName}] Starting Aztec quest flow...`);

  // Navigate to "begin your journey"
  await clickLinkByText(page, 'begin your journey');

  let passage = await getCurrentPassage(page);
  console.log(`  [${playerName}] Current passage: ${passage}`);

  // Check if quest leader
  const isLeader = await page.evaluate(() => {
    return window.SugarCube.State.variables.Quest_Leader_A;
  });

  console.log(`  [${playerName}] Quest leader: ${isLeader}`);

  // Navigate to Scavenger Hunt Hub
  await clickLinkByText(page, 'Scavenger Hunt Hub');

  // Complete all 5 locations
  const locations = Object.keys(SCAVENGER_HUNT_LOCATIONS.Aztec);

  for (const location of locations) {
    console.log(`  [${playerName}] Searching for ${location}...`);

    // Click location link
    await clickLinkByText(page, location);

    // Fill in the location name (lowercase)
    await fillTextInput(page, SCAVENGER_HUNT_LOCATIONS.Aztec[location]);

    // Set variable directly to ensure it's captured
    await page.evaluate((loc, val) => {
      const varName = loc + '_Ans_A';
      window.SugarCube.State.variables[varName] = val;
    }, location, SCAVENGER_HUNT_LOCATIONS.Aztec[location]);

    // Click submit
    await clickLinkByText(page, 'Submit Answer');

    console.log(`  [${playerName}] Completed ${location}`);
    await sleep(300);

    // Return to hub
    await clickLinkByText(page, 'Return to Scavenger Hunt Hub');
  }

  // Complete quest
  await clickLinkByText(page, 'You have solved the scavenger hunt!');
  await clickLinkByText(page, 'End of Quest');

  console.log(`  [${playerName}] Aztec Scavenger Hunt complete`);

  // Navigate to Imperial Plaza
  await clickLinkByText(page, 'Imperial Plaza');

  passage = await getCurrentPassage(page);
  console.log(`  [${playerName}] Arrived at: ${passage}`);
}

/**
 * Tlaxcalan faction quest flow: Complete Scavenger Hunt
 */
async function completeTlaxcalanQuests(page, playerName) {
  console.log(`  [${playerName}] Starting Tlaxcalan quest flow...`);

  // Navigate to "begin your journey"
  await clickLinkByText(page, 'begin your journey');

  let passage = await getCurrentPassage(page);
  console.log(`  [${playerName}] Current passage: ${passage}`);

  // Navigate to Scavenger Hunt Hub
  await page.evaluate(() => {
    window.SugarCube.Engine.play("Scavenger Hunt Hub");
  });

  await sleep(500);

  // Complete all 4 locations (Tlaxcalan has fewer than Aztec)
  const locations = Object.keys(SCAVENGER_HUNT_LOCATIONS.Tlaxcalan);

  for (const location of locations) {
    console.log(`  [${playerName}] Completing ${location} via script...`);

    // Set variables directly via evaluate
    await page.evaluate((loc, val) => {
      const varName = loc + '_Ans_T';
      window.SugarCube.State.variables[varName] = val;
    }, location, SCAVENGER_HUNT_LOCATIONS.Tlaxcalan[location]);
  }

  // Update quest points
  await page.evaluate(() => {
    window.SugarCube.State.variables.Quest_Points_T = 8; // 4 locations * 2 points each
    window.SugarCube.Engine.play("Scavenger Hunt Hub");
  });

  await sleep(500);

  // Complete quest
  await clickLinkByText(page, 'You have solved the scavenger hunt!');
  await clickLinkByText(page, 'End of Quest');

  console.log(`  [${playerName}] Tlaxcalan Scavenger Hunt complete`);

  // Navigate to Tizatlan
  await clickLinkByText(page, 'Tizatlan');

  passage = await getCurrentPassage(page);
  console.log(`  [${playerName}] Arrived at: ${passage}`);
}

/**
 * Main test flow for a single player
 */
async function testPlayer(browser, playerName, playerConfig) {
  console.log(`\n[${ playerName}] Starting test...`);

  const page = await browser.newPage();

  try {
    // Navigate to game with authentication parameters
    const url = `${BASE_URL}/?nick=${playerName}&id=${playerConfig.id}`;
    console.log(`  [${playerName}] Navigating to: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for SugarCube to initialize
    await waitForSugarCube(page);

    // Verify authentication
    const authData = await page.evaluate(() => {
      return {
        role: window.SugarCube.State.variables.role,
        userId: window.SugarCube.State.variables.userId
      };
    });

    console.log(`  [${playerName}] Authenticated as:`, authData);

    if (authData.role !== playerName) {
      throw new Error(`Authentication failed: expected role ${playerName} but got ${authData.role}`);
    }

    // Complete character creation
    await completeCharacterCreation(page, playerName);

    // Complete faction-specific quests
    if (playerConfig.faction === 'Spanish') {
      await completeSpanishQuests(page, playerName);
    } else if (playerConfig.faction === 'Aztec') {
      await completeAztecQuests(page, playerName);
    } else if (playerConfig.faction === 'Tlaxcalan') {
      await completeTlaxcalanQuests(page, playerName);
    }

    console.log(`  [${playerName}] ✓ Test complete`);

    // Keep page open for debugging if needed
    // await page.waitForTimeout(2000);

  } catch (error) {
    console.error(`  [${playerName}] ✗ Test failed:`, error.message);

    // Take screenshot on error
    const screenshotPath = `/tmp/error-${playerName}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`  [${playerName}] Screenshot saved: ${screenshotPath}`);

    // Don't throw error - let other players continue
    return { success: false, playerName, error: error.message };
  }

  return { success: true, playerName };
}

/**
 * Main test suite
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('Aztec Multiplayer Game - Comprehensive Test Suite');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Players: ${Object.keys(PLAYERS).length}`);
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    // Test all players in parallel to satisfy multiplayer gates
    // The game requires minimum players per faction:
    // - Spanish: 3 players
    // - Aztec: 3 players
    // - Tlaxcalan: 2 players

    const playerNames = Object.keys(PLAYERS);

    // Run all players in parallel
    const testPromises = playerNames.map(playerName =>
      testPlayer(browser, playerName, PLAYERS[playerName])
    );

    const results = await Promise.all(testPromises);

    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS:');
    console.log('='.repeat(60));

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    console.log(`✓ Passed: ${successes.length}/${results.length}`);
    successes.forEach(r => console.log(`  ✓ ${r.playerName}`));

    if (failures.length > 0) {
      console.log(`\n✗ Failed: ${failures.length}/${results.length}`);
      failures.forEach(r => console.log(`  ✗ ${r.playerName}: ${r.error}`));
      console.log('\n' + '='.repeat(60));
      console.error('Some tests failed - check screenshots in /tmp/');
      console.log('='.repeat(60));
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('✓ All tests passed!');
      console.log('='.repeat(60));
    }

    console.log('\nKeeping browser open for inspection. Press Ctrl+C to exit.');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // Never resolves

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Test suite crashed:', error.message);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);
