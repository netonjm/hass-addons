/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { ICOperate } from "../../constant/ICOperate";
import { Command } from "../Command";
export interface Fingerprint {
    fpNumber: string;
    startDate: string;
    endDate: string;
}
export declare class ManageFRCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private opType?;
    private sequence?;
    private fingerprints?;
    private fpNumber?;
    private startDate?;
    private endDate?;
    private batteryCapacity?;
    protected processData(): void;
    build(): Buffer;
    getType(): ICOperate;
    getFpNumber(): string;
    setSequence(sequence?: number): void;
    getSequence(): number;
    setAdd(): void;
    setModify(fpNumber: string, startDate: string, endDate: string): void;
    setDelete(fpNumber: string): void;
    setClear(): void;
    getFingerprints(): Fingerprint[];
    getBatteryCapacity(): number;
}
