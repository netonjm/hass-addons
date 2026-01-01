'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlRemoteUnlockCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const ConfigRemoteUnlock_1 = require("../../constant/ConfigRemoteUnlock");
const Command_1 = require("../Command");
class ControlRemoteUnlockCommand extends Command_1.Command {
    constructor() {
        super(...arguments);
        this.opType = ConfigRemoteUnlock_1.ConfigRemoteUnlock.OP_TYPE_SEARCH;
    }
    processData() {
        if (this.commandData && this.commandData.length > 1) {
            this.batteryCapacity = this.commandData.readUInt8(0);
            this.opType = this.commandData.readUInt8(1);
            if (this.opType == ConfigRemoteUnlock_1.ConfigRemoteUnlock.OP_TYPE_SEARCH && this.commandData.length > 2) {
                this.opValue = this.commandData.readUInt8(2);
            }
        }
    }
    build() {
        if (this.opType == ConfigRemoteUnlock_1.ConfigRemoteUnlock.OP_TYPE_SEARCH) {
            return Buffer.from([this.opType]);
        }
        else if (this.opType == ConfigRemoteUnlock_1.ConfigRemoteUnlock.OP_TYPE_MODIFY && typeof this.opValue != "undefined") {
            return Buffer.from([this.opType, this.opValue]);
        }
        else {
            return Buffer.from([]);
        }
    }
    setNewValue(opValue) {
        this.opValue = opValue;
        this.opType = ConfigRemoteUnlock_1.ConfigRemoteUnlock.OP_TYPE_MODIFY;
    }
    getValue() {
        if (typeof this.opValue != "undefined") {
            return this.opValue;
        }
    }
    getBatteryCapacity() {
        if (typeof this.batteryCapacity != "undefined") {
            return this.batteryCapacity;
        }
        else {
            return -1;
        }
    }
}
exports.ControlRemoteUnlockCommand = ControlRemoteUnlockCommand;
ControlRemoteUnlockCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_CONTROL_REMOTE_UNLOCK;
