'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateTimeToBuffer = void 0;
function dateTimeToBuffer(dateTime) {
    const result = Buffer.alloc(dateTime.length / 2);
    for (let i = 0; i < result.length; i++) {
        result[i] = parseInt(dateTime.substring(i * 2, i * 2 + 2));
    }
    return result;
}
exports.dateTimeToBuffer = dateTimeToBuffer;
