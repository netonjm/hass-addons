'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlLampCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class ControlLampCommand extends Command_1.Command {
    processData() {
        throw new Error("Method not implemented.");
    }
    build() {
        throw new Error("Method not implemented.");
    }
}
exports.ControlLampCommand = ControlLampCommand;
ControlLampCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_LAMP;
