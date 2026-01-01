'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperateFinishedCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class OperateFinishedCommand extends Command_1.Command {
    processData() {
        // nothing to do
    }
    build() {
        return Buffer.from([]);
    }
}
exports.OperateFinishedCommand = OperateFinishedCommand;
OperateFinishedCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_GET_ALARM_ERRCORD_OR_OPERATION_FINISHED;
