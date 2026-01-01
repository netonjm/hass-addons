/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export declare class AESKeyCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private aesKey?;
    protected processData(): void;
    build(): Buffer;
    setAESKey(key: Buffer): void;
    getAESKey(): Buffer | void;
}
