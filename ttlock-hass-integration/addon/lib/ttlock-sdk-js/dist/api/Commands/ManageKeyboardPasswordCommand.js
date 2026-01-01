'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManageKeyboardPasswordCommand = void 0;
const moment_1 = __importDefault(require("moment"));
const CommandType_1 = require("../../constant/CommandType");
const DateConstant_1 = require("../../constant/DateConstant");
const KeyboardPwdType_1 = require("../../constant/KeyboardPwdType");
const PwdOperateType_1 = require("../../constant/PwdOperateType");
const Command_1 = require("../Command");
class ManageKeyboardPasswordCommand extends Command_1.Command {
    constructor() {
        super(...arguments);
        this.opType = PwdOperateType_1.PwdOperateType.PWD_OPERATE_TYPE_ADD;
    }
    processData() {
        if (this.commandData && this.commandData.length > 1) {
            this.opType = this.commandData.readUInt8(1);
        }
    }
    build() {
        switch (this.opType) {
            case PwdOperateType_1.PwdOperateType.PWD_OPERATE_TYPE_CLEAR:
                return Buffer.from([this.opType]);
            case PwdOperateType_1.PwdOperateType.PWD_OPERATE_TYPE_ADD:
                return this.buildAdd();
            case PwdOperateType_1.PwdOperateType.PWD_OPERATE_TYPE_REMOVE_ONE:
                return this.buildDel();
            case PwdOperateType_1.PwdOperateType.PWD_OPERATE_TYPE_MODIFY:
                return this.buildEdit();
        }
        return Buffer.from([]);
    }
    getOpType() {
        return this.opType;
    }
    addPasscode(type, passCode, startDate = DateConstant_1.DateConstant.START_DATE_TIME, endDate = DateConstant_1.DateConstant.END_DATE_TIME) {
        this.type = type;
        if (passCode.length >= 4 && passCode.length <= 9) {
            this.oldPassCode = "";
            this.passCode = passCode;
        }
        else {
            return false;
        }
        this.startDate = (0, moment_1.default)(startDate, "YYYYMMDDHHmm");
        if (!this.startDate.isValid()) {
            return false;
        }
        this.endDate = (0, moment_1.default)(endDate, "YYYYMMDDHHmm");
        if (!this.endDate.isValid()) {
            return false;
        }
        this.opType = PwdOperateType_1.PwdOperateType.PWD_OPERATE_TYPE_ADD;
        return true;
    }
    updatePasscode(type, oldPassCode, newPassCode, startDate = DateConstant_1.DateConstant.START_DATE_TIME, endDate = DateConstant_1.DateConstant.END_DATE_TIME) {
        this.type = type;
        if (oldPassCode.length >= 4 && oldPassCode.length <= 9) {
            this.oldPassCode = oldPassCode;
        }
        else {
            return false;
        }
        if (newPassCode.length >= 4 && newPassCode.length <= 9) {
            this.passCode = newPassCode;
        }
        else {
            return false;
        }
        this.startDate = (0, moment_1.default)(startDate, "YYYYMMDDHHmm");
        if (!this.startDate.isValid()) {
            return false;
        }
        this.endDate = (0, moment_1.default)(endDate, "YYYYMMDDHHmm");
        if (!this.endDate.isValid()) {
            return false;
        }
        this.opType = PwdOperateType_1.PwdOperateType.PWD_OPERATE_TYPE_MODIFY;
        return true;
    }
    deletePasscode(type, oldPassCode) {
        this.type = type;
        if (oldPassCode.length >= 4 && oldPassCode.length <= 9) {
            this.oldPassCode = oldPassCode;
        }
        else {
            return false;
        }
        this.opType = PwdOperateType_1.PwdOperateType.PWD_OPERATE_TYPE_REMOVE_ONE;
        return true;
    }
    clearAllPasscodes() {
        this.opType = PwdOperateType_1.PwdOperateType.PWD_OPERATE_TYPE_CLEAR;
    }
    buildAdd() {
        if (typeof this.type != "undefined" && typeof this.passCode != "undefined" && this.startDate && this.endDate) {
            let data;
            if (this.type == KeyboardPwdType_1.KeyboardPwdType.PWD_TYPE_PERMANENT) {
                data = Buffer.alloc(1 + 1 + 1 + this.passCode.length + 5 + 5);
            }
            else {
                data = Buffer.alloc(1 + 1 + 1 + this.passCode.length + 5);
            }
            let index = 0;
            data.writeUInt8(this.opType, index++);
            data.writeUInt8(this.type, index++);
            data.writeUInt8(this.passCode.length, index++);
            for (let i = 0; i < this.passCode.length; i++) {
                data.writeUInt8(this.passCode.charCodeAt(i), index++);
            }
            data.writeUInt8(parseInt(this.startDate.format("YY")), index++);
            data.writeUInt8(parseInt(this.startDate.format("MM")), index++);
            data.writeUInt8(parseInt(this.startDate.format("DD")), index++);
            data.writeUInt8(parseInt(this.startDate.format("HH")), index++);
            data.writeUInt8(parseInt(this.startDate.format("mm")), index++);
            if (this.type != KeyboardPwdType_1.KeyboardPwdType.PWD_TYPE_PERMANENT) {
                data.writeUInt8(parseInt(this.endDate.format("YY")), index++);
                data.writeUInt8(parseInt(this.endDate.format("MM")), index++);
                data.writeUInt8(parseInt(this.endDate.format("DD")), index++);
                data.writeUInt8(parseInt(this.endDate.format("HH")), index++);
                data.writeUInt8(parseInt(this.endDate.format("mm")), index++);
            }
            return data;
        }
        else {
            return Buffer.from([]);
        }
    }
    buildDel() {
        if (typeof this.type != "undefined" && typeof this.oldPassCode != "undefined") {
            let data = Buffer.alloc(1 + 1 + 1 + this.oldPassCode.length);
            let index = 0;
            data.writeUInt8(this.opType, index++);
            data.writeUInt8(this.type, index++);
            data.writeUInt8(this.oldPassCode.length, index++);
            for (let i = 0; i < this.oldPassCode.length; i++) {
                data.writeUInt8(this.oldPassCode.charCodeAt(i), index++);
            }
            return data;
        }
        else {
            return Buffer.from([]);
        }
    }
    buildEdit() {
        if (typeof this.type != "undefined" && typeof this.oldPassCode != "undefined" && typeof this.passCode != "undefined" && this.startDate && this.endDate) {
            let data = Buffer.alloc(1 + 1 + 1 + this.oldPassCode.length + 1 + this.passCode.length + 5 + 5);
            let index = 0;
            data.writeUInt8(this.opType, index++);
            data.writeUInt8(this.type, index++);
            data.writeUInt8(this.oldPassCode.length, index++);
            for (let i = 0; i < this.oldPassCode.length; i++) {
                data.writeUInt8(this.oldPassCode.charCodeAt(i), index++);
            }
            data.writeUInt8(this.passCode.length, index++);
            for (let i = 0; i < this.passCode.length; i++) {
                data.writeUInt8(this.passCode.charCodeAt(i), index++);
            }
            data.writeUInt8(parseInt(this.startDate.format("YY")), index++);
            data.writeUInt8(parseInt(this.startDate.format("MM")), index++);
            data.writeUInt8(parseInt(this.startDate.format("DD")), index++);
            data.writeUInt8(parseInt(this.startDate.format("HH")), index++);
            data.writeUInt8(parseInt(this.startDate.format("mm")), index++);
            data.writeUInt8(parseInt(this.endDate.format("YY")), index++);
            data.writeUInt8(parseInt(this.endDate.format("MM")), index++);
            data.writeUInt8(parseInt(this.endDate.format("DD")), index++);
            data.writeUInt8(parseInt(this.endDate.format("HH")), index++);
            data.writeUInt8(parseInt(this.endDate.format("mm")), index++);
            return data;
        }
        else {
            return Buffer.from([]);
        }
    }
}
exports.ManageKeyboardPasswordCommand = ManageKeyboardPasswordCommand;
ManageKeyboardPasswordCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_MANAGE_KEYBOARD_PASSWORD;
