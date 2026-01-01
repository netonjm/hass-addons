'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManageFRCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const ICOperate_1 = require("../../constant/ICOperate");
const timeUtil_1 = require("../../util/timeUtil");
const Command_1 = require("../Command");
class ManageFRCommand extends Command_1.Command {
    processData() {
        if (this.commandData && this.commandData.length > 1) {
            this.batteryCapacity = this.commandData.readUInt8(0);
            this.opType = this.commandData.readUInt8(1);
            switch (this.opType) {
                case ICOperate_1.ICOperate.FR_SEARCH:
                    this.fingerprints = [];
                    this.sequence = this.commandData.readInt16BE(2);
                    let index = 4;
                    while (index < this.commandData.length) {
                        let fingerprint = {
                            fpNumber: "",
                            startDate: "",
                            endDate: ""
                        };
                        const fp = Buffer.alloc(8);
                        this.commandData.copy(fp, 2, index);
                        fingerprint.fpNumber = fp.readBigInt64BE().toString();
                        index += 6;
                        fingerprint.startDate = "20" + this.commandData.readUInt8(index++).toString().padStart(2, '0') // year
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // month
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // day
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // hour
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0'); // minutes
                        fingerprint.endDate = "20" + this.commandData.readUInt8(index++).toString().padStart(2, '0') // year
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // month
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // day
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // hour
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0'); // minutes
                        this.fingerprints.push(fingerprint);
                    }
                    break;
                case ICOperate_1.ICOperate.ADD:
                    let status = this.commandData.readUInt8(2);
                    this.opType = status;
                    switch (status) {
                        case ICOperate_1.ICOperate.STATUS_ADD_SUCCESS:
                            // TODO: APICommand.OP_RECOVERY_DATA
                            const fp = Buffer.alloc(8);
                            this.commandData.copy(fp, 2, 3);
                            this.fpNumber = fp.readBigInt64BE().toString();
                            break;
                        case ICOperate_1.ICOperate.STATUS_ENTER_ADD_MODE:
                            // entered add mode
                            break;
                        case ICOperate_1.ICOperate.STATUS_FR_PROGRESS:
                            // progress reading fingerprint
                            break;
                        case ICOperate_1.ICOperate.STATUS_FR_RECEIVE_TEMPLATE:
                            // ready to receive fingerprint template
                            break;
                    }
                    break;
                case ICOperate_1.ICOperate.MODIFY:
                    break;
                case ICOperate_1.ICOperate.DELETE:
                    break;
                case ICOperate_1.ICOperate.CLEAR:
                    break;
            }
        }
    }
    build() {
        if (typeof this.opType != "undefined") {
            switch (this.opType) {
                case ICOperate_1.ICOperate.FR_SEARCH:
                    if (typeof this.sequence != "undefined") {
                        const data = Buffer.alloc(3);
                        data.writeUInt8(this.opType, 0);
                        data.writeUInt16BE(this.sequence, 1);
                        return data;
                    }
                    break;
                case ICOperate_1.ICOperate.ADD:
                case ICOperate_1.ICOperate.MODIFY:
                    if (typeof this.fpNumber == "undefined") {
                        return Buffer.from([this.opType]);
                    }
                    else {
                        if (this.fpNumber && this.startDate && this.endDate) {
                            const data = Buffer.alloc(17);
                            data.writeUInt8(this.opType, 0);
                            const fp = Buffer.alloc(8);
                            fp.writeBigInt64BE(BigInt(this.fpNumber));
                            fp.copy(data, 1, 2);
                            (0, timeUtil_1.dateTimeToBuffer)(this.startDate.substr(2) + this.endDate.substr(2)).copy(data, 7);
                            return data;
                        }
                    }
                    break;
                case ICOperate_1.ICOperate.CLEAR:
                    return Buffer.from([this.opType]);
                case ICOperate_1.ICOperate.DELETE:
                    if (this.fpNumber) {
                        const data = Buffer.alloc(7);
                        data.writeUInt8(this.opType, 0);
                        const fp = Buffer.alloc(8);
                        fp.writeBigInt64BE(BigInt(this.fpNumber));
                        fp.copy(data, 1, 2);
                        return data;
                    }
                    break;
            }
        }
        return Buffer.from([]);
    }
    getType() {
        return this.opType || ICOperate_1.ICOperate.IC_SEARCH;
    }
    getFpNumber() {
        if (this.fpNumber) {
            return this.fpNumber;
        }
        return "";
    }
    setSequence(sequence = 0) {
        this.sequence = sequence;
        this.opType = ICOperate_1.ICOperate.FR_SEARCH;
    }
    getSequence() {
        if (this.sequence) {
            return this.sequence;
        }
        else {
            return -1;
        }
    }
    setAdd() {
        this.opType = ICOperate_1.ICOperate.ADD;
    }
    setModify(fpNumber, startDate, endDate) {
        this.fpNumber = fpNumber;
        this.startDate = startDate;
        this.endDate = endDate;
        this.opType = ICOperate_1.ICOperate.MODIFY;
    }
    setDelete(fpNumber) {
        this.fpNumber = fpNumber;
        this.opType = ICOperate_1.ICOperate.DELETE;
    }
    setClear() {
        this.opType = ICOperate_1.ICOperate.CLEAR;
    }
    getFingerprints() {
        if (this.fingerprints) {
            return this.fingerprints;
        }
        return [];
    }
    getBatteryCapacity() {
        if (this.batteryCapacity) {
            return this.batteryCapacity;
        }
        else {
            return -1;
        }
    }
}
exports.ManageFRCommand = ManageFRCommand;
ManageFRCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_FR_MANAGE;
