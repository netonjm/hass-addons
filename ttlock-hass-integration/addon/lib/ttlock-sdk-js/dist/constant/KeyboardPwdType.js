'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardPwdType = void 0;
var KeyboardPwdType;
(function (KeyboardPwdType) {
    /**
     * Unlimited
     */
    KeyboardPwdType[KeyboardPwdType["PWD_TYPE_PERMANENT"] = 1] = "PWD_TYPE_PERMANENT";
    /**
     * Limited times
     */
    KeyboardPwdType[KeyboardPwdType["PWD_TYPE_COUNT"] = 2] = "PWD_TYPE_COUNT";
    /**
     * Limited time
     */
    KeyboardPwdType[KeyboardPwdType["PWD_TYPE_PERIOD"] = 3] = "PWD_TYPE_PERIOD";
    /**
     * Loop
     */
    KeyboardPwdType[KeyboardPwdType["PWD_TYPE_CIRCLE"] = 4] = "PWD_TYPE_CIRCLE";
})(KeyboardPwdType = exports.KeyboardPwdType || (exports.KeyboardPwdType = {}));
