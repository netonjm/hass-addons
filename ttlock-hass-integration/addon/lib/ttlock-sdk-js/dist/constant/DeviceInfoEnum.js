'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceInfoEnum = void 0;
var DeviceInfoEnum;
(function (DeviceInfoEnum) {
    /**
     * Product number
     */
    DeviceInfoEnum[DeviceInfoEnum["MODEL_NUMBER"] = 1] = "MODEL_NUMBER";
    /**
     * Hardware version number
     */
    DeviceInfoEnum[DeviceInfoEnum["HARDWARE_REVISION"] = 2] = "HARDWARE_REVISION";
    /**
     * Firmware version number
     */
    DeviceInfoEnum[DeviceInfoEnum["FIRMWARE_REVISION"] = 3] = "FIRMWARE_REVISION";
    /**
     * Production Date
     */
    DeviceInfoEnum[DeviceInfoEnum["MANUFACTURE_DATE"] = 4] = "MANUFACTURE_DATE";
    /**
     * Bluetooth address
     */
    DeviceInfoEnum[DeviceInfoEnum["MAC_ADDRESS"] = 5] = "MAC_ADDRESS";
    /**
     * Clock
     */
    DeviceInfoEnum[DeviceInfoEnum["LOCK_CLOCK"] = 6] = "LOCK_CLOCK";
    /**
     * Operator information
     */
    DeviceInfoEnum[DeviceInfoEnum["NB_OPERATOR"] = 7] = "NB_OPERATOR";
    /**
     * NB module number (IMEI)
     */
    DeviceInfoEnum[DeviceInfoEnum["NB_IMEI"] = 8] = "NB_IMEI";
    /**
     * NB card information
     */
    DeviceInfoEnum[DeviceInfoEnum["NB_CARD_INFO"] = 9] = "NB_CARD_INFO";
    /**
     * NB signal value
     */
    DeviceInfoEnum[DeviceInfoEnum["NB_RSSI"] = 10] = "NB_RSSI";
})(DeviceInfoEnum = exports.DeviceInfoEnum || (exports.DeviceInfoEnum = {}));
