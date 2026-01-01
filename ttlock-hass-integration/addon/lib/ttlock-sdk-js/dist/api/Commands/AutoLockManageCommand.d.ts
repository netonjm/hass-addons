/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export declare class AutoLockManageCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private opType;
    private opValue?;
    private batteryCapacity?;
    protected processData(): void;
    build(): Buffer;
    setTime(opValue: number): void;
    getTime(): number;
    getBatteryCapacity(): number;
}
