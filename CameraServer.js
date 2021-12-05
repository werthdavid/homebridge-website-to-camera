"use strict";

let ScreenshotHelper = require("./ScreenshotHelper");
let http = require("http");
let mjpegServer = require("mjpeg-server");

module.exports = CameraServer;

function CameraServer(hap, conf, log) {
    this.hap = hap;
    this.log = log;
    this.conf = conf;
    this.screenshotHelper = new ScreenshotHelper(log, this.conf.url, this.conf.chromiumPath, this.conf.ignoreHTTPSErrors, this.conf.jsFile);

    let networkTimeout = this.conf.timeout || 10000;
    let renderTimeout = this.conf.renderTimeout || 1;
    this.screenshotHelper.getPage(1920, 1080, networkTimeout, renderTimeout).then(page => {
        this.page = page;
    });

    this.openRequests = [];
    http.createServer((req, res) => {
        if (req.url.endsWith("still")) {
            this.log.debug("Still image request for " + this.conf.url);
            this.screenshotHelper.getScreenshot(1920, 1080, networkTimeout, renderTimeout).then(img => {
                const openRequest = mjpegServer.createReqHandler(req, res);
                openRequest.write(img);
            });
        } else {
            const pos = this.openRequests.length;
            this.log.debug("Image Stream opened for client " + pos + " for " + this.conf.url);
            this.openRequests[pos] = mjpegServer.createReqHandler(req, res);
            res.on("close", ()=>{
                this.log.debug("Image Stream closed for client " + pos + " for " + this.conf.url);
                this.openRequests.splice(pos, 1);
            })
        }

    }).listen(this.conf.livePort || 8554);

    setInterval(() => {
        if (this.openRequests.length > 0 && !!this.page) {
            this.screenshotHelper.makeScreenshot(this.page, false).then(img => {
                for (let i = 0; i < this.openRequests.length; i++) {
                    const openRequest = this.openRequests[i];
                    openRequest.write(img);
                }
            });
        }
    }, (this.conf.liveSnapshotInterval || 1000));

    this.log(this.conf.liveRefreshInterval)
    if (this.conf.liveRefreshInterval > 0) {
        setInterval(() => {
            if (this.openRequests.length > 0 && !!this.page) {
                this.log.debug("Refreshing page");
                let networkTimeout = this.conf.timeout || 10000;
                this.screenshotHelper.refresh(this.page, networkTimeout);
            }
        }, (this.conf.liveRefreshInterval));
    }
}
