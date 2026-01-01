/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export declare class CheckAdminCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private uid;
    private adminPs?;
    private lockFlagPos;
    protected processData(): void;
    build(): Buffer;
    setParams(adminPs: number): void;
    getPsFromLock(): number;
}
