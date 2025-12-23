/**
 * Puppeteer script to play through the Aztec multiplayer game
 * Usage: node test-game-flow.js
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

// Character configuration
const CHARACTERS = [
    { name: 'Moctezuma', id: 'moc_test', faction: 'Aztec' },
    { name: 'Tlacaelel', id: 'tlac_test', faction: 'Aztec' },
    { name: 'Cuauhtemoc', id: 'cuau_test', faction: 'Aztec' },
    { name: 'Cortes', id: 'cor_test', faction: 'Spanish' },
    { name: 'Alvarado', id: 'alv_test', faction: 'Spanish' },
    { name: 'Marina', id: 'mar_test', faction: 'Spanish' },
    { name: 'Xicotencatl_Elder', id: 'xic_test', faction: 'Tlaxcalan' },
    { name: 'Xicotencatl_Younger', id: 'xicy_test', faction: 'Tlaxcalan' }
];

const BASE_URL = 'http://localhost:53134';
const HEADLESS = false; // Set to true for faster execution

// Log file for game flow documentation
const logFile = 'game-flow-log.json';
let gameLog = [];

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract page state from a character's page
 */
async function getPageState(page, character) {
    try {
        // Wait for passages element to be present (SugarCube uses #passages, not <main>)
        await page.waitForSelector('#passages, [role="main"]', { timeout: 5000 });

        return await page.evaluate(() => {
            const main = document.querySelector('#passages') || document.querySelector('[role="main"]');
            if (!main) return null;

            const text = main.innerText;
            const links = Array.from(document.querySelectorAll('a'))
                .map(a => ({ text: a.textContent.trim(), href: a.href }))
                .filter(l => {
                    if (!l.text) return false;
                    // Filter out SugarCube UI links and scoreboard
                    const excludeText = ['Aztecs:', 'Spaniards:', 'Tlaxcalans:', 'Saves', 'Restart', 'Settings'];
                    return !excludeText.some(ex => l.text.includes(ex));
                });
            const buttons = Array.from(document.querySelectorAll('button'))
                .map(b => b.textContent.trim())
                .filter(b => {
                    if (!b) return false;
                    // Filter out SugarCube UI buttons
                    const excludeText = ['Save', 'Delete', 'Load from Disk', 'Save to Disk', 'Delete All'];
                    return !excludeText.some(ex => b.includes(ex));
                });

            return { text, links, buttons };
        });
    } catch (err) {
        console.log(`  ${character}: Error getting page state - ${err.message}`);
        return null;
    }
}

/**
 * Setup all characters (click through intro)
 */
async function setupCharacters(pages) {
    console.log('Setting up all characters...');

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const char = CHARACTERS[i];

        console.log(`  ${char.name}: Clicking intro links...`);

        // Click "you're startled by a loud noise"
        try {
            await page.waitForSelector('a', { timeout: 5000 });
            const startledLink = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const link = links.find(a => a.textContent.toLowerCase().includes('startled'));
                if (link) {
                    link.click();
                    return true;
                }
                return false;
            });

            if (startledLink) {
                await wait(1000);

                // Click "begin your journey"
                await page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll('a'));
                    const link = links.find(a => a.textContent.toLowerCase().includes('begin'));
                    if (link) link.click();
                });

                console.log(`    ${char.name}: ✓ Setup complete`);
            }
        } catch (err) {
            console.log(`    ${char.name}: Already set up or error - ${err.message}`);
        }
    }

    // Wait for game to start - longer wait to ensure all players are synced
    console.log('Waiting for game to start and pages to render...');
    await wait(8000);

    // Wait for passages content to load on first page
    try {
        await pages[0].waitForSelector('#passages, [role="main"]', { timeout: 15000 });
        console.log('Game content loaded!');
    } catch (err) {
        console.log('Warning: Game content not loaded - trying to continue anyway');
    }
}

/**
 * Main function
 */
async function main() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: HEADLESS,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // Open pages for all characters
        console.log('Opening character pages...');
        const pages = [];

        for (const char of CHARACTERS) {
            const page = await browser.newPage();
            const url = `${BASE_URL}/?nick=${char.name}&id=${char.id}`;
            await page.goto(url);
            pages.push(page);
            console.log(`  Opened: ${char.name}`);
        }

        // Setup all characters
        await setupCharacters(pages);

        // Game loop - check all characters and make choices
        console.log('\nGame started! Beginning play-through...\n');

        let stepCount = 0;
        const maxSteps = 100; // Safety limit

        while (stepCount < maxSteps) {
            stepCount++;
            console.log(`\n=== Step ${stepCount} ===`);

            let anyAction = false;

            // Check each character's current state
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const char = CHARACTERS[i];

                const state = await getPageState(page, char);
                if (!state) continue;

                // Log state
                const logEntry = {
                    step: stepCount,
                    character: char.name,
                    faction: char.faction,
                    text: state.text.substring(0, 200),
                    links: state.links,
                    buttons: state.buttons
                };
                gameLog.push(logEntry);

                console.log(`${char.name}:`);
                console.log(`  Links: ${state.links.map(l => l.text).join(', ') || 'none'}`);
                console.log(`  Buttons: ${state.buttons.join(', ') || 'none'}`);

                // Make a choice if available
                if (state.links.length > 0) {
                    // Click first link
                    const linkText = state.links[0].text;
                    await page.evaluate((text) => {
                        const links = Array.from(document.querySelectorAll('a'));
                        const link = links.find(a => a.textContent.trim() === text);
                        if (link) link.click();
                    }, linkText);
                    console.log(`  → Clicked link: "${linkText}"`);
                    anyAction = true;
                } else if (state.buttons.length > 0) {
                    // Click first button
                    const buttonText = state.buttons[0];
                    await page.evaluate((text) => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const button = buttons.find(b => b.textContent.trim() === text);
                        if (button) button.click();
                    }, buttonText);
                    console.log(`  → Clicked button: "${buttonText}"`);
                    anyAction = true;
                }
            }

            if (!anyAction) {
                console.log('\nNo more actions available. Game may be complete!');
                break;
            }

            // Wait between steps
            await wait(2000);
        }

        // Save log
        fs.writeFileSync(logFile, JSON.stringify(gameLog, null, 2));
        console.log(`\nGame log saved to: ${logFile}`);
        console.log(`Total steps: ${stepCount}`);

        // Keep browser open for inspection
        console.log('\nBrowser will remain open for 30 seconds for inspection...');
        await wait(30000);

    } finally {
        await browser.close();
    }
}

main().catch(console.error);
