/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export declare class ResetLockCommand extends Command {
    static COMMAND_TYPE: CommandType;
    protected processData(): void;
    build(): Buffer;
}
