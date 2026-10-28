const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const assets = path.resolve(__dirname, '../app/src/main/assets');
const themes = ['carbon', 'neon', 'classic', 'minimal', 'tactical'];

async function main() {
  const server = http.createServer(async (req, res) => {
    const name = new URL(req.url, 'http://localhost').pathname;
    const target = path.resolve(assets, '.' + (name === '/' ? '/index.html' : name));
    if (!target.startsWith(assets + path.sep)) {res.writeHead(403).end(); return;}
    try {
      res.setHeader('Content-Type', target.endsWith('.js') ? 'text/javascript' : target.endsWith('.css') ? 'text/css' : 'text/html');
      res.end(await fs.readFile(target));
    } catch {res.writeHead(404).end();}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({headless:true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {})});
    const context = await browser.newContext({viewport:{width:1470,height:1000}});
    await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('dna_skin2', JSON.stringify('carnival'));
      window.gpsCalls = {starts:0,stops:0};
      window.gpsFixture = {fix:true,perm:true,enabled:true,provider:'gps',speed:20,bearing:45,azimuth:45,acc:3,alt:52,satsUsed:12,satsSeen:15,lat:37,lon:127,ts:1000};
      window.AndroidBridge = {
        gpsStatus:() => JSON.stringify(window.gpsFixture),
        startGps:() => window.gpsCalls.starts++,
        stopGps:() => window.gpsCalls.stops++,
        keepScreenOn:() => {}
      };
    });
    await page.goto(origin);
    await page.locator('#gStyle').waitFor();
    assert.equal(await page.locator('#gStyle option').count(), 5);
    assert.equal(await page.locator('#gStyle').inputValue(), 'carbon');
    const top = sel => page.locator(sel).evaluate(el => el.getBoundingClientRect().top);
    assert.ok(await top('#wGps') < await top('#wMain'), 'Speedometer sits above the main player window');
    await page.locator('#gOn').click();
    await page.waitForFunction(() => document.querySelector('#gSpd').textContent === '72');
    await page.evaluate(() => {gpsFixture.ts+=1000;gpsFixture.lat+=.0001;});
    await page.waitForFunction(() => document.querySelector('#gMax').textContent.startsWith('72'));
    const hashes = [];
    for (const key of themes) {
      await page.locator('#gStyle').selectOption(key);
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#wGps').getAttribute('data-gs'), key);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dna_gStyle'))), key);
      assert.equal(await page.locator('#gSpd').textContent(), '72');
      assert.match(await page.locator('#gAcc').textContent(), /12\/15/);
      hashes.push(await page.locator('#gauge').evaluate(canvas => canvas.toDataURL()));
      if (process.env.AMP_SCREENSHOTS) {
        await fs.mkdir(process.env.AMP_SCREENSHOTS, {recursive:true});
        await page.locator('#wGps').screenshot({path:path.join(process.env.AMP_SCREENSHOTS,key+'.png')});
      }
    }
    assert.equal(new Set(hashes).size, 5, 'Each theme must render a distinct live gauge');
    assert.deepEqual(await page.evaluate(() => gpsCalls), {starts:1,stops:0}, 'Changing visual themes must not restart GPS');
    await page.evaluate(() => {gpsFixture.speed=10;gpsFixture.bearing=359;});
    await page.waitForFunction(() => document.querySelector('#gSpd').textContent === '36');
    await page.locator('#gLimit').selectOption('30');
    await page.waitForFunction(() => document.querySelector('#wGps').classList.contains('over'));
    await page.locator('#gHudBtn').click();
    assert.equal(await page.locator('#hud').isVisible(), true);
    await page.waitForFunction(() => document.querySelector('#hSpd').textContent === '36');
    assert.equal(await page.locator('#hSpd').textContent(), '36');
    await page.locator('#hudClose').click();
    for (const [width,height] of [[390,844],[1024,768],[1920,1080]]) {
      await page.setViewportSize({width,height});
      for (const key of themes) {
        await page.locator('#gStyle').selectOption(key);
        await page.waitForTimeout(80);
        assert.equal(await page.locator('#wGps .body').evaluate(el=>el.scrollWidth<=el.clientWidth+2), true, `${key} overflow at ${width}px`);
        assert.ok((await page.locator('#gStyle').boundingBox()).height>=40);
        assert.ok((await page.locator('#gOn').boundingBox()).height>=40);
        if (process.env.AMP_SCREENSHOTS && width===390) await page.locator('#wGps').screenshot({path:path.join(process.env.AMP_SCREENSHOTS,key+'-phone.png')});
      }
    }
    await page.locator('#skin').selectOption('blue');
    assert.equal(await page.locator('#wGps').isVisible(), false);
    assert.deepEqual(await page.evaluate(() => gpsCalls), {starts:1,stops:1});
    await page.locator('#skin').selectOption('carnival');
    assert.equal(await page.locator('#gStyle').inputValue(), 'tactical');
    assert.deepEqual(await page.evaluate(() => gpsCalls), {starts:2,stops:1});
    await page.reload();
    await page.locator('#gStyle').waitFor();
    assert.equal(await page.locator('#gStyle').inputValue(), 'tactical', 'Theme survives app reload');
    await page.evaluate(() => {gpsFixture.fix=false;});
    await page.waitForFunction(() => document.querySelector('#gSpd').textContent === '--');
    await page.evaluate(() => localStorage.setItem('dna_gStyle', JSON.stringify('invalid-theme')));
    await page.reload();
    assert.equal(await page.locator('#gStyle').inputValue(), 'carbon', 'Invalid saved theme has a safe fallback');
    assert.deepEqual(errors, []);
    console.log('PASS: five live themes, GPS continuity, HUD/limit, no-fix state, persistence and 3 responsive sizes');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => {console.error(error);process.exitCode=1;});
