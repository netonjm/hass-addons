'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitPasswordsCommand = void 0;
const moment_1 = __importDefault(require("moment"));
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class InitPasswordsCommand extends Command_1.Command {
    processData() {
        // nothing to do here
    }
    build() {
        let year = this.calculateYear();
        this.pwdInfo = this.generateCodeSecret(year);
        // first data byte is the year
        let buffers = [
            Buffer.from([year % 100]), // last 2 digits of the year
        ];
        for (let i = 0; i < 10; i++) {
            buffers.push(this.combineCodeSecret(this.pwdInfo[i].code, this.pwdInfo[i].secret));
        }
        return Buffer.concat(buffers);
    }
    getPwdInfo() {
        if (this.pwdInfo) {
            return this.pwdInfo;
        }
    }
    generateCodeSecret(year) {
        let generated = [];
        for (let i = 0; i < 10; i++, year++) {
            let secret = "";
            for (let j = 0; j < 10; j++) {
                secret += Math.floor(Math.random() * 10).toString();
            }
            generated.push({
                year: year % 100,
                code: Math.floor(Math.random() * 1071),
                secret: secret
            });
        }
        return generated;
    }
    combineCodeSecret(code, secret) {
        const res = Buffer.alloc(6);
        res[0] = code >> 4;
        res[1] = code << 4 & 0xFF;
        const bigSec = BigInt(secret);
        const sec = Buffer.alloc(8);
        sec.writeBigInt64BE(bigSec);
        sec.copy(res, 2, 4);
        res[1] = res[1] | sec[3];
        return res;
    }
    calculateYear() {
        if ((0, moment_1.default)().format("MMDD") == "0101") { // someone does not like 1st of Jan
            return parseInt((0, moment_1.default)().subtract(1, "years").format("YYYY"));
        }
        else {
            return parseInt((0, moment_1.default)().format("YYYY"));
        }
    }
}
exports.InitPasswordsCommand = InitPasswordsCommand;
InitPasswordsCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_INIT_PASSWORDS;
