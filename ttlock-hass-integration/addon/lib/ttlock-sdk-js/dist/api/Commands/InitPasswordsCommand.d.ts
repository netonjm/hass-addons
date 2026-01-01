/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export interface CodeSecret {
    year: number;
    code: number;
    secret: string;
}
export declare class InitPasswordsCommand extends Command {
    static COMMAND_TYPE: CommandType;
    protected pwdInfo?: CodeSecret[];
    protected processData(): void;
    build(): Buffer;
    getPwdInfo(): CodeSecret[] | void;
    private generateCodeSecret;
    private combineCodeSecret;
    private calculateYear;
}
