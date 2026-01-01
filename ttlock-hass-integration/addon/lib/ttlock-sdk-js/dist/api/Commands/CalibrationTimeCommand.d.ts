/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export declare class CalibrationTimeCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private time?;
    protected processData(): void;
    build(): Buffer;
}
