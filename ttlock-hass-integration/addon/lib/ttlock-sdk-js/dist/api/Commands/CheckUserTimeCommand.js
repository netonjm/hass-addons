'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckUserTimeCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const timeUtil_1 = require("../../util/timeUtil");
const Command_1 = require("../Command");
class CheckUserTimeCommand extends Command_1.Command {
    processData() {
        // nothing to do
    }
    build() {
        if (typeof this.uid != "undefined" && this.startDate && this.endDate && typeof this.lockFlagPos != "undefined") {
            const data = Buffer.alloc(17); //5+5+3+4
            (0, timeUtil_1.dateTimeToBuffer)(this.startDate).copy(data, 0);
            data.writeUInt32BE(this.lockFlagPos, 9); // overlap first byte
            (0, timeUtil_1.dateTimeToBuffer)(this.endDate).copy(data, 5);
            data.writeUInt32BE(this.uid, 13);
            return data;
        }
        return Buffer.from([]);
    }
    setPayload(uid, startDate, endDate, lockFlagPos) {
        this.uid = uid;
        this.startDate = startDate;
        this.endDate = endDate;
        this.lockFlagPos = lockFlagPos;
    }
    getPsFromLock() {
        if (this.commandData) {
            return this.commandData.readUInt32BE(0);
        }
        else {
            return -1;
        }
    }
}
exports.CheckUserTimeCommand = CheckUserTimeCommand;
CheckUserTimeCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_CHECK_USER_TIME;
