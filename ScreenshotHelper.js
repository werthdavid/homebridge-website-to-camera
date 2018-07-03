const puppeteer = require('puppeteer');

let browser;

const screenshotHelper = exports;

screenshotHelper.getScreenshot = async function (url, width = 640, height = 360, chromiumPath = "/usr/bin/chromium-browser") {
    if (!browser) {
        browser = await puppeteer.launch({executablePath: chromiumPath})
    }
    const page = await browser.newPage();
    await page.setViewport({width: 640, height: 360});
    await page.goto(url, {waitUntil: 'networkidle0', timeout: 6000});
    await page.setViewport({width: width, height: height});
    const screenshot = await page.screenshot({type: "jpeg"});
    page.close();
    return screenshot;
};
