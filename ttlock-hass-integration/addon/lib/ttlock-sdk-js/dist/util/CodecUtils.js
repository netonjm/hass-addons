'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodecUtils = void 0;
/** TODO: use Buffers */
const dscrc_table_1 = require("./dscrc_table");
class CodecUtils {
    static encodeWithEncrypt(p0, key) {
        var seed;
        if (key) {
            seed = key;
        }
        else {
            // generate a random number from 1 to 127
            seed = Math.round(Math.random() * 126) + 1;
        }
        var encoded = [];
        const crc = dscrc_table_1.dscrc_table[p0.length & 0xff];
        for (var i = 0; i < p0.length; i++) {
            encoded.push(seed ^ p0.readInt8(i) ^ crc);
        }
        if (!key) {
            encoded.push(seed);
        }
        return Buffer.from(encoded);
    }
    static encode(p0) {
        return CodecUtils.encodeWithEncrypt(p0);
    }
    static decodeWithEncrypt(p0, key) {
        var seed;
        if (key) {
            seed = key;
        }
        else {
            seed = p0.readInt8(p0.length - 1);
        }
        var decoded = [];
        const crc = dscrc_table_1.dscrc_table[p0.length & 0xff];
        for (var i = 0; i < p0.length - (key ? 0 : 1); i++) {
            decoded.push(seed ^ p0[i] ^ crc);
        }
        return Buffer.from(decoded);
    }
    static decode(p0) {
        return CodecUtils.decodeWithEncrypt(p0);
    }
    static crccompute(p0) {
        var crc = 0;
        for (var i = 0; i < p0.length; i++) {
            crc = dscrc_table_1.dscrc_table[crc ^ p0.readUInt8(i)];
        }
        return crc;
    }
}
exports.CodecUtils = CodecUtils;
