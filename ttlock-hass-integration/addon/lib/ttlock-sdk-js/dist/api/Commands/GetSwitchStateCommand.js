'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSwitchStateCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class GetSwitchStateCommand extends Command_1.Command {
    processData() {
        throw new Error("Method not implemented.");
    }
    build() {
        throw new Error("Method not implemented.");
    }
}
exports.GetSwitchStateCommand = GetSwitchStateCommand;
GetSwitchStateCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_SWITCH;
