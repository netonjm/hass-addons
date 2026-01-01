'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogOperate = void 0;
var LogOperate;
(function (LogOperate) {
    //Phone unlock
    /**
     * Bluetooth unlock
     */
    LogOperate[LogOperate["OPERATE_TYPE_MOBILE_UNLOCK"] = 1] = "OPERATE_TYPE_MOBILE_UNLOCK";
    // //Server unlock
    // OPERATE_TYPE_SERVER_UNLOCK = 3,
    //Password unlock
    LogOperate[LogOperate["OPERATE_TYPE_KEYBOARD_PASSWORD_UNLOCK"] = 4] = "OPERATE_TYPE_KEYBOARD_PASSWORD_UNLOCK";
    //Change the password on the keyboard
    LogOperate[LogOperate["OPERATE_TYPE_KEYBOARD_MODIFY_PASSWORD"] = 5] = "OPERATE_TYPE_KEYBOARD_MODIFY_PASSWORD";
    //Delete a single password on the keyboard
    LogOperate[LogOperate["OPERATE_TYPE_KEYBOARD_REMOVE_SINGLE_PASSWORD"] = 6] = "OPERATE_TYPE_KEYBOARD_REMOVE_SINGLE_PASSWORD";
    //Wrong password unlock
    LogOperate[LogOperate["OPERATE_TYPE_ERROR_PASSWORD_UNLOCK"] = 7] = "OPERATE_TYPE_ERROR_PASSWORD_UNLOCK";
    //Delete all passwords on the keyboard
    LogOperate[LogOperate["OPERATE_TYPE_KEYBOARD_REMOVE_ALL_PASSWORDS"] = 8] = "OPERATE_TYPE_KEYBOARD_REMOVE_ALL_PASSWORDS";
    //The password is squeezed out
    LogOperate[LogOperate["OPERATE_TYPE_KEYBOARD_PASSWORD_KICKED"] = 9] = "OPERATE_TYPE_KEYBOARD_PASSWORD_KICKED";
    /**
     * The password with the delete function is unlocked for the first time, and the previous password is cleared
     */
    LogOperate[LogOperate["OPERATE_TYPE_USE_DELETE_CODE"] = 10] = "OPERATE_TYPE_USE_DELETE_CODE";
    /**
     * Password expired
     */
    LogOperate[LogOperate["OPERATE_TYPE_PASSCODE_EXPIRED"] = 11] = "OPERATE_TYPE_PASSCODE_EXPIRED";
    /**
     * The password unlock failed, and the storage capacity is insufficient
     */
    LogOperate[LogOperate["OPERATE_TYPE_SPACE_INSUFFICIENT"] = 12] = "OPERATE_TYPE_SPACE_INSUFFICIENT";
    /**
     * Password unlock failed—the password is in the blacklist
     */
    LogOperate[LogOperate["OPERATE_TYPE_PASSCODE_IN_BLACK_LIST"] = 13] = "OPERATE_TYPE_PASSCODE_IN_BLACK_LIST";
    /**
     * The door lock is powered on again (that is, the battery is reconnected)
     */
    LogOperate[LogOperate["OPERATE_TYPE_DOOR_REBOOT"] = 14] = "OPERATE_TYPE_DOOR_REBOOT";
    /**
     * Add IC card successfully
     */
    LogOperate[LogOperate["OPERATE_TYPE_ADD_IC"] = 15] = "OPERATE_TYPE_ADD_IC";
    /**
     * Successfully emptied the IC card
     */
    LogOperate[LogOperate["OPERATE_TYPE_CLEAR_IC_SUCCEED"] = 16] = "OPERATE_TYPE_CLEAR_IC_SUCCEED";
    /**
     * IC card opened successfully
     */
    LogOperate[LogOperate["OPERATE_TYPE_IC_UNLOCK_SUCCEED"] = 17] = "OPERATE_TYPE_IC_UNLOCK_SUCCEED";
    /**
     * Delete a single IC card successfully
     */
    LogOperate[LogOperate["OPERATE_TYPE_DELETE_IC_SUCCEED"] = 18] = "OPERATE_TYPE_DELETE_IC_SUCCEED";
    /**
     * Bong bracelet opened the door successfully
     */
    LogOperate[LogOperate["OPERATE_TYPE_BONG_UNLOCK_SUCCEED"] = 19] = "OPERATE_TYPE_BONG_UNLOCK_SUCCEED";
    /**
     * Fingerprint opens the door successfully
     */
    LogOperate[LogOperate["OPERATE_TYPE_FR_UNLOCK_SUCCEED"] = 20] = "OPERATE_TYPE_FR_UNLOCK_SUCCEED";
    /**
     * The fingerprint is added successfully
     */
    LogOperate[LogOperate["OPERATE_TYPE_ADD_FR"] = 21] = "OPERATE_TYPE_ADD_FR";
    /**
     * Fingerprint opening failed
     */
    LogOperate[LogOperate["OPERATE_TYPE_FR_UNLOCK_FAILED"] = 22] = "OPERATE_TYPE_FR_UNLOCK_FAILED";
    /**
     * Delete a single fingerprint successfully
     */
    LogOperate[LogOperate["OPERATE_TYPE_DELETE_FR_SUCCEED"] = 23] = "OPERATE_TYPE_DELETE_FR_SUCCEED";
    /**
     * Clear fingerprints successfully
     */
    LogOperate[LogOperate["OPERATE_TYPE_CLEAR_FR_SUCCEED"] = 24] = "OPERATE_TYPE_CLEAR_FR_SUCCEED";
    /**
     * IC card failed to open the door-expired or not valid
     */
    LogOperate[LogOperate["OPERATE_TYPE_IC_UNLOCK_FAILED"] = 25] = "OPERATE_TYPE_IC_UNLOCK_FAILED";
    /**
     * Bluetooth or net closed lock
     */
    LogOperate[LogOperate["OPERATE_BLE_LOCK"] = 26] = "OPERATE_BLE_LOCK";
    /**
     * Mechanical key unlock
     */
    LogOperate[LogOperate["OPERATE_KEY_UNLOCK"] = 27] = "OPERATE_KEY_UNLOCK";
    /**
     * Gateway unlock
     */
    LogOperate[LogOperate["GATEWAY_UNLOCK"] = 28] = "GATEWAY_UNLOCK";
    /**
     * Illegal unlocking (such as pedaling)
     */
    LogOperate[LogOperate["ILLAGEL_UNLOCK"] = 29] = "ILLAGEL_UNLOCK";
    /**
     * Close the door sensor
     */
    LogOperate[LogOperate["DOOR_SENSOR_LOCK"] = 30] = "DOOR_SENSOR_LOCK";
    /**
     * Door sensor open
     */
    LogOperate[LogOperate["DOOR_SENSOR_UNLOCK"] = 31] = "DOOR_SENSOR_UNLOCK";
    /**
     * Outgoing records
     */
    LogOperate[LogOperate["DOOR_GO_OUT"] = 32] = "DOOR_GO_OUT";
    /**
     * Fingerprint lock
     */
    LogOperate[LogOperate["FR_LOCK"] = 33] = "FR_LOCK";
    /**
     * Password lock
     */
    LogOperate[LogOperate["PASSCODE_LOCK"] = 34] = "PASSCODE_LOCK";
    LogOperate[LogOperate["IC_LOCK"] = 35] = "IC_LOCK";
    /**
     * Mechanical key lock
     */
    LogOperate[LogOperate["OPERATE_KEY_LOCK"] = 36] = "OPERATE_KEY_LOCK";
    /**
     * Remote control button
     */
    LogOperate[LogOperate["REMOTE_CONTROL_KEY"] = 37] = "REMOTE_CONTROL_KEY";
    /**
     * Password unlock failed, the door is locked
     */
    LogOperate[LogOperate["PASSCODE_UNLOCK_FAILED_LOCK_REVERSE"] = 38] = "PASSCODE_UNLOCK_FAILED_LOCK_REVERSE";
    /**
     * The IC card fails to unlock and the door is locked
     */
    LogOperate[LogOperate["IC_UNLOCK_FAILED_LOCK_REVERSE"] = 39] = "IC_UNLOCK_FAILED_LOCK_REVERSE";
    /**
     * Fingerprint unlocking fails, the door is locked
     */
    LogOperate[LogOperate["FR_UNLOCK_FAILED_LOCK_REVERSE"] = 40] = "FR_UNLOCK_FAILED_LOCK_REVERSE";
    /**
     * The app fails to unlock and the door is locked
     */
    LogOperate[LogOperate["APP_UNLOCK_FAILED_LOCK_REVERSE"] = 41] = "APP_UNLOCK_FAILED_LOCK_REVERSE";
    //42 ~ 48 no parameters
    /**
     * Wireless key
     */
    LogOperate[LogOperate["WIRELESS_KEY_FOB"] = 55] = "WIRELESS_KEY_FOB";
    /**
     * Wireless keyboard battery
     */
    LogOperate[LogOperate["WIRELESS_KEY_PAD"] = 56] = "WIRELESS_KEY_PAD";
})(LogOperate = exports.LogOperate || (exports.LogOperate = {}));
