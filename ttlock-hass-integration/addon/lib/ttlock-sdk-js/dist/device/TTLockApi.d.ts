/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from "events";
import { KeyboardPwdType, TTLockData } from "..";
import { AudioManage } from "../constant/AudioManage";
import { ConfigRemoteUnlock } from "../constant/ConfigRemoteUnlock";
import { FeatureValue } from "../constant/FeatureValue";
import { DeviceInfoType } from "./DeviceInfoType";
import { PrivateDataType } from "./PrivateDataType";
import { TTBluetoothDevice } from "./TTBluetoothDevice";
import { UnlockDataInterface, PassageModeData, KeyboardPassCode, ICCard, Fingerprint, LogEntry } from "../api/Commands";
import { PassageModeOperate } from "../constant/PassageModeOperate";
import { AdminType } from "./AdminType";
import { CodeSecret } from "../api/Commands/InitPasswordsCommand";
import { DeviceInfoEnum } from "../constant/DeviceInfoEnum";
import { LockedStatus } from "../constant/LockedStatus";
export interface PassageModeResponse {
    sequence: number;
    data: PassageModeData[];
}
export interface PassCodesResponse {
    sequence: number;
    data: KeyboardPassCode[];
}
export interface ICCardResponse {
    sequence: number;
    data: ICCard[];
}
export interface FingerprintResponse {
    sequence: number;
    data: Fingerprint[];
}
export interface OperationLogResponse {
    sequence: number;
    data: LogEntry[];
}
export interface LockParamsChanged {
    lockedStatus: boolean;
    newEvents: boolean;
    batteryCapacity: boolean;
}
export declare abstract class TTLockApi extends EventEmitter {
    protected initialized: boolean;
    protected device: TTBluetoothDevice;
    protected adminAuth: boolean;
    protected featureList?: Set<FeatureValue>;
    protected switchState?: any;
    protected lockSound: AudioManage.TURN_ON | AudioManage.TURN_OFF | AudioManage.UNKNOWN;
    protected displayPasscode?: 0 | 1;
    protected autoLockTime: number;
    protected batteryCapacity: number;
    protected rssi: number;
    protected lightingTime?: number;
    protected remoteUnlock?: ConfigRemoteUnlock.OP_OPEN | ConfigRemoteUnlock.OP_CLOSE;
    protected lockedStatus: LockedStatus;
    protected newEvents: boolean;
    protected deviceInfo?: DeviceInfoType;
    protected operationLog: LogEntry[];
    protected privateData: PrivateDataType;
    constructor(device: TTBluetoothDevice, data?: TTLockData);
    updateFromTTDevice(): void;
    updateLockData(data: TTLockData): void;
    /**
     * Send init command
     */
    protected initCommand(): Promise<void>;
    /**
     * Send get AESKey command
     */
    protected getAESKeyCommand(): Promise<Buffer>;
    /**
     * Send AddAdmin command
     */
    protected addAdminCommand(aesKey?: Buffer): Promise<AdminType>;
    /**
     * Send CalibrationTime command
     */
    protected calibrateTimeCommand(aesKey?: Buffer): Promise<void>;
    /**
     * Send SearchDeviceFeature command
     */
    protected searchDeviceFeatureCommand(aesKey?: Buffer): Promise<Set<FeatureValue>>;
    protected getSwitchStateCommand(newValue?: any, aesKey?: Buffer): Promise<void>;
    /**
     * Send AudioManage command to get or set the audio feedback
     */
    protected audioManageCommand(newValue?: AudioManage.TURN_ON | AudioManage.TURN_OFF, aesKey?: Buffer): Promise<AudioManage.TURN_ON | AudioManage.TURN_OFF>;
    /**
     * Send ScreenPasscodeManage command to get or set password display
     */
    protected screenPasscodeManageCommand(newValue?: 0 | 1, aesKey?: Buffer): Promise<0 | 1>;
    protected searchAutoLockTimeCommand(newValue?: any, aesKey?: Buffer): Promise<number>;
    protected controlLampCommand(newValue?: any, aesKey?: Buffer): Promise<number | undefined>;
    protected getAdminCodeCommand(aesKey?: Buffer): Promise<string>;
    /**
     * Send SetAdminKeyboardPwd
     */
    protected setAdminKeyboardPwdCommand(adminPasscode?: string, aesKey?: Buffer): Promise<string>;
    /**
     * Send InitPasswords command
     */
    protected initPasswordsCommand(aesKey?: Buffer): Promise<CodeSecret[]>;
    /**
     * Send ControlRemoteUnlock command to activate or disactivate remote unlock (via gateway?)
     */
    protected controlRemoteUnlockCommand(newValue?: ConfigRemoteUnlock.OP_CLOSE | ConfigRemoteUnlock.OP_OPEN, aesKey?: Buffer): Promise<ConfigRemoteUnlock.OP_CLOSE | ConfigRemoteUnlock.OP_OPEN>;
    /**
     * Send OperateFinished command
     */
    protected operateFinishedCommand(aesKey?: Buffer): Promise<void>;
    protected readDeviceInfoCommand(infoType: DeviceInfoEnum, aesKey?: Buffer): Promise<Buffer>;
    protected checkAdminCommand(aesKey?: Buffer): Promise<number>;
    protected checkRandomCommand(psFromLock: number, aesKey?: Buffer): Promise<void>;
    protected resetLockCommand(aesKey?: Buffer): Promise<void>;
    protected checkUserTime(startDate?: string, endDate?: string, aesKey?: Buffer): Promise<number>;
    protected unlockCommand(psFromLock: number, aesKey?: Buffer): Promise<UnlockDataInterface>;
    protected lockCommand(psFromLock: number, aesKey?: Buffer): Promise<UnlockDataInterface>;
    protected getPassageModeCommand(sequence?: number, aesKey?: Buffer): Promise<PassageModeResponse>;
    protected setPassageModeCommand(data: PassageModeData, type?: PassageModeOperate.ADD | PassageModeOperate.DELETE, aesKey?: Buffer): Promise<boolean>;
    protected clearPassageModeCommand(aesKey?: Buffer): Promise<boolean>;
    protected searchBycicleStatusCommand(aesKey?: Buffer): Promise<number>;
    protected createCustomPasscodeCommand(type: KeyboardPwdType, passCode: string, startDate?: string, endDate?: string, aesKey?: Buffer): Promise<boolean>;
    protected updateCustomPasscodeCommand(type: KeyboardPwdType, oldPassCode: string, newPassCode: string, startDate?: string, endDate?: string, aesKey?: Buffer): Promise<boolean>;
    protected deleteCustomPasscodeCommand(type: KeyboardPwdType, passCode: string, aesKey?: Buffer): Promise<boolean>;
    protected clearCustomPasscodesCommand(aesKey?: Buffer): Promise<boolean>;
    protected getCustomPasscodesCommand(sequence?: number, aesKey?: Buffer): Promise<PassCodesResponse>;
    protected getICCommand(sequence?: number, aesKey?: Buffer): Promise<ICCardResponse>;
    protected addICCommand(cardNumber?: string, startDate?: string, endDate?: string, aesKey?: Buffer): Promise<string>;
    protected updateICCommand(cardNumber: string, startDate: string, endDate: string, aesKey?: Buffer): Promise<boolean>;
    protected deleteICCommand(cardNumber: string, aesKey?: Buffer): Promise<boolean>;
    protected clearICCommand(aesKey?: Buffer): Promise<boolean>;
    protected getFRCommand(sequence?: number, aesKey?: Buffer): Promise<FingerprintResponse>;
    protected addFRCommand(aesKey?: Buffer): Promise<string>;
    protected updateFRCommand(fpNumber: string, startDate: string, endDate: string, aesKey?: Buffer): Promise<boolean>;
    protected deleteFRCommand(fpNumber: string, aesKey?: Buffer): Promise<boolean>;
    protected clearFRCommand(aesKey?: Buffer): Promise<boolean>;
    protected getOperationLogCommand(sequence?: number, aesKey?: Buffer): Promise<OperationLogResponse>;
    protected macro_readAllDeviceInfo(aesKey?: Buffer): Promise<DeviceInfoType>;
    protected macro_adminLogin(): Promise<boolean>;
}
