'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetLockCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class ResetLockCommand extends Command_1.Command {
    processData() {
        // nothing to do here
    }
    build() {
        return Buffer.from([]);
    }
}
exports.ResetLockCommand = ResetLockCommand;
ResetLockCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_RESET_LOCK;
