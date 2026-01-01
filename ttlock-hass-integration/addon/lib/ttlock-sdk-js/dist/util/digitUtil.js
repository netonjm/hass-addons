'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.padHexString = void 0;
function padHexString(s) {
    if (s.length % 2 != 0) {
        return "0" + s;
    }
    else {
        return s;
    }
}
exports.padHexString = padHexString;
