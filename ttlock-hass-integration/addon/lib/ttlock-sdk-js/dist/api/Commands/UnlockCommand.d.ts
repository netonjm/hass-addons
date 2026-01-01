/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export interface UnlockDataInterface {
    uid?: number;
    uniqueid?: number;
    dateTime?: string;
    batteryCapacity?: number;
}
export declare class UnlockCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private sum?;
    private uid?;
    private uniqueid?;
    private dateTime?;
    private batteryCapacity?;
    protected processData(): void;
    build(): Buffer;
    setSum(psFromLock: number, unlockKey: number): void;
    getUnlockData(): UnlockDataInterface;
    getBatteryCapacity(): number;
}
