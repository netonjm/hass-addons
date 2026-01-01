'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckAdminCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class CheckAdminCommand extends Command_1.Command {
    constructor() {
        super(...arguments);
        this.uid = 0;
        this.lockFlagPos = 0;
    }
    processData() {
        // nothing to do, all incomming data is the 'token'
    }
    build() {
        if (typeof this.adminPs != "undefined") {
            const data = Buffer.alloc(11);
            data.writeUInt32BE(this.lockFlagPos, 3); // 4 bytes (first one overlaps with adminPs)
            data.writeUInt32BE(this.adminPs, 0); // 4 bytes
            data.writeUInt32BE(this.uid, 7);
            return data;
        }
        else {
            return Buffer.from([]);
        }
    }
    setParams(adminPs) {
        this.adminPs = adminPs;
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
exports.CheckAdminCommand = CheckAdminCommand;
CheckAdminCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_CHECK_ADMIN;
