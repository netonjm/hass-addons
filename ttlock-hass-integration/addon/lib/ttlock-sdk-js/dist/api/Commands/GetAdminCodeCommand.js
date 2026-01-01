'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAdminCodeCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class GetAdminCodeCommand extends Command_1.Command {
    processData() {
        if (this.commandData) {
            const len = this.commandData.readUInt8(1);
            if (len != this.commandData.length - 2) {
                console.error("GetAdminCodeCommand: data size (" + this.commandData.length + ") does not match declared length(" + len + ")");
            }
            if (len > 0) {
                this.adminPasscode = this.commandData.subarray(2, this.commandData.length - 2).toString();
            }
            else {
                this.adminPasscode = "";
            }
        }
    }
    build() {
        return Buffer.from([]);
    }
    getAdminPasscode() {
        if (this.adminPasscode) {
            return this.adminPasscode;
        }
    }
}
exports.GetAdminCodeCommand = GetAdminCodeCommand;
GetAdminCodeCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_GET_ADMIN_CODE;
