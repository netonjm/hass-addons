/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export declare class SetAdminKeyboardPwdCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private adminPasscode?;
    protected processData(): void;
    build(): Buffer;
    setAdminPasscode(adminPasscode: string): void;
    getAdminPasscode(): string | void;
}
