/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { LogOperate } from "../../constant/LogOperate";
import { Command } from "../Command";
export interface LogEntry {
    recordNumber: number;
    recordType: LogOperate;
    recordId?: number;
    uid?: number;
    password?: string;
    newPassword?: string;
    operateDate: string;
    deleteDate?: string;
    electricQuantity: number;
    accessoryElectricQuantity?: number;
    keyId?: number;
}
export declare class OperationLogCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private sequence?;
    private logs?;
    protected processData(): void;
    build(): Buffer;
    setSequence(sequence: number): void;
    getSequence(): number;
    getLogs(): LogEntry[];
}
