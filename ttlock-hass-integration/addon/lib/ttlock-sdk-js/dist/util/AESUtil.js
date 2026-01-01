'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AESUtil = exports.defaultAESKey = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Default encryption key used when the lock is not paired yet
 */
exports.defaultAESKey = Buffer.from([
    0x98, 0x76, 0x23, 0xE8,
    0xA9, 0x23, 0xA1, 0xBB,
    0x3D, 0x9E, 0x7D, 0x03,
    0x78, 0x12, 0x45, 0x88
]);
class AESUtil {
    static aesEncrypt(source, key) {
        if (source.length == 0) {
            return Buffer.from([]);
        }
        if (typeof key == "undefined") {
            key = exports.defaultAESKey;
        }
        if (key.length != 16) {
            throw new Error("Invalid key size: " + key.length);
        }
        const cipher = crypto_1.default.createCipheriv('aes-128-cbc', key, key);
        let encrypted = cipher.update(source);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted;
    }
    static aesDecrypt(source, key) {
        if (source.length == 0) {
            return Buffer.from([]);
        }
        if (typeof key == "undefined") {
            key = exports.defaultAESKey;
        }
        if (key.length != 16) {
            throw new Error("Invalid key size: " + key.length);
        }
        const cipher = crypto_1.default.createDecipheriv('aes-128-cbc', key, key);
        try {
            let decrypted = cipher.update(source);
            decrypted = Buffer.concat([decrypted, cipher.final()]);
            return decrypted;
        }
        catch (error) {
            console.error(error);
            throw new Error("Decryption failed");
        }
    }
}
exports.AESUtil = AESUtil;
