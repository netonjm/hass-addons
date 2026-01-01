/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export declare class CheckRandomCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private sum?;
    protected processData(): void;
    build(): Buffer;
    setSum(psFromLock: number, unlockKey: number): void;
}
