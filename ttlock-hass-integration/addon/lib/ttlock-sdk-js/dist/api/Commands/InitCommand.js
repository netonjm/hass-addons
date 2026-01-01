'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class InitCommand extends Command_1.Command {
    processData() {
        // nothing to do
    }
    build() {
        return Buffer.from([]);
    }
}
exports.InitCommand = InitCommand;
InitCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_INITIALIZATION;
