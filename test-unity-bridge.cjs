const puppeteer = require('puppeteer');

(async () => {
  const PORT = 53134; // Ensure this matches your running server
  const URL = `http://localhost:${PORT}/Twine/UnityDemo.html`;

  console.log(`Launching Puppeteer to test: ${URL}`);

  const browser = await puppeteer.launch({
    headless: true, // Set to false if you want to see the browser
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Capture Console Logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    // Filter out some noise if needed, but for now we want everything
    if (type === 'error') {
        console.error(`[BROWSER ERROR] ${text}`);
    } else if (type === 'warning') {
        console.warn(`[BROWSER WARN] ${text}`);
    } else {
        console.log(`[BROWSER LOG] ${text}`);
    }
  });

  // 2. Capture Uncaught Errors
  page.on('pageerror', err => {
    console.error(`[BROWSER UNCAUGHT] ${err.message}`);
  });

  // 3. Capture Network Failed Requests
  page.on('requestfailed', request => {
    console.error(`[NETWORK FAIL] ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    // 4. Navigate
    await page.goto(URL, { waitUntil: 'networkidle0' });
    console.log("Navigation complete.");

    // 5. Check for Unity Container
    const unityContainer = await page.$('#unity-container');
    if (unityContainer) {
        console.log("FOUND: #unity-container");
    } else {
        console.error("MISSING: #unity-container");
    }

    // 6. Check for Iframe
    // Wait a bit for the script to inject the iframe
    try {
        await page.waitForSelector('#unity-frame', { timeout: 5000 });
        console.log("FOUND: #unity-frame (Unity Iframe injected)");
    } catch (e) {
        console.error("TIMEOUT: #unity-frame not found within 5s");
    }

    // 7. Take Screenshot 1 (Initial State)
    await page.screenshot({ path: 'puppeteer_unity_initial.png' });
    console.log("Screenshot saved: puppeteer_unity_initial.png");

    // 8. Test Navigation (Click "Go to Passage 2")
    console.log("Attempting to click 'Go to Passage 2'...");
    
    // Evaluate in page to find the link containing specific text
    const clicked = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find(el => el.textContent.includes("Go to Passage 2"));
        if (target) {
            target.click();
            return true;
        }
        return false;
    });

    if (clicked) {
        console.log("Clicked navigation link.");
        // Wait for navigation/update
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'puppeteer_unity_navigated.png' });
        console.log("Screenshot saved: puppeteer_unity_navigated.png");
    } else {
        console.error("Could not find navigation link.");
    }

  } catch (error) {
    console.error("Puppeteer Script Error:", error);
  } finally {
    await browser.close();
  }
})();
