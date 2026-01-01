'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockCommand = void 0;
const moment_1 = __importDefault(require("moment"));
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class LockCommand extends Command_1.Command {
    processData() {
        if (this.commandData && this.commandData.length > 0) {
            this.batteryCapacity = this.commandData.readUInt8(0);
            if (this.commandData.length >= 15) {
                this.uid = this.commandData.readUInt32BE(1);
                this.uniqueid = this.commandData.readUInt32BE(5);
                const dateObj = {
                    year: 2000 + this.commandData.readUInt8(9),
                    month: this.commandData.readUInt8(10) - 1,
                    day: this.commandData.readUInt8(11),
                    hour: this.commandData.readUInt8(12),
                    minute: this.commandData.readUInt8(13),
                    second: this.commandData.readUInt8(14)
                };
                this.dateTime = (0, moment_1.default)(dateObj).format("YYMMDDHHmmss");
            }
        }
    }
    build() {
        if (this.sum) {
            const data = Buffer.alloc(8);
            data.writeUInt32BE(this.sum, 0);
            data.writeUInt32BE((0, moment_1.default)().unix(), 4);
            return data;
        }
        return Buffer.from([]);
    }
    setSum(psFromLock, unlockKey) {
        this.sum = psFromLock + unlockKey;
    }
    getUnlockData() {
        const data = {
            uid: this.uid,
            uniqueid: this.uniqueid,
            dateTime: this.dateTime,
            batteryCapacity: this.batteryCapacity
        };
        return data;
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
exports.LockCommand = LockCommand;
LockCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_FUNCTION_LOCK;
