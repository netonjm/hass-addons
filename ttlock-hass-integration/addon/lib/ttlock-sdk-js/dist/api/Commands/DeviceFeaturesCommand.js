'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceFeaturesCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const FeatureValue_1 = require("../../constant/FeatureValue");
const digitUtil_1 = require("../../util/digitUtil");
const Command_1 = require("../Command");
class DeviceFeaturesCommand extends Command_1.Command {
    processData() {
        if (this.commandData) {
            this.batteryCapacity = this.commandData.readInt8(0);
            this.special = this.commandData.readInt32BE(1);
            console.log(this.commandData);
            const features = this.commandData.readUInt32BE(1);
            this.featureList = this.processFeatures(features);
        }
    }
    readFeatures(data) {
        if (data) {
            let features = "";
            let temp = "";
            for (let i = 0; i < data.length; i++) {
                temp += (0, digitUtil_1.padHexString)(data.readInt8(i).toString(16));
                if (i % 4 == 3) {
                    features = temp + features;
                    temp = "";
                }
            }
            let i = 0;
            while (i < features.length && features.charAt(i) == "0") {
                i++;
            }
            if (i == features.length) {
                return "0";
            }
            return features.substring(i).toUpperCase();
        }
        else {
            return "";
        }
    }
    processFeatures(features) {
        let featureList = new Set();
        const featuresBinary = features.toString(2);
        Object.values(FeatureValue_1.FeatureValue).forEach((feature) => {
            if (typeof feature != "string" && featuresBinary.length > feature) {
                if (featuresBinary.charAt(featuresBinary.length - feature - 1) == "1") {
                    featureList.add(feature);
                }
            }
        });
        return featureList;
    }
    getBatteryCapacity() {
        if (this.batteryCapacity) {
            return this.batteryCapacity;
        }
        else {
            return -1;
        }
    }
    getSpecial() {
        if (this.special) {
            return this.special;
        }
        else {
            return 0;
        }
    }
    getFeaturesList() {
        if (this.featureList) {
            return this.featureList;
        }
        else {
            return new Set();
        }
    }
    build() {
        return Buffer.from([]);
    }
}
exports.DeviceFeaturesCommand = DeviceFeaturesCommand;
DeviceFeaturesCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_SEARCHE_DEVICE_FEATURE;
