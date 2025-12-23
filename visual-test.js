/**
 * Visual Puppeteer test - plays through slowly with visible browser windows
 * Purpose: Check for state corruption and synchronization issues
 */

import puppeteer from 'puppeteer';

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
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setupCharacter(page, char) {
    try {
        console.log(`${char.name}: Setting up...`);
        await page.waitForSelector('#passages, [role="main"]', { timeout: 10000 });

        // Click "you're startled by a loud noise"
        const clicked = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const link = links.find(a => a.textContent.toLowerCase().includes('startled'));
            if (link) {
                link.click();
                return true;
            }
            return false;
        });

        if (clicked) {
            await wait(1500);

            // Click "begin your journey"
            await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const link = links.find(a => a.textContent.toLowerCase().includes('begin'));
                if (link) link.click();
            });

            console.log(`${char.name}: ✓ Setup complete`);
        }
    } catch (err) {
        console.log(`${char.name}: Setup error - ${err.message}`);
    }
}

async function getGameLinks(page) {
    return await page.evaluate(() => {
        const main = document.querySelector('#passages') || document.querySelector('[role="main"]');
        if (!main) return [];

        const links = Array.from(document.querySelectorAll('a'))
            .map(a => a.textContent.trim())
            .filter(text => {
                if (!text) return false;
                const exclude = ['Aztecs:', 'Spaniards:', 'Tlaxcalans:', 'Saves', 'Restart', 'Settings'];
                return !exclude.some(ex => text.includes(ex));
            });

        return links;
    });
}

async function getGameButtons(page) {
    return await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
            .map(b => b.textContent.trim())
            .filter(text => {
                if (!text) return false;
                const exclude = ['Save', 'Delete', 'Load from Disk', 'Save to Disk', 'Delete All'];
                return !exclude.some(ex => text.includes(ex));
            });

        return buttons;
    });
}

async function clickFirstAction(page, char) {
    const links = await getGameLinks(page);
    if (links.length > 0) {
        const linkText = links[0];
        await page.evaluate((text) => {
            const allLinks = Array.from(document.querySelectorAll('a'));
            const link = allLinks.find(a => a.textContent.trim() === text);
            if (link) link.click();
        }, linkText);
        console.log(`${char.name}: Clicked link "${linkText}"`);
        return true;
    }

    const buttons = await getGameButtons(page);
    if (buttons.length > 0) {
        const buttonText = buttons[0];
        await page.evaluate((text) => {
            const allButtons = Array.from(document.querySelectorAll('button'));
            const button = allButtons.find(b => b.textContent.trim() === text);
            if (button) button.click();
        }, buttonText);
        console.log(`${char.name}: Clicked button "${buttonText}"`);
        return true;
    }

    return false;
}

async function main() {
    console.log('=== Visual Puppeteer Test ===\n');
    console.log('Opening browser windows for all 8 characters...\n');

    const browser = await puppeteer.launch({
        headless: false,  // VISIBLE WINDOWS
        args: ['--window-size=600,800', '--window-position=0,0']
    });

    try {
        const pages = [];

        // Open all character pages
        for (let i = 0; i < CHARACTERS.length; i++) {
            const char = CHARACTERS[i];
            const page = await browser.newPage();
            await page.setViewport({ width: 580, height: 780 });
            const url = `${BASE_URL}/?nick=${char.name}&id=${char.id}`;
            await page.goto(url);
            pages.push(page);
            console.log(`Opened: ${char.name}`);
            await wait(500); // Stagger window opening
        }

        console.log('\n=== Setting up all characters ===\n');

        // Setup all characters
        for (let i = 0; i < pages.length; i++) {
            await setupCharacter(pages[i], CHARACTERS[i]);
            await wait(1000);
        }

        console.log('\n=== Waiting for game to start ===\n');
        await wait(10000);

        console.log('=== Beginning playthrough ===\n');
        console.log('Watch the browser windows for state synchronization...\n');

        // Play through 20 steps slowly
        for (let step = 1; step <= 20; step++) {
            console.log(`\n--- Step ${step} ---`);

            let anyAction = false;

            for (let i = 0; i < pages.length; i++) {
                const acted = await clickFirstAction(pages[i], CHARACTERS[i]);
                if (acted) anyAction = true;
            }

            if (!anyAction) {
                console.log('\nNo more actions available.');
                break;
            }

            // Slow down to allow observation
            console.log('Waiting 5 seconds before next step...');
            await wait(5000);
        }

        console.log('\n=== Test complete! ===');
        console.log('Browser windows will stay open for 60 seconds for inspection.');
        console.log('Check each window for:');
        console.log('  - Are stats displaying correctly?');
        console.log('  - Is state synchronized across characters?');
        console.log('  - Any visual bugs or corruption?');

        await wait(60000);

    } finally {
        await browser.close();
        console.log('\nBrowser closed.');
    }
}

main().catch(console.error);
