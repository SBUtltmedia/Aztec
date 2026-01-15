import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    page.on('console', msg => console.log('[BROWSER]', msg.text()));

    await page.goto('http://localhost:53134/?nick=testuser&id=test123');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // First initialize the user
    console.log('\n=== Clicking Start Demo ===');
    await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start Demo'));
        if (button) {
            console.log('Found Start Demo button, clicking...');
            button.click();
        } else {
            console.log('Start Demo button not found');
        }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n=== Clicking Shared Counter Demo link ===');
    await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Shared Counter'));
        if (link) {
            console.log('Found Shared Counter link, clicking...');
            link.click();
        } else {
            console.log('Shared Counter link not found');
        }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n=== RAW PASSAGE HTML ===');
    const html = await page.evaluate(() => {
        return document.querySelector('.passage')?.innerHTML || 'No passage';
    });
    console.log(html);

    console.log('\n\n=== BUTTON ELEMENTS ===');
    const buttons = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.map(b => ({
            text: b.textContent,
            html: b.outerHTML,
            hasClick: b.onclick !== null
        }));
    });
    console.log(JSON.stringify(buttons, null, 2));

    console.log('\nPress Ctrl+C to exit');
})();
