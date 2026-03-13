/**
 * Aztec Full Playthrough Test
 *
 * Plays through the game sequentially as each character.
 * One character at a time — each "logs in" via ?nick=Role, makes decisions,
 * and "logs out" (page.goto with a new nick) before the next character starts.
 *
 * Pass condition: every character reaches a recognised end-of-game passage
 * without getting stuck.
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Game configuration
// ---------------------------------------------------------------------------

const CHARACTERS = [
  'Cortes',
  'Alvarado',
  'Aguilar',
  'Garrido',
  'Olid',
  'Marina',
  'Moctezuma',
  'Tlacaelel',
  'Cuauhtemoc',
  'Aztec_Priest',
  'Cacamatzin',
  'Pochteca',
  'Xicotencatl_Elder',
  'Xicotencatl_Younger',
  'Maxixcatl',
];

// Passages whose data-passage attribute (lowercased, spaces→hyphens) signals
// the game is over for this character.  Add more as discovered.
const END_PASSAGES = new Set([
  'waking-up-in-the-library-on-a-full-belly',
  'waking-up-in-the-library',
  'waking-up-in-the-library-3',
  'a-desperate-return-to-the-library',
  'waking-up-6-months-later',
  '2-return-to-the-library',
  '3-return-to-the-library',
  '5-last-nap-in-the-library',
  'return-to-the-library_no-door',
  'end-of-quest',
  'the-end',
]);

// Passages that signal a test failure (wrong nick, blocked, etc.)
const FAIL_PASSAGES = new Set([
  'name-not-recognized',
]);

// Max navigation steps before declaring a character "stuck"
const MAX_STEPS = 200;

// How long to wait for a passage to appear after a click (ms)
const NAV_TIMEOUT = 10_000;

/**
 * Optional decision map.
 * Key   = exact passage name (as shown in data-passage, original casing preserved)
 * Value = text of the link/button to click (partial match, case-insensitive)
 *         OR a numeric index (0 = first link, 1 = second, etc.)
 *
 * Leave a passage out to fall back to "click first available link".
 * Populate this over time as you discover which choices lead to progress.
 */
const DECISIONS = {
  // Character setup — always begin the journey regardless of stat allocation
  'Character assignment and points selection': 'begin your journey',

  // Add more as you map out the game, e.g.:
  // 'Tlaxcala Decides About the Spaniards': 0,
  // 'Cholula Results': 'continue',
};

// ---------------------------------------------------------------------------
// Helper: slugify a passage name the same way SugarCube does for data-passage
// ---------------------------------------------------------------------------
function slug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
}

// ---------------------------------------------------------------------------
// Core: play one character from login to end (or stuck)
// ---------------------------------------------------------------------------
async function playCharacter(page, role, log) {
  log(`\n=== ${role} ===`);

  await page.goto(`/?nick=${role}`, { waitUntil: 'networkidle' });

  // Wait for SugarCube passages element to be present
  await page.waitForSelector('#passages', { timeout: 15_000 });

  let steps = 0;
  let prevPassage = null;
  let samePassageCount = 0;

  while (steps < MAX_STEPS) {
    // ------------------------------------------------------------------
    // 1. Read current passage
    // ------------------------------------------------------------------
    const passageEl = page.locator('#passages [data-passage]').first();
    await passageEl.waitFor({ state: 'visible', timeout: NAV_TIMEOUT });

    const passageName = await passageEl.getAttribute('data-passage');
    const passageSlug = slug(passageName || '');

    log(`  [${steps}] ${passageName}`);

    // ------------------------------------------------------------------
    // 2. Check terminal states
    // ------------------------------------------------------------------
    if (FAIL_PASSAGES.has(passageSlug)) {
      return { success: false, reason: `fail-passage: ${passageName}`, steps };
    }
    if (END_PASSAGES.has(passageSlug)) {
      log(`  ✓ Reached end: "${passageName}"`);
      return { success: true, endPassage: passageName, steps };
    }

    // ------------------------------------------------------------------
    // 3. Stuck detection — same passage 3 times in a row
    // ------------------------------------------------------------------
    if (passageName === prevPassage) {
      samePassageCount++;
      if (samePassageCount >= 3) {
        return { success: false, reason: `stuck on: "${passageName}"`, steps };
      }
    } else {
      samePassageCount = 0;
      prevPassage = passageName;
    }

    // ------------------------------------------------------------------
    // 4. Find something to click
    // ------------------------------------------------------------------
    const decision = DECISIONS[passageName];

    let clicked = false;

    // A. Decision map — match by text
    if (decision !== undefined) {
      if (typeof decision === 'string') {
        const linkByText = page.locator(
          `#passages a.link-internal, #passages button.link-internal`
        ).filter({ hasText: new RegExp(decision, 'i') }).first();
        if (await linkByText.count() > 0) {
          await linkByText.click();
          clicked = true;
          log(`    → (decision map) "${decision}"`);
        }
      } else if (typeof decision === 'number') {
        const links = page.locator(`#passages a.link-internal, #passages button.link-internal`);
        const nth = links.nth(decision);
        if (await nth.count() > 0) {
          const txt = await nth.textContent();
          await nth.click();
          clicked = true;
          log(`    → (decision map index ${decision}) "${txt?.trim()}"`);
        }
      }
    }

    // B. First available link
    if (!clicked) {
      const firstLink = page.locator(`#passages a.link-internal`).first();
      if (await firstLink.count() > 0) {
        const txt = await firstLink.textContent();
        await firstLink.click();
        clicked = true;
        log(`    → (first link) "${txt?.trim()}"`);
      }
    }

    // C. First available button
    if (!clicked) {
      const firstBtn = page.locator(`#passages button.link-internal`).first();
      if (await firstBtn.count() > 0) {
        const txt = await firstBtn.textContent();
        await firstBtn.click();
        clicked = true;
        log(`    → (first button) "${txt?.trim()}"`);
      }
    }

    // D. Nothing to click — stuck
    if (!clicked) {
      return {
        success: false,
        reason: `no clickable links on: "${passageName}"`,
        steps,
      };
    }

    // Wait a moment for SugarCube to render the next passage
    await page.waitForTimeout(300);
    steps++;
  }

  return { success: false, reason: `exceeded ${MAX_STEPS} steps`, steps };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Aztec Game — Full Character Playthrough', () => {

  /**
   * Smoke test: all characters can log in and reach character assignment
   * without hitting "Name Not Recognized".
   */
  test('all characters are recognised at login', async ({ page }) => {
    for (const role of CHARACTERS) {
      await page.goto(`/?nick=${role}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#passages', { timeout: 15_000 });

      const passageEl = page.locator('#passages [data-passage]').first();
      await passageEl.waitFor({ state: 'visible', timeout: 10_000 });
      const passageName = await passageEl.getAttribute('data-passage');

      expect(
        passageName,
        `${role} landed on "Name Not Recognized" — check spelling`
      ).not.toBe('Name Not Recognized');

      console.log(`  ✓ ${role} → "${passageName}"`);
    }
  });

  /**
   * Full playthrough: each character plays until they reach an end passage.
   * Server state from earlier characters is visible to later ones (intentional —
   * mirrors real multiplayer where all players share state).
   */
  test('each character can reach the end', async ({ page }) => {
    const results = [];
    const log = (msg) => console.log(msg);

    for (const role of CHARACTERS) {
      const result = await playCharacter(page, role, log);
      results.push({ role, ...result });

      // Print a one-line summary per character while running
      if (result.success) {
        console.log(`✅ ${role} — reached "${result.endPassage}" in ${result.steps} steps`);
      } else {
        console.log(`❌ ${role} — ${result.reason} (after ${result.steps} steps)`);
      }
    }

    // Collect all failures and report together so you see all broken characters
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      const report = failures
        .map((f) => `  ${f.role}: ${f.reason}`)
        .join('\n');
      throw new Error(`${failures.length} character(s) did not reach the end:\n${report}`);
    }
  });

  /**
   * Per-character individual tests — useful for running a single role in
   * isolation during development:  npx playwright test --grep "Cortes"
   */
  for (const role of CHARACTERS) {
    test(`${role} reaches the end`, async ({ page }) => {
      const log = (msg) => console.log(msg);
      const result = await playCharacter(page, role, log);
      expect(result.success, result.reason).toBe(true);
    });
  }
});
