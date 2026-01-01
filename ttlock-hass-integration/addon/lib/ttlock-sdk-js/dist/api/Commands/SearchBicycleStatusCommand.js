'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchBicycleStatusCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class SearchBicycleStatusCommand extends Command_1.Command {
    processData() {
        if (this.commandData && this.commandData.length >= 2) {
            this.lockStatus = this.commandData.readInt8(1);
        }
    }
    build() {
        return Buffer.from("SCIENER");
    }
    getLockStatus() {
        if (typeof this.lockStatus != "undefined") {
            return this.lockStatus;
        }
        else {
            return -1;
        }
    }
}
exports.SearchBicycleStatusCommand = SearchBicycleStatusCommand;
SearchBicycleStatusCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_SEARCH_BICYCLE_STATUS;
