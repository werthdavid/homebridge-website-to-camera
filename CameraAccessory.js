"use strict";
const packageJSON = require("./package.json");
const CameraSource = require("./CameraSource");

module.exports = (hap, Accessory, log) => class CameraAccessory extends Accessory {
    constructor(conf) {
        conf = conf || {};
        var name = conf.name || "Website to Camera";
        var id = conf.id || name;
        var uuid = hap.uuid.generate("homebridge-website-to-camera:" + id);
        super(name, uuid, hap.Accessory.Categories.CAMERA);
        this.getService(hap.Service.AccessoryInformation)
            .setCharacteristic(hap.Characteristic.Manufacturer, "David")
            .setCharacteristic(hap.Characteristic.Model, "Website")
            .setCharacteristic(hap.Characteristic.SerialNumber, "42")
            .setCharacteristic(hap.Characteristic.FirmwareRevision, packageJSON.version);
        this.on("identify", function (paired, callback) {
            log("identify");
            callback();
        });
        var cameraSource = new CameraSource(hap, conf, log);
        this.configureCameraSource(cameraSource);
    }
};
