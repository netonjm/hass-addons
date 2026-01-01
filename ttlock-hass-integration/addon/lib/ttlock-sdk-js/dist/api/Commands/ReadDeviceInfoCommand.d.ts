/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { DeviceInfoEnum } from "../../constant/DeviceInfoEnum";
import { Command } from "../Command";
export declare class ReadDeviceInfoCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private opType;
    protected processData(): void;
    setInfoType(infoType: DeviceInfoEnum): void;
    getInfoData(): Buffer | void;
    build(): Buffer;
}
