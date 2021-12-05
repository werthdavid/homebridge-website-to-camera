"use strict";
const packageJSON = require("./package.json");
const CameraSource = require("./CameraSource");
const CameraServer = require("./CameraServer");
const {Categories, Service, Characteristic} = require("hap-nodejs");
const ScreenshotHelper = require("./ScreenshotHelper");

module.exports = (hap, Accessory, log) => class CameraAccessory extends Accessory {
    constructor(conf) {
        conf = conf || {};
        var name = conf.name || "Website to Camera";
        var id = conf.id || "";
        // Generate id from name
        if (id === "") {
            for (let i = 0; i < name.length; i++) {
                id += name.charCodeAt(i).toString(10);
            }
        }
        if (id.length > 12) {
            id = id.substr(0, 12);
        }
        var uuid = hap.uuid.generate("homebridge-website-to-camera:" + id);
        if (conf.live === "true") {
            super(name, uuid, Categories.OTHER);
            this.getService(Service.AccessoryInformation)
                .setCharacteristic(Characteristic.Manufacturer, "David")
                .setCharacteristic(Characteristic.Model, "Website")
                .setCharacteristic(Characteristic.SerialNumber, id)
                .setCharacteristic(Characteristic.FirmwareRevision, packageJSON.version);
            this.on("identify", function (paired, callback) {
                log("identify");
                if (!!callback) {
                    callback();
                }
            });
            this.screenshotHelper = new ScreenshotHelper(log, conf.url, conf.chromiumPath, conf.ignoreHTTPSErrors, conf.jsFile);
            new CameraServer(hap, conf, log);
        } else {
            super(name, uuid, Categories.CAMERA);
            this.getService(Service.AccessoryInformation)
                .setCharacteristic(Characteristic.Manufacturer, "David")
                .setCharacteristic(Characteristic.Model, "Website")
                .setCharacteristic(Characteristic.SerialNumber, id)
                .setCharacteristic(Characteristic.FirmwareRevision, packageJSON.version);
            this.on("identify", function (paired, callback) {
                log("identify");
                if (!!callback) {
                    callback();
                }
            });
            const cameraSource = new CameraSource(hap, conf, log);
            this.configureCameraSource(cameraSource);
        }
    }
};
