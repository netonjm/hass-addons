'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManageICCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const ICOperate_1 = require("../../constant/ICOperate");
const timeUtil_1 = require("../../util/timeUtil");
const Command_1 = require("../Command");
class ManageICCommand extends Command_1.Command {
    processData() {
        if (this.commandData && this.commandData.length > 1) {
            this.batteryCapacity = this.commandData.readUInt8(0);
            this.opType = this.commandData.readUInt8(1);
            switch (this.opType) {
                case ICOperate_1.ICOperate.IC_SEARCH:
                    this.cards = [];
                    this.sequence = this.commandData.readInt16BE(2);
                    let index = 4;
                    while (index < this.commandData.length) {
                        let card = {
                            cardNumber: "",
                            startDate: "",
                            endDate: ""
                        };
                        if (this.commandData.length == 24) {
                            card.cardNumber = this.commandData.readBigUInt64BE(index).toString();
                            index += 8;
                        }
                        else {
                            card.cardNumber = this.commandData.readUInt32BE(index).toString();
                            index += 4;
                        }
                        card.startDate = "20" + this.commandData.readUInt8(index++).toString().padStart(2, '0') // year
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // month
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // day
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // hour
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0'); // minutes
                        card.endDate = "20" + this.commandData.readUInt8(index++).toString().padStart(2, '0') // year
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // month
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // day
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0') // hour
                            + this.commandData.readUInt8(index++).toString().padStart(2, '0'); // minutes
                        this.cards.push(card);
                    }
                    break;
                case ICOperate_1.ICOperate.ADD:
                    let status = this.commandData.readUInt8(2);
                    this.opType = status;
                    switch (status) {
                        case ICOperate_1.ICOperate.STATUS_ADD_SUCCESS:
                            // TODO: APICommand.OP_RECOVERY_DATA
                            let len = this.commandData.length - 3;
                            // remaining length should be 4 or 8, but if the last 4 bytes are 0xff they should be ignored
                            if (len == 4 || this.commandData.readUInt32BE(this.commandData.length - 5).toString(16) == 'ffffffff') {
                                this.cardNumber = this.commandData.readUInt32BE(3).toString();
                            }
                            else {
                                this.cardNumber = this.commandData.readBigUInt64BE(3).toString();
                            }
                            break;
                        case ICOperate_1.ICOperate.STATUS_ENTER_ADD_MODE:
                            // entered add mode
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
        if (this.opType) {
            switch (this.opType) {
                case ICOperate_1.ICOperate.IC_SEARCH:
                    if (typeof this.sequence != "undefined") {
                        let data = Buffer.alloc(3);
                        data.writeUInt8(this.opType, 0);
                        data.writeUInt16BE(this.sequence, 1);
                        return data;
                    }
                    break;
                case ICOperate_1.ICOperate.ADD:
                case ICOperate_1.ICOperate.MODIFY:
                    if (typeof this.cardNumber == "undefined") {
                        return Buffer.from([this.opType]);
                    }
                    else {
                        if (this.cardNumber && this.startDate && this.endDate) {
                            let data;
                            let index = 0;
                            if (this.cardNumber.length > 10) {
                                data = Buffer.alloc(19);
                                data.writeBigUInt64BE(BigInt(this.cardNumber), 1);
                                index = 9;
                            }
                            else {
                                data = Buffer.alloc(15);
                                data.writeUInt32BE(parseInt(this.cardNumber), 1);
                                index = 5;
                            }
                            data.writeUInt8(this.opType, 0);
                            (0, timeUtil_1.dateTimeToBuffer)(this.startDate.substr(2) + this.endDate.substr(2)).copy(data, index);
                            return data;
                        }
                    }
                    break;
                case ICOperate_1.ICOperate.CLEAR:
                    return Buffer.from([this.opType]);
                case ICOperate_1.ICOperate.DELETE:
                    if (this.cardNumber) {
                        if (this.cardNumber.length > 10) {
                            const data = Buffer.alloc(9);
                            data.writeUInt8(this.opType, 0);
                            data.writeBigUInt64BE(BigInt(this.cardNumber), 1);
                        }
                        else {
                            const data = Buffer.alloc(5);
                            data.writeUInt8(this.opType, 0);
                            data.writeUInt32BE(parseInt(this.cardNumber), 1);
                            return data;
                        }
                    }
                    break;
            }
        }
        return Buffer.from([]);
    }
    getType() {
        return this.opType || ICOperate_1.ICOperate.IC_SEARCH;
    }
    getCardNumber() {
        if (this.cardNumber) {
            return this.cardNumber;
        }
        else
            return "";
    }
    setSequence(sequence = 0) {
        this.sequence = sequence;
        this.opType = ICOperate_1.ICOperate.IC_SEARCH;
    }
    getSequence() {
        if (this.sequence) {
            return this.sequence;
        }
        else {
            return -1;
        }
    }
    setAdd(cardNumber, startDate, endDate) {
        if (typeof cardNumber != "undefined" && typeof startDate != "undefined" && typeof endDate != "undefined") {
            this.cardNumber = cardNumber;
            this.startDate = startDate;
            this.endDate = endDate;
        }
        this.opType = ICOperate_1.ICOperate.ADD;
    }
    setModify(cardNumber, startDate, endDate) {
        this.cardNumber = cardNumber;
        this.startDate = startDate;
        this.endDate = endDate;
        this.opType = ICOperate_1.ICOperate.MODIFY;
    }
    setDelete(cardNumber) {
        this.cardNumber = cardNumber;
        this.opType = ICOperate_1.ICOperate.DELETE;
    }
    setClear() {
        this.opType = ICOperate_1.ICOperate.CLEAR;
    }
    getCards() {
        if (this.cards) {
            return this.cards;
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
exports.ManageICCommand = ManageICCommand;
ManageICCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_IC_MANAGE;
