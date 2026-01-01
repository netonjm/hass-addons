'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationLogCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const LogOperate_1 = require("../../constant/LogOperate");
const Command_1 = require("../Command");
class OperationLogCommand extends Command_1.Command {
    processData() {
        if (this.commandData && this.commandData.length >= 2) {
            const totalLen = this.commandData.readUInt16BE(0);
            this.logs = [];
            this.sequence = 0;
            if (totalLen > 0) {
                this.sequence = this.commandData.readUInt16BE(2);
                let index = 4;
                while (index < this.commandData.length) {
                    const recLen = this.commandData.readUInt8(index++);
                    const recStart = index;
                    let log = {
                        recordNumber: this.sequence - 1,
                        recordType: this.commandData.readUInt8(index++),
                        operateDate: "20" + this.commandData.readUInt8(index++).toString().padStart(2, '0') // year
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // month
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // day
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // hour
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // minutes
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0'),
                        electricQuantity: this.commandData.readUInt8(index++)
                    };
                    let pwdLen = 0;
                    switch (log.recordType) {
                        case LogOperate_1.LogOperate.OPERATE_TYPE_MOBILE_UNLOCK:
                        case LogOperate_1.LogOperate.OPERATE_BLE_LOCK:
                        case LogOperate_1.LogOperate.GATEWAY_UNLOCK:
                        case LogOperate_1.LogOperate.APP_UNLOCK_FAILED_LOCK_REVERSE:
                        case LogOperate_1.LogOperate.REMOTE_CONTROL_KEY:
                            log.uid = this.commandData.readUInt32BE(index);
                            index += 4;
                            log.recordId = this.commandData.readUInt32BE(index);
                            index += 4;
                            if (log.recordType == LogOperate_1.LogOperate.REMOTE_CONTROL_KEY) {
                                log.keyId = this.commandData.readUInt8(index++);
                            }
                            break;
                        case LogOperate_1.LogOperate.OPERATE_TYPE_KEYBOARD_PASSWORD_UNLOCK:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_USE_DELETE_CODE:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_PASSCODE_EXPIRED:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_SPACE_INSUFFICIENT:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_PASSCODE_IN_BLACK_LIST:
                        case LogOperate_1.LogOperate.PASSCODE_LOCK:
                        case LogOperate_1.LogOperate.PASSCODE_UNLOCK_FAILED_LOCK_REVERSE:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_KEYBOARD_MODIFY_PASSWORD:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_KEYBOARD_REMOVE_SINGLE_PASSWORD:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_KEYBOARD_PASSWORD_KICKED:
                            pwdLen = this.commandData.readUInt8(index++);
                            log.password = this.commandData.slice(index, index + pwdLen).toString("ascii");
                            index += pwdLen;
                            pwdLen = this.commandData.readUInt8(index++);
                            log.newPassword = this.commandData.slice(index, index + pwdLen).toString("ascii");
                            index += pwdLen;
                            break;
                        case LogOperate_1.LogOperate.OPERATE_TYPE_ERROR_PASSWORD_UNLOCK:
                            pwdLen = this.commandData.readUInt8(index++);
                            log.password = this.commandData.slice(index, index + pwdLen).toString("ascii");
                            index += pwdLen;
                            break;
                        case LogOperate_1.LogOperate.OPERATE_TYPE_KEYBOARD_REMOVE_ALL_PASSWORDS:
                            log.deleteDate = "20" + this.commandData.readUInt8(index++).toString().padStart(2, '0') // year
                                + this.commandData.readUInt8(index++).toString().padStart(2, '0') // month
                                + this.commandData.readUInt8(index++).toString().padStart(2, '0') // day
                                + this.commandData.readUInt8(index++).toString().padStart(2, '0') // hour
                                + this.commandData.readUInt8(index++).toString().padStart(2, '0'); // minutes
                            break;
                        case LogOperate_1.LogOperate.OPERATE_TYPE_ADD_IC:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_DELETE_IC_SUCCEED:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_IC_UNLOCK_SUCCEED:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_IC_UNLOCK_FAILED:
                        case LogOperate_1.LogOperate.IC_LOCK:
                        case LogOperate_1.LogOperate.IC_UNLOCK_FAILED_LOCK_REVERSE:
                            pwdLen = recLen - (index - recStart); // what's left
                            if (pwdLen == 4) {
                                log.password = this.commandData.readUInt32BE(index).toString();
                            }
                            else {
                                log.password = this.commandData.readBigUInt64BE(index).toString();
                            }
                            index += pwdLen;
                            break;
                        case LogOperate_1.LogOperate.OPERATE_TYPE_BONG_UNLOCK_SUCCEED:
                            log.password = this.commandData.readUInt8(index + 5).toString(16) + ':'
                                + this.commandData.readUInt8(index + 4).toString(16) + ':'
                                + this.commandData.readUInt8(index + 3).toString(16) + ':'
                                + this.commandData.readUInt8(index + 2).toString(16) + ':'
                                + this.commandData.readUInt8(index + 1).toString(16) + ':'
                                + this.commandData.readUInt8(index).toString(16);
                            index += 6;
                            break;
                        case LogOperate_1.LogOperate.OPERATE_TYPE_FR_UNLOCK_SUCCEED:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_ADD_FR:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_FR_UNLOCK_FAILED:
                        case LogOperate_1.LogOperate.OPERATE_TYPE_DELETE_FR_SUCCEED:
                        case LogOperate_1.LogOperate.FR_LOCK:
                        case LogOperate_1.LogOperate.FR_UNLOCK_FAILED_LOCK_REVERSE:
                            log.password = Buffer.concat([
                                Buffer.from([0, 0]),
                                this.commandData.slice(index, index + 6)
                            ]).readBigInt64BE().toString();
                            index += 6;
                            if (index < recStart + recLen) {
                                pwdLen = recLen - (index - recStart); // what's left
                                log.newPassword = this.commandData.slice(index, index + pwdLen).toString("ascii");
                                index += pwdLen;
                            }
                            break;
                        case LogOperate_1.LogOperate.WIRELESS_KEY_FOB:
                        case LogOperate_1.LogOperate.WIRELESS_KEY_PAD:
                            log.password = this.commandData.readUInt8(index + 5).toString(16) + ':'
                                + this.commandData.readUInt8(index + 4).toString(16) + ':'
                                + this.commandData.readUInt8(index + 3).toString(16) + ':'
                                + this.commandData.readUInt8(index + 2).toString(16) + ':'
                                + this.commandData.readUInt8(index + 1).toString(16) + ':'
                                + this.commandData.readUInt8(index).toString(16);
                            index += 6;
                            log.keyId = this.commandData.readUInt8(index++);
                            log.accessoryElectricQuantity = this.commandData.readUInt8(index++);
                            break;
                        default:
                            pwdLen = recLen - (index - recStart);
                            if (pwdLen > 0) {
                                console.error("LogOperate not implemented", log.recordType, "Data left:", this.commandData.slice(index, index + pwdLen).toString("hex"));
                                index = recStart + recLen;
                            }
                    }
                    this.logs.push(log);
                }
            }
        }
    }
    build() {
        if (typeof this.sequence == "undefined") {
            this.sequence = 0xffff;
        }
        let data = Buffer.alloc(2);
        data.writeUInt16BE(this.sequence);
        return data;
    }
    setSequence(sequence) {
        this.sequence = sequence;
    }
    getSequence() {
        if (typeof this.sequence == "undefined") {
            return 0xffff;
        }
        else {
            return this.sequence;
        }
    }
    getLogs() {
        if (typeof this.logs == "undefined") {
            return [];
        }
        else {
            return this.logs;
        }
    }
}
exports.OperationLogCommand = OperationLogCommand;
OperationLogCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_GET_OPERATE_LOG;
