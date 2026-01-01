/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { KeyboardPwdType } from "../../constant/KeyboardPwdType";
import { Command } from "../Command";
export interface KeyboardPassCode {
    type: KeyboardPwdType;
    newPassCode: string;
    passCode: string;
    startDate?: string;
    endDate?: string;
}
export declare class GetKeyboardPasswordsCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private sequence?;
    private passCodes?;
    protected processData(): void;
    build(): Buffer;
    setSequence(sequence?: number): void;
    getSequence(): number;
    getPasscodes(): KeyboardPassCode[];
}
