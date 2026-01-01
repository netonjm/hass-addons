'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalibrationTimeCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
const moment_1 = __importDefault(require("moment"));
const timeUtil_1 = require("../../util/timeUtil");
class CalibrationTimeCommand extends Command_1.Command {
    processData() {
        // nothing to do here 
    }
    build() {
        if (typeof this.time == "undefined") {
            this.time = (0, moment_1.default)().format("YYMMDDHHmmss");
        }
        return (0, timeUtil_1.dateTimeToBuffer)(this.time);
    }
}
exports.CalibrationTimeCommand = CalibrationTimeCommand;
CalibrationTimeCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_TIME_CALIBRATE;
