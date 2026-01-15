import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    page.on('console', msg => console.log('[BROWSER]', msg.text()));

    await page.goto('http://localhost:53134/?nick=testuser&id=test123');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('=== Navigating via link click ===');
    await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Shared Counter'));
        if (link) link.click();
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const before = await page.evaluate(() => SugarCube.State.variables.sharedCounter);
    console.log('Counter before:', before);

    console.log('=== Triggering button via jQuery event ===');
    await page.evaluate(() => {
        const $button = $('button').filter(function() {
            return $(this).text().includes('Increment');
        }).first();
        console.log('Button found:', $button.length);
        console.log('Button HTML:', $button[0]?.outerHTML);
        // Trigger the click event the way SugarCube expects
        $button.trigger('click');
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const after = await page.evaluate(() => SugarCube.State.variables.sharedCounter);
    console.log('Counter after:', after);

    if (after > before) {
        console.log('\n✓ SUCCESS! Counter incremented');
    } else {
        console.log('\n✗ FAILED - Counter did not increment');
    }

    console.log('\nPress Ctrl+C to exit');
})();
