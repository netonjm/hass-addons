'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenPasscodeManageCommand = void 0;
const ActionType_1 = require("../../constant/ActionType");
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class ScreenPasscodeManageCommand extends Command_1.Command {
    constructor() {
        super(...arguments);
        this.opType = ActionType_1.ActionType.GET;
    }
    processData() {
        if (this.commandData) {
            this.opType = this.commandData.readUInt8(0);
            if (this.opType == ActionType_1.ActionType.GET && this.commandData.length > 1) {
                if (this.commandData.readUInt8(1) == 1) {
                    this.opValue = 1;
                }
                else {
                    this.opValue = 0;
                }
            }
        }
    }
    build() {
        if (this.opType == ActionType_1.ActionType.GET) {
            return Buffer.from([this.opType]);
        }
        else if (this.opType == ActionType_1.ActionType.SET && typeof this.opValue != "undefined") {
            return Buffer.from([this.opType, this.opValue]);
        }
        else {
            return Buffer.from([]);
        }
    }
    setNewValue(opValue) {
        this.opValue = opValue;
        this.opType = ActionType_1.ActionType.SET;
    }
    getValue() {
        if (this.opValue) {
            return this.opValue;
        }
    }
}
exports.ScreenPasscodeManageCommand = ScreenPasscodeManageCommand;
ScreenPasscodeManageCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_SHOW_PASSWORD;
