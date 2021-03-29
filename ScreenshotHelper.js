const puppeteer = require('puppeteer-core');
const username = require('username');

module.exports = ScreenshotHelper;

function ScreenshotHelper(log, url, chromiumPath = "/usr/bin/chromium-browser", ignoreHTTPSErrors = false) {
    this.log = log;
    this.url = url;
    this.chromiumPath = chromiumPath;
    this.ignoreHTTPSErrors = ignoreHTTPSErrors;
    this.log("Initialized ScreenshotHelper");
}

ScreenshotHelper.prototype.sleep = function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

ScreenshotHelper.prototype.getScreenshot = async function (width, height, networkTimeout, renderTimeout) {
    if (!this.browser) {
        this.log("Starting new instance of Chromium: " + this.chromiumPath);
        const isRoot = username.sync() === "root";
        this.browser = await puppeteer.launch(
            {
                executablePath: this.chromiumPath,
                headless: true,
                ignoreHTTPSErrors: this.ignoreHTTPSErrors,
                args: isRoot ? ['--no-sandbox'] : []
            }
        );
        this.log("Chromium started");
    }
    this.log("Opening new page");
    const page = await this.browser.newPage();
    this.log("Setting Viewport to " + width + "x" + height);
    await page.setViewport({width: width, height: height});
    this.log("Going to page: " + this.url);
    await page.goto(this.url, {waitUntil: 'networkidle2', timeout: networkTimeout});
    this.log("Loading finished, waiting " + renderTimeout + "ms before taking screenshot");
    await this.sleep(renderTimeout);
    const screenshot = await page.screenshot({type: "jpeg"});
    this.log("Created screenshot");
    page.close();
    return screenshot;
};