/// <reference types="node" />
import { CommandType } from "../constant/CommandType";
import { LockType, LockVersion } from "../constant/Lock";
import { Command } from "./Command";
export declare class CommandEnvelope {
    static APP_COMMAND: number;
    private header;
    private protocol_type;
    private sub_version;
    private scene;
    private organization;
    private sub_organization;
    private commandType;
    private encrypt;
    private data?;
    private lockType;
    private aesKey?;
    private command?;
    private crc;
    private crcok;
    /**
     * Create a command from raw data usually received from characteristic change
     * @param rawData
     */
    static createFromRawData(rawData: Buffer, aesKey?: Buffer): CommandEnvelope;
    /**
     * Create new command starting from the version of the device
     * @param lockVersion
     */
    static createFromLockVersion(lockVersion: LockVersion, aesKey?: Buffer): CommandEnvelope;
    static createFromLockType(lockType: LockType, aesKey?: Buffer): CommandEnvelope;
    private constructor();
    /**
     * Maybe combine with ExtendedBluetoothDevice::getLockType
     */
    private generateLockType;
    setAesKey(aesKey: Buffer): void;
    setLockType(lockType: LockType): void;
    getLockType(): LockType;
    setCommandType(command: CommandType): void;
    getCommandType(): CommandType;
    getCommand(): Command;
    getCrc(): number;
    isCrcOk(): boolean;
    private getData;
    buildCommandBuffer(): Buffer;
    /**
     * Generate the command from the commandType and data
     *
     * Command should be built when
     * - creating the envelope from data (received command/response) but only after having the aesKey
     * - creating a new envelope and we have the commandType and aesKey
     *
     */
    private generateCommand;
    clearLockData(): void;
}
