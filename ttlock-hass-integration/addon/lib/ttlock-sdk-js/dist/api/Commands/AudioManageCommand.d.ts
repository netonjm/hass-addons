/// <reference types="node" />
import { AudioManage } from "../../constant/AudioManage";
import { CommandType } from "../../constant/CommandType";
import { Command } from "../Command";
export declare class AudioManageCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private opType;
    private opValue?;
    private batteryCapacity?;
    protected processData(): void;
    build(): Buffer;
    setNewValue(opValue: AudioManage.TURN_ON | AudioManage.TURN_OFF): void;
    getValue(): AudioManage.TURN_ON | AudioManage.TURN_OFF | void;
    getBatteryCapacity(): number;
}
