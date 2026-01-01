/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export declare class CheckUserTimeCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private uid?;
    private startDate?;
    private endDate?;
    private lockFlagPos?;
    protected processData(): void;
    build(): Buffer;
    setPayload(uid: number, startDate: string, endDate: string, lockFlagPos: number): void;
    getPsFromLock(): number;
}
