/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { PassageModeOperate } from "../../constant/PassageModeOperate";
import { PassageModeType } from "../../constant/PassageModeType";
import { Command } from "../Command";
export interface PassageModeData {
    type: PassageModeType;
    /** 1..7 (Monday..Sunday) 0: means ervery day */
    weekOrDay: number;
    /** month repeat */
    month: number;
    /** HHMM 0:0 means all day*/
    startHour: string;
    /** HHMM */
    endHour: string;
}
export declare class PassageModeCommand extends Command {
    static COMMAND_TYPE: CommandType;
    opType: PassageModeOperate;
    sequence?: number;
    dataOut?: PassageModeData[];
    dataIn?: PassageModeData;
    protected processData(): void;
    build(): Buffer;
    setSequence(sequence?: number): void;
    getSequence(): number;
    setData(data: PassageModeData, type?: PassageModeOperate.ADD | PassageModeOperate.DELETE): void;
    setClear(): void;
    getData(): PassageModeData[];
}
