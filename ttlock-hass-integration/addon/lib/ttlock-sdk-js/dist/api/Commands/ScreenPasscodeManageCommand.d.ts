/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export declare class ScreenPasscodeManageCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private opType;
    private opValue?;
    protected processData(): void;
    build(): Buffer;
    setNewValue(opValue: 0 | 1): void;
    getValue(): 0 | 1 | void;
}
