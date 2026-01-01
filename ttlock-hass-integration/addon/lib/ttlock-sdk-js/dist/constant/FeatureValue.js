'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureValue = void 0;
var FeatureValue;
(function (FeatureValue) {
    /**
     * Password
     */
    FeatureValue[FeatureValue["PASSCODE"] = 0] = "PASSCODE";
    /**
     * CARD
     */
    FeatureValue[FeatureValue["IC"] = 1] = "IC";
    /**
     * Fingerprint
     */
    FeatureValue[FeatureValue["FINGER_PRINT"] = 2] = "FINGER_PRINT";
    /**
     * wristband
     */
    FeatureValue[FeatureValue["WRIST_BAND"] = 3] = "WRIST_BAND";
    /**
     * Automatic locking function
     */
    FeatureValue[FeatureValue["AUTO_LOCK"] = 4] = "AUTO_LOCK";
    /**
     * Password with delete function
     */
    FeatureValue[FeatureValue["PASSCODE_WITH_DELETE_FUNCTION"] = 5] = "PASSCODE_WITH_DELETE_FUNCTION";
    /**
     * Support firmware upgrade setting instructions
     */
    FeatureValue[FeatureValue["FIRMWARE_SETTTING"] = 6] = "FIRMWARE_SETTTING";
    /**
     * Modify password (custom) function
     */
    FeatureValue[FeatureValue["MODIFY_PASSCODE_FUNCTION"] = 7] = "MODIFY_PASSCODE_FUNCTION";
    /**
     * Blocking instruction
     */
    FeatureValue[FeatureValue["MANUAL_LOCK"] = 8] = "MANUAL_LOCK";
    /**
     * Support password display or hide
     */
    FeatureValue[FeatureValue["PASSWORD_DISPLAY_OR_HIDE"] = 9] = "PASSWORD_DISPLAY_OR_HIDE";
    /**
     * Support gateway unlock command
     */
    FeatureValue[FeatureValue["GATEWAY_UNLOCK"] = 10] = "GATEWAY_UNLOCK";
    /**
     * Support gateway freeze and unfreeze instructions
     */
    FeatureValue[FeatureValue["FREEZE_LOCK"] = 11] = "FREEZE_LOCK";
    /**
     * Support cycle password
     */
    FeatureValue[FeatureValue["CYCLIC_PASSWORD"] = 12] = "CYCLIC_PASSWORD";
    /**
     * Support door sensor
     */
    FeatureValue[FeatureValue["MAGNETOMETER"] = 13] = "MAGNETOMETER";
    /**
    * Support remote unlocking configuration
    */
    FeatureValue[FeatureValue["CONFIG_GATEWAY_UNLOCK"] = 14] = "CONFIG_GATEWAY_UNLOCK";
    /**
     * Audio management
     */
    FeatureValue[FeatureValue["AUDIO_MANAGEMENT"] = 15] = "AUDIO_MANAGEMENT";
    /**
     * Support NB
     */
    FeatureValue[FeatureValue["NB_LOCK"] = 16] = "NB_LOCK";
    // /**
    // * Support hotel lock card system
    // */
    // @Deprecated
    // HOTEL_LOCK = 0x20000,
    /**
     * Support reading the administrator password
     */
    FeatureValue[FeatureValue["GET_ADMIN_CODE"] = 18] = "GET_ADMIN_CODE";
    /**
     * Support hotel lock card system
     */
    FeatureValue[FeatureValue["HOTEL_LOCK"] = 19] = "HOTEL_LOCK";
    /**
     * Lock without clock chip
     */
    FeatureValue[FeatureValue["LOCK_NO_CLOCK_CHIP"] = 20] = "LOCK_NO_CLOCK_CHIP";
    /**
     * Bluetooth does not broadcast, and it cannot be realized by clicking on the app to unlock
     */
    FeatureValue[FeatureValue["CAN_NOT_CLICK_UNLOCK"] = 21] = "CAN_NOT_CLICK_UNLOCK";
    /**
     * Support the normal open mode from a few hours to a few hours on a certain day
     */
    FeatureValue[FeatureValue["PASSAGE_MODE"] = 22] = "PASSAGE_MODE";
    /**
     * In the case of supporting the normally open mode and setting the automatic lock, whether to support the closing of the automatic lock
     */
    FeatureValue[FeatureValue["PASSAGE_MODE_AND_AUTO_LOCK_AND_CAN_CLOSE"] = 23] = "PASSAGE_MODE_AND_AUTO_LOCK_AND_CAN_CLOSE";
    FeatureValue[FeatureValue["WIRELESS_KEYBOARD"] = 24] = "WIRELESS_KEYBOARD";
    /**
     * flashlight
     */
    FeatureValue[FeatureValue["LAMP"] = 25] = "LAMP";
    /**
     * Anti-tamper switch configuration
     */
    FeatureValue[FeatureValue["TAMPER_ALERT"] = 28] = "TAMPER_ALERT";
    /**
     * Reset key configuration
     */
    FeatureValue[FeatureValue["RESET_BUTTON"] = 29] = "RESET_BUTTON";
    /**
     * Anti-lock
     */
    FeatureValue[FeatureValue["PRIVACK_LOCK"] = 30] = "PRIVACK_LOCK";
    /**
     * Deadlock (the original 31 is not used)
     */
    FeatureValue[FeatureValue["DEAD_LOCK"] = 32] = "DEAD_LOCK";
    /**
     * Support normally open mode exception
     */
    // PASSAGE_MODE_ = 33,
    FeatureValue[FeatureValue["CYCLIC_IC_OR_FINGER_PRINT"] = 34] = "CYCLIC_IC_OR_FINGER_PRINT";
    /**
     * Support left and right door opening settings
     */
    FeatureValue[FeatureValue["UNLOCK_DIRECTION"] = 36] = "UNLOCK_DIRECTION";
    /**
     * Finger vein
     */
    FeatureValue[FeatureValue["FINGER_VEIN"] = 37] = "FINGER_VEIN";
    /**
     * Telink Bluetooth chip
     */
    FeatureValue[FeatureValue["TELINK_CHIP"] = 38] = "TELINK_CHIP";
    /**
     * Support NB activation configuration
     */
    FeatureValue[FeatureValue["NB_ACTIVITE_CONFIGURATION"] = 39] = "NB_ACTIVITE_CONFIGURATION";
    /**
    * Support cyclic password recovery function
    */
    FeatureValue[FeatureValue["CYCLIC_PASSCODE_CAN_RECOVERY"] = 40] = "CYCLIC_PASSCODE_CAN_RECOVERY";
    /**
     * Support wireless key
     */
    FeatureValue[FeatureValue["WIRELESS_KEY_FOB"] = 41] = "WIRELESS_KEY_FOB";
    /**
     * Support reading accessory battery information
     */
    FeatureValue[FeatureValue["ACCESSORY_BATTERY"] = 42] = "ACCESSORY_BATTERY";
})(FeatureValue = exports.FeatureValue || (exports.FeatureValue = {}));
