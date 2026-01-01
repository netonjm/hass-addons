'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ICOperate = void 0;
var ICOperate;
(function (ICOperate) {
    ICOperate[ICOperate["IC_SEARCH"] = 1] = "IC_SEARCH";
    ICOperate[ICOperate["FR_SEARCH"] = 6] = "FR_SEARCH";
    ICOperate[ICOperate["ADD"] = 2] = "ADD";
    ICOperate[ICOperate["DELETE"] = 3] = "DELETE";
    ICOperate[ICOperate["CLEAR"] = 4] = "CLEAR";
    ICOperate[ICOperate["MODIFY"] = 5] = "MODIFY";
    /**
     * Fingerprint template data package
     */
    ICOperate[ICOperate["WRITE_FR"] = 7] = "WRITE_FR";
    ICOperate[ICOperate["STATUS_ADD_SUCCESS"] = 1] = "STATUS_ADD_SUCCESS";
    ICOperate[ICOperate["STATUS_ENTER_ADD_MODE"] = 2] = "STATUS_ENTER_ADD_MODE";
    ICOperate[ICOperate["STATUS_FR_PROGRESS"] = 3] = "STATUS_FR_PROGRESS";
    ICOperate[ICOperate["STATUS_FR_RECEIVE_TEMPLATE"] = 4] = "STATUS_FR_RECEIVE_TEMPLATE";
})(ICOperate = exports.ICOperate || (exports.ICOperate = {}));
