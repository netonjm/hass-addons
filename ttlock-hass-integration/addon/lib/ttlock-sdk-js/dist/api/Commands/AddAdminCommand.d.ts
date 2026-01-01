/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export declare class AddAdminCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private adminPs?;
    private unlockKey?;
    generateNumber(): number;
    setAdminPs(adminPassword?: number): number;
    getAdminPs(): number | undefined;
    setUnlockKey(unlockNumber?: number): number;
    getUnlockKey(): number | undefined;
    protected processData(): void;
    build(): Buffer;
}
