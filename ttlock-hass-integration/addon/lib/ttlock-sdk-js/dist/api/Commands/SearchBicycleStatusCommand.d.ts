/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export declare class SearchBicycleStatusCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private lockStatus?;
    protected processData(): void;
    build(): Buffer;
    getLockStatus(): number;
}
