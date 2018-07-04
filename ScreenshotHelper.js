const puppeteer = require('puppeteer');

module.exports = ScreenshotHelper;

function ScreenshotHelper(log, url, width = 640, height = 360, chromiumPath = "/usr/bin/chromium-browser") {
    this.log = log;
    this.width = width;
    this.height = height;
    this.url = url;
    this.chromiumPath = chromiumPath;
    this.log("Initialized ScreenshotHelper");
}

ScreenshotHelper.prototype.getScreenshot = async function () {
    if (!this.browser) {
        this.log("Starting new instance of Chromium: " + this.chromiumPath);
        this.browser = await puppeteer.launch({executablePath: this.chromiumPath});
        this.log("Chromium started");
    }
    const page = await this.browser.newPage();
    await page.setViewport({width: 640, height: 360});
    this.log("Going to page: " + this.url);
    await page.goto(this.url, {waitUntil: 'networkidle0', timeout: 6000});
    await page.setViewport({width: this.width, height: this.height});
    const screenshot = await page.screenshot({type: "jpeg"});
    page.close();
    return screenshot;
};