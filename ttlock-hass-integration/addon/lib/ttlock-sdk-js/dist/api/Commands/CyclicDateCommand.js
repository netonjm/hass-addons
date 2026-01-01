'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CyclicDateCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const CyclicOpType_1 = require("../../constant/CyclicOpType");
const Command_1 = require("../Command");
class CyclicDateCommand extends Command_1.Command {
    processData() {
        throw new Error("Method not implemented.");
    }
    build() {
        if (typeof this.opType != "undefined") {
            switch (this.opType) {
                case CyclicOpType_1.CyclicOpType.ADD:
                case CyclicOpType_1.CyclicOpType.CLEAR:
                    if (typeof this.userType != "undefined" && typeof this.user != "undefined") {
                        let userLen = this.calculateUserLen(this.userType, this.user);
                        let data;
                        if (this.opType == CyclicOpType_1.CyclicOpType.ADD) {
                            data = Buffer.alloc(3 + userLen + 11); // why so much, we only requre 7 extra bytes
                        }
                        else {
                            data = Buffer.alloc(3 + userLen);
                        }
                        switch (userLen) {
                            case 6:
                                data.writeBigInt64BE(BigInt(this.user), 1);
                                break;
                            case 8:
                                data.writeBigInt64BE(BigInt(this.user), 3);
                                break;
                            case 4:
                                data.writeInt32BE(parseInt(this.user), 3);
                                break;
                        }
                        data.writeUInt8(this.opType, 0);
                        data.writeUInt8(this.userType, 1);
                        data.writeUInt8(userLen, 2);
                        if (this.opType == CyclicOpType_1.CyclicOpType.ADD && typeof this.cyclicConfig != "undefined") {
                            let index = userLen + 3;
                            data.writeUInt8(CyclicOpType_1.CyclicOpType.CYCLIC_TYPE_WEEK, index++);
                            data.writeUInt8(this.cyclicConfig.weekDay, index++);
                            data.writeUInt8(0, index++);
                            data.writeUInt8(this.cyclicConfig.startTime / 60, index++);
                            data.writeUInt8(this.cyclicConfig.startTime % 60, index++);
                            data.writeUInt8(this.cyclicConfig.endTime / 60, index++);
                            data.writeUInt8(this.cyclicConfig.endTime % 60, index++);
                        }
                        return data;
                    }
                    break;
                default:
                    throw new Error("opType not implemented");
            }
        }
        return Buffer.from([]);
    }
    addIC(cardNumber, cyclicConfig) {
        this.opType = CyclicOpType_1.CyclicOpType.ADD;
        this.userType = CyclicOpType_1.CyclicOpType.USER_TYPE_IC;
        this.user = cardNumber;
        this.cyclicConfig = cyclicConfig;
    }
    clearIC(cardNumber) {
        this.opType = CyclicOpType_1.CyclicOpType.CLEAR;
        this.userType = CyclicOpType_1.CyclicOpType.USER_TYPE_IC;
        this.user = cardNumber;
    }
    addFR(fpNumber, cyclicConfig) {
        this.opType = CyclicOpType_1.CyclicOpType.ADD;
        this.userType = CyclicOpType_1.CyclicOpType.USER_TYPE_FR;
        this.user = fpNumber;
        this.cyclicConfig = cyclicConfig;
    }
    clearFR(fpNumber) {
        this.opType = CyclicOpType_1.CyclicOpType.CLEAR;
        this.userType = CyclicOpType_1.CyclicOpType.USER_TYPE_FR;
        this.user = fpNumber;
    }
    calculateUserLen(userType, user) {
        let userLen = 8;
        if (userType == CyclicOpType_1.CyclicOpType.USER_TYPE_FR) {
            userLen = 6;
        }
        else {
            if (BigInt(user) <= 0xffffffff) {
                userLen = 4;
            }
        }
        return userLen;
    }
}
exports.CyclicDateCommand = CyclicDateCommand;
CyclicDateCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_CYCLIC_CMD;
