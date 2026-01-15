import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Capture ALL console messages
    const consoleMessages = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleMessages.push(text);
        if (text.includes('Error') || text.includes('error') || text.includes('failed')) {
            console.log('[ERROR]', text);
        }
    });

    // Capture page errors
    page.on('pageerror', error => {
        console.log('[PAGE ERROR]', error.message);
    });

    await page.goto('http://localhost:53134/?nick=testuser&id=test123');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== Navigating to counter demo ===');
    await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Shared Counter'));
        if (link) link.click();
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n=== Getting counter value BEFORE click ===');
    const beforeValue = await page.evaluate(() => {
        return window.SugarCube.State.variables.sharedCounter;
    });
    console.log('Counter before:', beforeValue);

    console.log('\n=== Clicking increment button ===');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const incrementBtn = buttons.find(b => b.textContent.includes('Increment'));
        console.log('Found increment button:', !!incrementBtn);
        if (incrementBtn) {
            console.log('Button text:', incrementBtn.textContent);
            console.log('Button onclick:', incrementBtn.onclick);
            incrementBtn.click();
        }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n=== Getting counter value AFTER click ===');
    const afterValue = await page.evaluate(() => {
        return window.SugarCube.State.variables.sharedCounter;
    });
    console.log('Counter after:', afterValue);

    console.log('\n=== Console messages with "th-set" ===');
    consoleMessages.filter(m => m.toLowerCase().includes('th-set')).forEach(m => console.log(m));

    console.log('\n=== All console messages ===');
    consoleMessages.forEach(m => console.log(m));

    console.log('\nPress Ctrl+C to exit');
})();
