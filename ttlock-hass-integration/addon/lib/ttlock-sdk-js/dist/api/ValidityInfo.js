'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidityInfo = exports.ValidityType = void 0;
const moment_1 = __importDefault(require("moment"));
const DateConstant_1 = require("../constant/DateConstant");
var ValidityType;
(function (ValidityType) {
    ValidityType[ValidityType["TIMED"] = 1] = "TIMED";
    ValidityType[ValidityType["CYCLIC"] = 4] = "CYCLIC";
})(ValidityType = exports.ValidityType || (exports.ValidityType = {}));
class ValidityInfo {
    constructor(type = ValidityType.TIMED, startDate = DateConstant_1.DateConstant.START_DATE_TIME, endDdate = DateConstant_1.DateConstant.END_DATE_TIME) {
        this.type = type;
        this.startDate = (0, moment_1.default)(startDate, "YYYYMMDDHHmm");
        if (!this.startDate.isValid()) {
            throw new Error("Invalid startDate");
        }
        this.endDate = (0, moment_1.default)(endDdate, "YYYYMMDDHHmm");
        if (!this.endDate.isValid()) {
            throw new Error("Invalid endDate");
        }
        this.cycles = [];
    }
    setType(type) {
        this.type = type;
    }
    addCycle(cycle) {
        if (this.isValidCycle(cycle)) {
            this.cycles.push(cycle);
            return true;
        }
        return false;
    }
    setStartDate(startDate) {
        let date = (0, moment_1.default)(startDate, "YYYYMMDDHHmm");
        if (date.isValid()) {
            this.startDate = date;
            return true;
        }
        return false;
    }
    setEndDate(endDate) {
        let date = (0, moment_1.default)(endDate, "YYYYMMDDHHmm");
        if (date.isValid()) {
            this.endDate = date;
            return true;
        }
        return false;
    }
    getType() {
        return this.type;
    }
    getStartDate() {
        return this.startDate.format("YYYYMMDDHHmm");
    }
    getStartDateMoment() {
        return this.startDate;
    }
    getEndDate() {
        return this.endDate.format("YYYYMMDDHHmm");
    }
    geetEndDateMoment() {
        return this.endDate;
    }
    getCycles() {
        return this.cycles;
    }
    isValidCycle(cycle) {
        if (cycle.weekDay < 1 || cycle.weekDay > 7)
            return false;
        if (cycle.startTime < 0 || cycle.startTime > 24 * 60)
            return false;
        if (cycle.endTime < 0 || cycle.endTime > 24 * 60)
            return false;
        return true;
    }
}
exports.ValidityInfo = ValidityInfo;
