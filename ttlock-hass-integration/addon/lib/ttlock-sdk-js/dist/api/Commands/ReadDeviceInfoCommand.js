'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadDeviceInfoCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const DeviceInfoEnum_1 = require("../../constant/DeviceInfoEnum");
const Command_1 = require("../Command");
class ReadDeviceInfoCommand extends Command_1.Command {
    constructor() {
        super(...arguments);
        this.opType = DeviceInfoEnum_1.DeviceInfoEnum.MODEL_NUMBER;
    }
    processData() {
        // nothing to do here
    }
    setInfoType(infoType) {
        this.opType = infoType;
    }
    getInfoData() {
        if (this.commandData) {
            return this.commandData.subarray(0, this.commandData.length - 1);
        }
    }
    build() {
        return Buffer.from([this.opType]);
    }
}
exports.ReadDeviceInfoCommand = ReadDeviceInfoCommand;
ReadDeviceInfoCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_READ_DEVICE_INFO;
