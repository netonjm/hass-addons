'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetKeyboardPasswordsCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const KeyboardPwdType_1 = require("../../constant/KeyboardPwdType");
const Command_1 = require("../Command");
class GetKeyboardPasswordsCommand extends Command_1.Command {
    processData() {
        if (this.commandData && this.commandData.length >= 2) {
            const totalLen = this.commandData.readUInt16BE(0);
            this.passCodes = [];
            if (totalLen > 0) {
                this.sequence = this.commandData.readInt16BE(2);
                let index = 4;
                while (index < this.commandData.length) {
                    // const len = this.commandData.readUInt8(index++);
                    index++;
                    let passCode = {
                        type: this.commandData.readUInt8(index++),
                        newPassCode: "",
                        passCode: ""
                    };
                    let codeLen = this.commandData.readUInt8(index++);
                    passCode.newPassCode = this.commandData.subarray(index, index + codeLen).toString();
                    index += codeLen;
                    codeLen = this.commandData.readUInt8(index++);
                    passCode.passCode = this.commandData.subarray(index, index + codeLen).toString();
                    index += codeLen;
                    passCode.startDate = "20" + this.commandData.readUInt8(index++).toString().padStart(2, '0') // year
                        + this.commandData.readUInt8(index++).toString().padStart(2, '0') // month
                        + this.commandData.readUInt8(index++).toString().padStart(2, '0') // day
                        + this.commandData.readUInt8(index++).toString().padStart(2, '0') // hour
                        + this.commandData.readUInt8(index++).toString().padStart(2, '0'); // minutes
                    switch (passCode.type) {
                        case KeyboardPwdType_1.KeyboardPwdType.PWD_TYPE_COUNT:
                        case KeyboardPwdType_1.KeyboardPwdType.PWD_TYPE_PERIOD:
                            passCode.endDate = "20" + this.commandData.readUInt8(index++).toString().padStart(2, '0') // year
                                + this.commandData.readUInt8(index++).toString().padStart(2, '0') // month
                                + this.commandData.readUInt8(index++).toString().padStart(2, '0') // day
                                + this.commandData.readUInt8(index++).toString().padStart(2, '0') // hour
                                + this.commandData.readUInt8(index++).toString().padStart(2, '0'); // minutes
                            break;
                        case KeyboardPwdType_1.KeyboardPwdType.PWD_TYPE_CIRCLE:
                            index++;
                            index++;
                    }
                    this.passCodes.push(passCode);
                }
            }
        }
    }
    build() {
        if (typeof this.sequence != "undefined") {
            const data = Buffer.alloc(2);
            data.writeUInt16BE(this.sequence);
            return data;
        }
        else {
            return Buffer.from([]);
        }
    }
    setSequence(sequence = 0) {
        this.sequence = sequence;
    }
    getSequence() {
        if (this.sequence) {
            return this.sequence;
        }
        else {
            return -1;
        }
    }
    getPasscodes() {
        if (this.passCodes) {
            return this.passCodes;
        }
        return [];
    }
}
exports.GetKeyboardPasswordsCommand = GetKeyboardPasswordsCommand;
GetKeyboardPasswordsCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_PWD_LIST;
