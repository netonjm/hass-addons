'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioManageCommand = void 0;
const AudioManage_1 = require("../../constant/AudioManage");
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class AudioManageCommand extends Command_1.Command {
    constructor() {
        super(...arguments);
        this.opType = AudioManage_1.AudioManage.QUERY;
    }
    processData() {
        if (this.commandData && this.commandData.length >= 2) {
            this.batteryCapacity = this.commandData.readUInt8(0);
            this.opType = this.commandData.readUInt8(1);
            if (this.opType == AudioManage_1.AudioManage.QUERY && this.commandData.length >= 3) {
                this.opValue = this.commandData.readUInt8(2);
            }
        }
    }
    build() {
        if (this.opType == AudioManage_1.AudioManage.QUERY) {
            return Buffer.from([this.opType]);
        }
        else if (this.opType == AudioManage_1.AudioManage.MODIFY && typeof this.opValue != "undefined") {
            return Buffer.from([this.opType, this.opValue]);
        }
        else {
            return Buffer.from([]);
        }
    }
    setNewValue(opValue) {
        this.opValue = opValue;
        this.opType = AudioManage_1.AudioManage.MODIFY;
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
exports.AudioManageCommand = AudioManageCommand;
AudioManageCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_AUDIO_MANAGE;
