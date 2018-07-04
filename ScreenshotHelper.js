const puppeteer = require('puppeteer');

module.exports = ScreenshotHelper;

function ScreenshotHelper(log, url, chromiumPath = "/usr/bin/chromium-browser") {
    this.log = log;
    this.url = url;
    this.chromiumPath = chromiumPath;
    this.log("Initialized ScreenshotHelper");
}

ScreenshotHelper.prototype.getScreenshot = async function (width, height) {
    if (!this.browser) {
        this.log("Starting new instance of Chromium: " + this.chromiumPath);
        this.browser = await puppeteer.launch({executablePath: this.chromiumPath});
        this.log("Chromium started");
    }
    this.log("Opening new page");
    const page = await this.browser.newPage();
    this.log("Setting Viewport to " + width + "x" + height);
    await page.setViewport({width: width, height: height});
    this.log("Going to page: " + this.url);
    await page.goto(this.url, {waitUntil: 'networkidle0', timeout: 10000});
    const screenshot = await page.screenshot({type: "jpeg"});
    this.log("Created screenshot");
    page.close();
    return screenshot;
};