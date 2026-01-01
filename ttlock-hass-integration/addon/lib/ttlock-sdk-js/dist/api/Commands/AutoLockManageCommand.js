'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoLockManageCommand = void 0;
const AutoLockOperate_1 = require("../../constant/AutoLockOperate");
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class AutoLockManageCommand extends Command_1.Command {
    constructor() {
        super(...arguments);
        this.opType = AutoLockOperate_1.AutoLockOperate.SEARCH;
    }
    processData() {
        if (this.commandData && this.commandData.length >= 4) {
            // 0 - battery
            // 1 - opType
            // 2,3 - opValue
            // 4,5 - min value
            // 6,7 - max value
            this.batteryCapacity = this.commandData.readUInt8(0);
            this.opType = this.commandData.readUInt8(1);
            if (this.opType == AutoLockOperate_1.AutoLockOperate.SEARCH) {
                this.opValue = this.commandData.readUInt16BE(2);
            }
            else {
            }
        }
    }
    build() {
        if (this.opType == AutoLockOperate_1.AutoLockOperate.SEARCH) {
            return Buffer.from([this.opType]);
        }
        else if (typeof this.opValue != "undefined") {
            return Buffer.from([
                this.opType,
                this.opValue >> 8,
                this.opValue
            ]);
        }
        else {
            return Buffer.from([]);
        }
    }
    setTime(opValue) {
        this.opValue = opValue;
        this.opType = AutoLockOperate_1.AutoLockOperate.MODIFY;
    }
    getTime() {
        if (typeof this.opValue != "undefined") {
            return this.opValue;
        }
        else {
            return -1;
        }
    }
    getBatteryCapacity() {
        if (this.batteryCapacity) {
            return this.batteryCapacity;
        }
        else {
            return -1;
        }
    }
}
exports.AutoLockManageCommand = AutoLockManageCommand;
AutoLockManageCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_AUTO_LOCK_MANAGE;
