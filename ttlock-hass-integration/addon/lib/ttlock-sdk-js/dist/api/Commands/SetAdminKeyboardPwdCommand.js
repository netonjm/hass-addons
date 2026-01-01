'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetAdminKeyboardPwdCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class SetAdminKeyboardPwdCommand extends Command_1.Command {
    processData() {
        // do nothing yet, we don't know if the lock returns anything
        if (this.commandData && this.commandData.length > 0) {
            console.log("SetAdminKeyboardPwdCommand received:", this.commandData);
        }
        // throw new Error("Method not implemented.");
    }
    build() {
        if (this.adminPasscode) {
            const data = Buffer.alloc(this.adminPasscode.length);
            for (let i = 0; i < this.adminPasscode.length; i++) {
                data[i] = parseInt(this.adminPasscode.charAt(i));
            }
            return data;
        }
        else {
            return Buffer.from([]);
        }
    }
    setAdminPasscode(adminPasscode) {
        this.adminPasscode = adminPasscode;
    }
    getAdminPasscode() {
        return this.adminPasscode;
    }
}
exports.SetAdminKeyboardPwdCommand = SetAdminKeyboardPwdCommand;
SetAdminKeyboardPwdCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_SET_ADMIN_KEYBOARD_PWD;
