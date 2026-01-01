/// <reference types="node" />
import { CommandResponse } from "../constant/CommandResponse";
import { CommandType } from "../constant/CommandType";
export interface CommandInterface {
    readonly COMMAND_TYPE: CommandType;
    new (data: Buffer): Command;
}
export declare abstract class Command {
    protected commandResponse: CommandResponse;
    protected commandData?: Buffer;
    protected commandRawData?: Buffer;
    constructor(data?: Buffer);
    getResponse(): CommandResponse;
    getRawData(): Buffer | void;
    protected abstract processData(): void;
    abstract build(): Buffer;
}
