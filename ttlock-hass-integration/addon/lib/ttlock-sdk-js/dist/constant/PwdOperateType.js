'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PwdOperateType = void 0;
var PwdOperateType;
(function (PwdOperateType) {
    /**
     * Clear keyboard password
     */
    PwdOperateType[PwdOperateType["PWD_OPERATE_TYPE_CLEAR"] = 1] = "PWD_OPERATE_TYPE_CLEAR";
    /**
     * Add keyboard password
     */
    PwdOperateType[PwdOperateType["PWD_OPERATE_TYPE_ADD"] = 2] = "PWD_OPERATE_TYPE_ADD";
    /**
     * Delete a single keyboard password
     */
    PwdOperateType[PwdOperateType["PWD_OPERATE_TYPE_REMOVE_ONE"] = 3] = "PWD_OPERATE_TYPE_REMOVE_ONE";
    /**
     * Change the keyboard password (the old one is 4, no longer used)
     */
    PwdOperateType[PwdOperateType["PWD_OPERATE_TYPE_MODIFY"] = 5] = "PWD_OPERATE_TYPE_MODIFY";
    /**
     * Recovery password
     */
    PwdOperateType[PwdOperateType["PWD_OPERATE_TYPE_RECOVERY"] = 6] = "PWD_OPERATE_TYPE_RECOVERY";
})(PwdOperateType = exports.PwdOperateType || (exports.PwdOperateType = {}));
