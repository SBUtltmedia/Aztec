import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Capture console messages
    page.on('console', msg => {
        console.log('[BROWSER]', msg.text());
    });

    await page.goto('http://localhost:53134/?id=alice');
    await page.waitForFunction(() => window.SugarCube && window.SugarCube.Engine, {timeout: 10000});

    console.log('[TEST] Navigating to counter demo...');
    await page.evaluate(() => {
        window.SugarCube.Engine.play('Shared Counter Demo');
    });

    await new Promise(r => setTimeout(r, 1000));

    console.log('[TEST] Counter before:', await page.evaluate(() => window.SugarCube.State.variables.sharedCounter));

    console.log('[TEST] Clicking increment button...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent.includes('Increment (+1)'));
        if (btn) {
            console.log('[CLICK] About to click button');
            btn.click();
        } else {
            console.log('[CLICK] Button not found!');
        }
    });

    await new Promise(r => setTimeout(r, 2000));

    console.log('[TEST] Counter after:', await page.evaluate(() => window.SugarCube.State.variables.sharedCounter));

    console.log('\nPress Ctrl+C to exit...');
    await new Promise(r => setTimeout(r, 30000));

    await browser.close();
})();
