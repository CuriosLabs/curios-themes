import puppeteer from 'puppeteer-core';

const BROWSER_URL = 'http://localhost:9222';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage: brave-tool <command> [args]');
    console.log('Commands: open-url, list-tabs, switch-tab, close-tab, navigate, reload, back, forward, click, click-text, hover, fill, clear, press-key, scroll, extract, get-html, screenshot, accessibility-snapshot, eval');
    process.exit(1);
  }

  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: BROWSER_URL,
      defaultViewport: null,
    });

    const pages = await browser.pages();
    let page: puppeteer.Page;

    // Optional: Get tab index from environment
    let tabIndex = 0;
    if (process.env.BROWSER_TAB_INDEX) {
      tabIndex = parseInt(process.env.BROWSER_TAB_INDEX);
    }
    page = pages[tabIndex] || pages[0];

    switch (command) {
      case 'list-tabs':
        const tabList = await Promise.all(pages.map(async (p, i) => ({
          index: i,
          title: await p.title(),
          url: p.url()
        })));
        console.log(JSON.stringify(tabList, null, 2));
        break;

      case 'open-url':
        const url = args[1];
        if (!url) throw new Error('URL is required');
        page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        console.log(`Navigated to ${url} in a new tab`);
        break;

      case 'navigate':
        const navUrl = args[1];
        if (!navUrl) throw new Error('URL is required');
        await page.goto(navUrl, { waitUntil: 'networkidle2' });
        console.log(`Navigated to ${navUrl} in tab ${tabIndex}`);
        break;

      case 'reload':
        await page.reload({ waitUntil: 'networkidle2' });
        console.log(`Reloaded tab ${tabIndex}`);
        break;

      case 'back':
        await page.goBack({ waitUntil: 'networkidle2' });
        console.log(`Went back in tab ${tabIndex}`);
        break;

      case 'forward':
        await page.goForward({ waitUntil: 'networkidle2' });
        console.log(`Went forward in tab ${tabIndex}`);
        break;

      case 'close-tab':
        await page.close();
        console.log(`Closed tab ${tabIndex}`);
        break;

      case 'switch-tab':
        const targetIndex = parseInt(args[1]);
        if (isNaN(targetIndex) || !pages[targetIndex]) throw new Error('Valid tab index is required');
        await pages[targetIndex].bringToFront();
        console.log(`Switched to tab ${targetIndex}: ${await pages[targetIndex].title()}`);
        break;

      case 'click':
        const selector = args[1];
        if (!selector) throw new Error('Selector is required');
        await page.bringToFront();
        await page.waitForSelector(selector);
        await page.click(selector);
        console.log(`Clicked on ${selector} in tab ${tabIndex}`);
        break;

      case 'click-text':
        const textToClick = args[1];
        if (!textToClick) throw new Error('Text is required');
        await page.bringToFront();
        const element = await page.evaluateHandle((text) => {
          const elements = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"]'));
          return elements.find(el => el.textContent?.toLowerCase().includes(text.toLowerCase()) || (el as any).value?.toLowerCase().includes(text.toLowerCase()));
        }, textToClick);
        if (element.asElement()) {
          await element.asElement()?.click();
          console.log(`Clicked on element containing "${textToClick}" in tab ${tabIndex}`);
        } else {
          throw new Error(`Element with text "${textToClick}" not found`);
        }
        break;

      case 'hover':
        const hoverSelector = args[1];
        if (!hoverSelector) throw new Error('Selector is required');
        await page.bringToFront();
        await page.waitForSelector(hoverSelector);
        await page.hover(hoverSelector);
        console.log(`Hovered over ${hoverSelector} in tab ${tabIndex}`);
        break;

      case 'fill':
        const fillSelector = args[1];
        const value = args[2];
        if (!fillSelector || value === undefined) throw new Error('Selector and value are required');
        await page.bringToFront();
        await page.waitForSelector(fillSelector);
        await page.type(fillSelector, value);
        console.log(`Filled ${fillSelector} with "${value}" in tab ${tabIndex}`);
        break;

      case 'clear':
        const clearSelector = args[1];
        if (!clearSelector) throw new Error('Selector is required');
        await page.bringToFront();
        await page.waitForSelector(clearSelector);
        await page.click(clearSelector, { clickCount: 3 });
        await page.keyboard.press('Backspace');
        console.log(`Cleared ${clearSelector} in tab ${tabIndex}`);
        break;

      case 'press-key':
        const key = args[1];
        if (!key) throw new Error('Key is required');
        await page.bringToFront();
        await page.keyboard.press(key as puppeteer.KeyInput);
        console.log(`Pressed key "${key}" in tab ${tabIndex}`);
        break;

      case 'scroll':
        const scrollAmount = parseInt(args[1] || '500');
        await page.bringToFront();
        await page.evaluate((amount) => window.scrollBy(0, amount), scrollAmount);
        console.log(`Scrolled by ${scrollAmount} pixels in tab ${tabIndex}`);
        break;

      case 'extract':
        const extractSelector = args[1];
        if (!extractSelector) throw new Error('Selector is required');
        await page.waitForSelector(extractSelector);
        const text = await page.$eval(extractSelector, el => (el as HTMLElement).innerText);
        console.log(text);
        break;

      case 'get-html':
        const htmlSelector = args[1];
        let html: string;
        if (htmlSelector) {
          await page.waitForSelector(htmlSelector);
          html = await page.$eval(htmlSelector, el => el.outerHTML);
        } else {
          html = await page.content();
        }
        console.log(html);
        break;

      case 'screenshot':
        const filename = args[1] || 'screenshot.png';
        await page.bringToFront();
        await page.screenshot({ path: filename });
        console.log(`Screenshot saved to ${filename} from tab ${tabIndex}`);
        break;

      case 'accessibility-snapshot':
        const snapshot = await page.accessibility.snapshot();
        console.log(JSON.stringify(snapshot, null, 2));
        break;

      case 'eval':
        const script = args[1];
        if (!script) throw new Error('Script is required');
        const result = await page.evaluate(script);
        console.log(JSON.stringify(result, null, 2));
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.disconnect();
    }
  }
}

main();
