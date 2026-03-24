"use strict";

let ip = require("ip");
let crypto = require("crypto");
let ScreenshotHelper = require("./ScreenshotHelper");

module.exports = Camera;

function Camera(hap, conf, log) {
    this.hap = hap;
    this.log = log;
    this.conf = conf;
    this.services = [];
    this.streamControllers = [];
    this.screenshotHelper = new ScreenshotHelper(log, conf.url, conf.chromiumPath, conf.ignoreHTTPSErrors, conf.jsFile);

    this.pendingSessions = {};
    this.ongoingSessions = {};
    this.cachedImage = undefined;
    this.lastSnapshotTime = undefined;

    const videoOptions = {
        resolutions: [
            [1920, 1080, 30],
            [320, 240, 15],
            [1280, 960, 30],
            [1280, 720, 30],
            [1024, 768, 30],
            [640, 480, 30],
            [640, 360, 30],
            [480, 360, 30],
            [480, 270, 30],
            [320, 240, 30],
            [320, 180, 30]
        ],
        codec: {
            profiles: [0, 1, 2],
            levels: [0, 1, 2]
        }
    };

    const audioOptions = {
        comfort_noise: false,
        codecs: [
            {
                type: "OPUS",
                samplerate: 24
            },
            {
                type: "AAC-eld",
                samplerate: 16
            }
        ]
    };

    this.controllerOptions = {
        cameraStreamCount: 2,
        delegate: this,
        streamingOptions: {
            supportedCryptoSuites: [
                this.hap.SRTPCryptoSuites ? this.hap.SRTPCryptoSuites.AES_CM_128_HMAC_SHA1_80 : 0
            ],
            video: videoOptions,
            audio: audioOptions
        }
    };

    this.legacyStreamOptions = {
        proxy: false,
        disable_audio_proxy: false,
        srtp: true,
        video: videoOptions,
        audio: audioOptions
    };

    this.createCameraControlService();
    this._createStreamControllers(2, this.legacyStreamOptions);
}

Camera.prototype.createController = function () {
    const controller = new this.hap.CameraController(this.controllerOptions, true);
    this.controller = controller;
    return controller;
};

Camera.prototype.normalizeSessionIdentifier = function (sessionID) {
    if (typeof sessionID === "string") {
        return sessionID;
    }
    if (Buffer.isBuffer(sessionID) || sessionID instanceof Uint8Array) {
        return this.hap.uuid.unparse(sessionID);
    }

    return String(sessionID);
};

Camera.prototype.handleSnapshotRequest = function (request, callback) {
    let width = this.conf.width || (request.width * (this.conf.scale || 1.5));
    let height = this.conf.height || (request.height * (this.conf.scale || 1.5));
    let networkTimeout = this.conf.timeout || 10000;
    let renderTimeout = this.conf.renderTimeout || 1;

    if (this.conf.cacheTime > 0 & !!this.cachedImage && (new Date().getTime() - this.lastSnapshotTime) < (this.conf.cacheTime * 1000)) {
        this.log("Returning cached image");
        this.log.debug("Cached Time:", this.conf.cacheTime);
        this.log.debug("lastSnapshotTime:", this.lastSnapshotTime);
        callback(null, this.cachedImage);
        return;
    }

    this.screenshotHelper.getScreenshot(width, height, networkTimeout, renderTimeout)
        .then(
            img => {
                this.log("Got screenshot");
                this.lastSnapshotTime = new Date().getTime();
                if (this.conf.cacheTime > 0) {
                    this.cachedImage = img;
                }
                callback(null, img);
            },
            reason => {
                this.log(reason);
                callback(reason);
            })
};

Camera.prototype.handleCloseConnection = function (connectionID) {
    this.streamControllers.forEach(function (controller) {
        controller.handleCloseConnection(connectionID);
    })
};

Camera.prototype.prepareStream = function (request, callback) {
    // Invoked when iOS device requires stream
    let sessionInfo = {};

    let sessionID = request.sessionID;
    sessionInfo.address = request.targetAddress;

    let response = {};

    let videoInfo = request.video;
    if (videoInfo) {
        let targetPort = videoInfo.port;
        let srtpKey = videoInfo.srtp_key;
        let srtpSalt = videoInfo.srtp_salt;

        // SSRC is a 32 bit integer that is unique per stream
        let ssrcSource = crypto.randomBytes(4);
        ssrcSource[0] = 0;
        let ssrc = ssrcSource.readInt32BE(0, true);

        response.video = {
            port: targetPort,
            ssrc: ssrc,
            srtp_key: srtpKey,
            srtp_salt: srtpSalt
        };

        sessionInfo.video_port = targetPort;
        sessionInfo.video_srtp = Buffer.concat([srtpKey, srtpSalt]);
        sessionInfo.video_ssrc = ssrc;
    }

    let audioInfo = request.audio;
    if (audioInfo) {
        let targetPort = audioInfo.port;
        let srtpKey = audioInfo.srtp_key;
        let srtpSalt = audioInfo.srtp_salt;

        // SSRC is a 32 bit integer that is unique per stream
        let ssrcSource = crypto.randomBytes(4);
        ssrcSource[0] = 0;
        let ssrc = ssrcSource.readInt32BE(0, true);

        response.audio = {
            port: targetPort,
            ssrc: ssrc,
            srtp_key: srtpKey,
            srtp_salt: srtpSalt
        };

        sessionInfo.audio_port = targetPort;
        sessionInfo.audio_srtp = Buffer.concat([srtpKey, srtpSalt]);
        sessionInfo.audio_ssrc = ssrc;
    }

    let currentAddress = ip.address();
    let addressResp = {
        address: currentAddress
    };

    if (ip.isV4Format(currentAddress)) {
        addressResp.type = "v4";
    } else {
        addressResp.type = "v6";
    }

    response.address = addressResp;
    this.pendingSessions[this.normalizeSessionIdentifier(sessionID)] = sessionInfo;

    if (callback.length >= 2) {
        callback(undefined, response);
    } else {
        callback(response);
    }
    this.handleSnapshotRequest({
        width: 800,
        height: 600
    }, () => {});
};

Camera.prototype.handleStreamRequest = function (request, callback) {
    let sessionID = request.sessionID;
    let requestType = request.type;
    if (!sessionID) {
        if (callback) {
            callback();
        }
        return;
    }
    let sessionIdentifier = this.normalizeSessionIdentifier(sessionID);

    if (requestType === "start" && this.pendingSessions[sessionIdentifier]) {

        // TODO Implement "live" update mechanism
        this.ongoingSessions[sessionIdentifier] = undefined;

        delete this.pendingSessions[sessionIdentifier];
    }
    if (requestType === "stop" && this.ongoingSessions[sessionIdentifier]) {
        delete this.ongoingSessions[sessionIdentifier];
    }

    if (callback) {
        callback();
    }
};

Camera.prototype.createCameraControlService = function () {
    if (!this.hap.Service || typeof this.hap.Service.CameraControl !== "function") {
        this.log.debug("CameraControl service is not available in this Homebridge/HAP version; skipping legacy control service.");
        return;
    }

    let controlService = new this.hap.Service.CameraControl();
    this.services.push(controlService);
};

Camera.prototype._createStreamControllers = function (maxStreams, options) {
    if (typeof this.hap.StreamController !== "function") {
        this.log.debug("Legacy StreamController is not available in this Homebridge/HAP version; using CameraController instead.");
        return;
    }

    let self = this;
    for (let i = 0; i < maxStreams; i += 1) {
        let streamController = new this.hap.StreamController(i, options, self);
        self.services.push(streamController.service);
        self.streamControllers.push(streamController);
    }
};
