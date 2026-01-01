'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassageModeCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const PassageModeOperate_1 = require("../../constant/PassageModeOperate");
const Command_1 = require("../Command");
class PassageModeCommand extends Command_1.Command {
    constructor() {
        super(...arguments);
        this.opType = PassageModeOperate_1.PassageModeOperate.QUERY;
    }
    processData() {
        if (this.commandData && this.commandData.length > 0) {
            this.opType = this.commandData.readInt8(1);
            if (this.opType == PassageModeOperate_1.PassageModeOperate.QUERY) {
                this.sequence = this.commandData.readInt8(2);
                this.dataOut = [];
                let index = 3;
                if (this.commandData.length >= 10) {
                    {
                        this.dataOut.push({
                            type: this.commandData.readInt8(index),
                            weekOrDay: this.commandData.readInt8(index + 1),
                            month: this.commandData.readInt8(index + 2),
                            startHour: this.commandData.readInt8(index + 3).toString().padStart(2, '0') + this.commandData.readInt8(index + 4).toString().padStart(2, '0'),
                            endHour: this.commandData.readInt8(index + 5).toString().padStart(2, '0') + this.commandData.readInt8(index + 6).toString().padStart(2, '0'),
                        });
                        index += 7;
                    }
                    while (index < this.commandData.length)
                        ;
                }
            }
            else {
            }
        }
    }
    build() {
        if (this.opType == PassageModeOperate_1.PassageModeOperate.QUERY && typeof this.sequence != "undefined") {
            return Buffer.from([this.opType, this.sequence]);
        }
        else if (this.dataIn) {
            return Buffer.from([
                this.opType,
                this.dataIn.type,
                this.dataIn.weekOrDay,
                this.dataIn.month,
                parseInt(this.dataIn.startHour.substr(0, 2)),
                parseInt(this.dataIn.startHour.substr(2, 2)),
                parseInt(this.dataIn.endHour.substr(0, 2)),
                parseInt(this.dataIn.endHour.substr(2, 2))
            ]);
        }
        else {
            return Buffer.from([this.opType]);
        }
    }
    setSequence(sequence = 0) {
        this.sequence = sequence;
    }
    getSequence() {
        if (this.sequence) {
            return this.sequence;
        }
        else {
            return -1;
        }
    }
    setData(data, type = PassageModeOperate_1.PassageModeOperate.ADD) {
        this.opType = type;
        this.dataIn = data;
    }
    setClear() {
        this.opType = PassageModeOperate_1.PassageModeOperate.CLEAR;
    }
    getData() {
        if (this.dataOut) {
            return this.dataOut;
        }
        else {
            return [];
        }
    }
}
exports.PassageModeCommand = PassageModeCommand;
PassageModeCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_CONFIGURE_PASSAGE_MODE;
