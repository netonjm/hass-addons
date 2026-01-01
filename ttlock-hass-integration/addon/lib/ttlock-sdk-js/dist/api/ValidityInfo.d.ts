import moment from "moment";
export declare enum ValidityType {
    TIMED = 1,
    CYCLIC = 4
}
export interface CyclicConfig {
    /** 1-7 monday-sunday */
    weekDay: number;
    /** minute of the day for start (Ex: 02:14 = 2*60 + 14 = 134) */
    startTime: number;
    /** minute of the day to end (Ex: 16:48 = 16*60 + 48 = 1008) */
    endTime: number;
}
export declare class ValidityInfo {
    private type;
    private startDate;
    private endDate;
    private cycles;
    constructor(type?: ValidityType, startDate?: string, endDdate?: string);
    setType(type: ValidityType): void;
    addCycle(cycle: CyclicConfig): boolean;
    setStartDate(startDate: string): boolean;
    setEndDate(endDate: string): boolean;
    getType(): ValidityType;
    getStartDate(): string;
    getStartDateMoment(): moment.Moment;
    getEndDate(): string;
    geetEndDateMoment(): moment.Moment;
    getCycles(): CyclicConfig[];
    isValidCycle(cycle: CyclicConfig): boolean;
}
