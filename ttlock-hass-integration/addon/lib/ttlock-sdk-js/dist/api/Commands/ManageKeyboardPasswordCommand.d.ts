/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { KeyboardPwdType } from "../../constant/KeyboardPwdType";
import { PwdOperateType } from "../../constant/PwdOperateType";
import { Command } from "../Command";
export declare class ManageKeyboardPasswordCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private opType;
    private type?;
    private oldPassCode?;
    private passCode?;
    private startDate?;
    private endDate?;
    protected processData(): void;
    build(): Buffer;
    getOpType(): PwdOperateType;
    addPasscode(type: KeyboardPwdType, passCode: string, startDate?: string, endDate?: string): boolean;
    updatePasscode(type: KeyboardPwdType, oldPassCode: string, newPassCode: string, startDate?: string, endDate?: string): boolean;
    deletePasscode(type: KeyboardPwdType, oldPassCode: string): boolean;
    clearAllPasscodes(): void;
    private buildAdd;
    private buildDel;
    private buildEdit;
}
