/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { ConfigRemoteUnlock } from "../../constant/ConfigRemoteUnlock";
import { Command } from "../Command";
export declare class ControlRemoteUnlockCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private opType;
    private opValue?;
    private batteryCapacity?;
    protected processData(): void;
    build(): Buffer;
    setNewValue(opValue: ConfigRemoteUnlock.OP_CLOSE | ConfigRemoteUnlock.OP_OPEN): void;
    getValue(): ConfigRemoteUnlock.OP_CLOSE | ConfigRemoteUnlock.OP_OPEN | void;
    getBatteryCapacity(): number;
}
