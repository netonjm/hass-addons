'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogOperateCategory = void 0;
const LogOperate_1 = require("./LogOperate");
exports.LogOperateCategory = {
    LOCK: [
        LogOperate_1.LogOperate.OPERATE_BLE_LOCK,
        LogOperate_1.LogOperate.DOOR_SENSOR_LOCK,
        LogOperate_1.LogOperate.FR_LOCK,
        LogOperate_1.LogOperate.PASSCODE_LOCK,
        LogOperate_1.LogOperate.IC_LOCK,
        LogOperate_1.LogOperate.OPERATE_KEY_LOCK,
    ],
    UNLOCK: [
        LogOperate_1.LogOperate.OPERATE_TYPE_MOBILE_UNLOCK,
        LogOperate_1.LogOperate.OPERATE_TYPE_KEYBOARD_PASSWORD_UNLOCK,
        LogOperate_1.LogOperate.OPERATE_TYPE_IC_UNLOCK_SUCCEED,
        LogOperate_1.LogOperate.OPERATE_TYPE_BONG_UNLOCK_SUCCEED,
        LogOperate_1.LogOperate.OPERATE_TYPE_FR_UNLOCK_SUCCEED,
        LogOperate_1.LogOperate.OPERATE_KEY_UNLOCK,
        LogOperate_1.LogOperate.GATEWAY_UNLOCK,
        LogOperate_1.LogOperate.ILLAGEL_UNLOCK,
        LogOperate_1.LogOperate.DOOR_SENSOR_UNLOCK,
    ],
    FAILED: [
        LogOperate_1.LogOperate.OPERATE_TYPE_FR_UNLOCK_FAILED,
        LogOperate_1.LogOperate.OPERATE_TYPE_IC_UNLOCK_FAILED,
        LogOperate_1.LogOperate.PASSCODE_UNLOCK_FAILED_LOCK_REVERSE,
        LogOperate_1.LogOperate.IC_UNLOCK_FAILED_LOCK_REVERSE,
        LogOperate_1.LogOperate.FR_UNLOCK_FAILED_LOCK_REVERSE,
        LogOperate_1.LogOperate.APP_UNLOCK_FAILED_LOCK_REVERSE
    ],
    IC: [
        LogOperate_1.LogOperate.OPERATE_TYPE_ADD_IC,
        LogOperate_1.LogOperate.OPERATE_TYPE_IC_UNLOCK_SUCCEED,
        LogOperate_1.LogOperate.OPERATE_TYPE_DELETE_IC_SUCCEED,
        LogOperate_1.LogOperate.OPERATE_TYPE_IC_UNLOCK_FAILED
    ],
    FR: [
        LogOperate_1.LogOperate.OPERATE_TYPE_FR_UNLOCK_SUCCEED,
        LogOperate_1.LogOperate.OPERATE_TYPE_ADD_FR,
        LogOperate_1.LogOperate.OPERATE_TYPE_FR_UNLOCK_FAILED,
        LogOperate_1.LogOperate.OPERATE_TYPE_DELETE_FR_SUCCEED,
    ]
};
