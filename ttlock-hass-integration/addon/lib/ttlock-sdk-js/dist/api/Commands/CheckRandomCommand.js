'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckRandomCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class CheckRandomCommand extends Command_1.Command {
    processData() {
        // nothing to do here
    }
    build() {
        if (this.sum) {
            const data = Buffer.alloc(4);
            data.writeUInt32BE(this.sum);
            return data;
        }
        return Buffer.from([]);
    }
    setSum(psFromLock, unlockKey) {
        this.sum = psFromLock + unlockKey;
    }
}
exports.CheckRandomCommand = CheckRandomCommand;
CheckRandomCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_CHECK_RANDOM;
