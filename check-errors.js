import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const errors = [];
  const logs = [];

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    console.log(`BROWSER [${msg.type()}]:`, text);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('PAGE ERROR:', error.message);
  });

  console.log('Navigating to demo...');
  await page.goto('http://localhost:53134/Twine/EngineDemo.html?id=testuser', { waitUntil: 'networkidle0' });

  console.log('\nWaiting 3 seconds for initialization...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  const vars = await page.evaluate(() => {
    return {
      sharedCounter: window.SugarCube?.State?.variables?.sharedCounter,
      users: window.SugarCube?.State?.variables?.users,
      messageBoard: window.SugarCube?.State?.variables?.messageBoard,
      socketConnected: window.socket?.connected,
      socketExists: !!window.socket,
      passage: window.SugarCube?.State?.passage
    };
  });

  console.log('\n=== VARIABLES ===');
  console.log(JSON.stringify(vars, null, 2));

  console.log('\n=== ERRORS (' + errors.length + ') ===');
  errors.forEach(e => console.log('  -', e));

  console.log('\n=== KEY LOGS ===');
  logs.filter(l => l.includes('Socket') || l.includes('Client') || l.includes('th-set') || l.includes('undefined')).forEach(l => console.log('  ', l));

  console.log('\nKeeping browser open for 10 seconds...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  await browser.close();
})();
