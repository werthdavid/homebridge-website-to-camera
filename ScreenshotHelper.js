const puppeteer = require("puppeteer-core");
const username = require("username");
const fs = require("fs");

module.exports = ScreenshotHelper;

function ScreenshotHelper(log, url, chromiumPath = "/usr/bin/chromium-browser", ignoreHTTPSErrors = false, jsFile = undefined) {
    this.log = log;
    this.url = url;
    this.chromiumPath = chromiumPath;
    this.ignoreHTTPSErrors = ignoreHTTPSErrors;
    this.log("Initialized ScreenshotHelper");
    this.jsFile = jsFile;
}

ScreenshotHelper.prototype.sleep = function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

ScreenshotHelper.prototype.getScreenshot = async function (width, height, networkTimeout, renderTimeout) {
    const page = await this.getPage(width, height, networkTimeout, renderTimeout);
    const screenshot = await this.makeScreenshot(page)
    page.close();
    return screenshot;
};

ScreenshotHelper.prototype.getPage = async function (width, height, networkTimeout, renderTimeout) {
    if (!this.browser) {
        this.log("Starting new instance of Chromium: " + this.chromiumPath);
        const isRoot = username.sync() === "root";
        this.browser = await puppeteer.launch(
            {
                executablePath: this.chromiumPath,
                headless: true,
                ignoreHTTPSErrors: this.ignoreHTTPSErrors,
                args: isRoot ? ["--no-sandbox"] : []
            }
        );
        this.log("Chromium started");
    }
    this.log("Opening new page");
    const page = await this.browser.newPage();
    this.log("Setting Viewport to " + width + "x" + height);
    await page.setViewport({width: width, height: height});
    this.log("Going to page: " + this.url);
    await page.goto(this.url, {waitUntil: "networkidle2", timeout: networkTimeout});
    this.log("Loading finished, waiting " + renderTimeout + "ms before taking screenshot");
    await this.sleep(renderTimeout);
    if (!!this.jsFile) {
        await this.addJs(page, this.jsFile);
    }
    return page;
};

ScreenshotHelper.prototype.makeScreenshot = async function (page, doLog = true) {
    const screenshot = await page.screenshot({type: "jpeg"});
    if (doLog) {
        this.log("Created screenshot");
    }
    return screenshot;
};

ScreenshotHelper.prototype.refresh = async function (page, networkTimeout) {
    await page.reload({waitUntil: "networkidle2", timeout: networkTimeout});
};

ScreenshotHelper.prototype.addJs = async function (page, jsFile) {
    const file = fs.readFileSync(jsFile, "utf8");
    await page.addScriptTag({ content: file });
};