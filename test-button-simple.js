import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => console.log('[BROWSER]', msg.text()));

    await page.goto('http://localhost:53134/?nick=testuser&id=test123');

    console.log('Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if we're on the start page
    const pageTitle = await page.evaluate(() => {
        return document.querySelector('.passage')?.textContent || 'No passage found';
    });

    console.log('Current passage contains:', pageTitle.substring(0, 100));

    // Navigate to Shared Counter Demo
    console.log('\nNavigating to counter demo...');
    await page.click('a[data-passage="Shared Counter Demo"]');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get all the raw HTML
    const html = await page.evaluate(() => {
        return document.querySelector('.passage')?.innerHTML || 'No passage';
    });

    console.log('\n=== RAW HTML ===');
    console.log(html.substring(0, 1000));

    // Check what buttons exist
    const buttons = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.map(btn => ({
            text: btn.textContent,
            innerHTML: btn.innerHTML,
            hasClick: btn.onclick !== null
        }));
    });

    console.log('\n=== BUTTONS ===');
    console.log(JSON.stringify(buttons, null, 2));

    console.log('\nPress Ctrl+C to close');
})();
