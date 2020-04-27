"use strict";
const packageJSON = require("./package.json");
const CameraSource = require("./CameraSource");

module.exports = (hap, Accessory, log) => class CameraAccessory extends Accessory {
    constructor(conf) {
        conf = conf || {};
        var name = conf.name || "Website to Camera";
        var id = conf.id || "";
        // Generate id from name
        if (id === "") {
            for (let i = 0; i < name.length; i++) {
                id += name.charCodeAt(i)
            }
        }
        var uuid = hap.uuid.generate("homebridge-website-to-camera:" + id);
        super(name, uuid, hap.Accessory.Categories.CAMERA);
        this.getService(hap.Service.AccessoryInformation)
            .setCharacteristic(hap.Characteristic.Manufacturer, "David")
            .setCharacteristic(hap.Characteristic.Model, "Website")
            .setCharacteristic(hap.Characteristic.SerialNumber, id)
            .setCharacteristic(hap.Characteristic.FirmwareRevision, packageJSON.version);
        this.on("identify", function (paired, callback) {
            log("identify");
            callback();
        });
        var cameraSource = new CameraSource(hap, conf, log);
        this.configureCameraSource(cameraSource);
    }
};
