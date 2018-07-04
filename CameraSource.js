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
    this.screenshotHelper = new ScreenshotHelper(log, conf.url, conf.width, conf.height, conf.chromiumPath)

    this.pendingSessions = {};
    this.ongoingSessions = {};

    let options = {
        proxy: false, // Requires RTP/RTCP MUX Proxy
        disable_audio_proxy: false, // If proxy = true, you can opt out audio proxy via this
        srtp: true, // Supports SRTP AES_CM_128_HMAC_SHA1_80 encryption
        video: {
            resolutions: [
                [1920, 1080, 30], // Width, Height, framerate
                [320, 240, 15], // Apple Watch requires this configuration
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
                profiles: [0, 1, 2], // Enum, please refer StreamController.VideoCodecParamProfileIDTypes
                levels: [0, 1, 2] // Enum, please refer StreamController.VideoCodecParamLevelTypes
            }
        },
        audio: {
            comfort_noise: false,
            codecs: [
                {
                    type: "OPUS", // Audio Codec
                    samplerate: 24 // 8, 16, 24 KHz
                },
                {
                    type: "AAC-eld",
                    samplerate: 16
                }
            ]
        }
    };
    this.createCameraControlService();
    this._createStreamControllers(2, options)
}

Camera.prototype.handleSnapshotRequest = function (request, callback) {
    this.screenshotHelper.getScreenshot()
        .then(
            img => {
                callback(null, img);
            },
            reason => {
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
    this.pendingSessions[this.hap.uuid.unparse(sessionID)] = sessionInfo;

    callback(response);
};

Camera.prototype.handleStreamRequest = function (request) {
    let sessionID = request.sessionID;
    let requestType = request.type;
    if (!sessionID) {
        return;
    }
    let sessionIdentifier = this.hap.uuid.unparse(sessionID);

    if (requestType === "start" && this.pendingSessions[sessionIdentifier]) {

        // TODO Implement "live" update mechanism
        this.ongoingSessions[sessionIdentifier] = undefined

        delete this.pendingSessions[sessionIdentifier];
    }
    if (requestType === "stop" && this.ongoingSessions[sessionIdentifier]) {
        delete this.ongoingSessions[sessionIdentifier];
    }
};

Camera.prototype.createCameraControlService = function () {
    let controlService = new this.hap.Service.CameraControl();
    this.services.push(controlService);
};

Camera.prototype._createStreamControllers = function (maxStreams, options) {
    let self = this;
    for (let i = 0; i < maxStreams; i += 1) {
        let streamController = new this.hap.StreamController(i, options, self);
        self.services.push(streamController.service);
        self.streamControllers.push(streamController);
    }
};
