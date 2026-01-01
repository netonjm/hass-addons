import { Fingerprint, ICCard, KeyboardPassCode, LogEntry, PassageModeData } from "../api/Commands";
import { AudioManage } from "../constant/AudioManage";
import { ConfigRemoteUnlock } from "../constant/ConfigRemoteUnlock";
import { KeyboardPwdType } from "../constant/KeyboardPwdType";
import { LockedStatus } from "../constant/LockedStatus";
import { TTLockData } from "../store/TTLockData";
import { TTBluetoothDevice } from "./TTBluetoothDevice";
import { LockParamsChanged, TTLockApi } from "./TTLockApi";
export interface TTLock {
    /** Event used by TTLockClient to update it's internal lock data */
    on(event: "dataUpdated", listener: (lock: TTLock) => void): this;
    on(event: "updated", listener: (lock: TTLock, paramsChanged: LockParamsChanged) => void): this;
    on(event: "lockReset", listener: (address: string, id: string) => void): this;
    on(event: "connected", listener: (lock: TTLock) => void): this;
    on(event: "disconnected", listener: (lock: TTLock) => void): this;
    on(event: "locked", listener: (lock: TTLock) => void): this;
    on(event: "unlocked", listener: (lock: TTLock) => void): this;
    /** Emited when an IC Card is ready to be scanned */
    on(event: "scanICStart", listener: (lock: TTLock) => void): this;
    /** Emited when a fingerprint is ready to be scanned */
    on(event: "scanFRStart", listener: (lock: TTLock) => void): this;
    /** Emited after each fingerprint scan */
    on(event: "scanFRProgress", listener: (lock: TTLock) => void): this;
}
export declare class TTLock extends TTLockApi implements TTLock {
    private connected;
    private skipDataRead;
    private connecting;
    constructor(device: TTBluetoothDevice, data?: TTLockData);
    getAddress(): string;
    getName(): string;
    getManufacturer(): string;
    getModel(): string;
    getFirmware(): string;
    getBattery(): number;
    getRssi(): number;
    connect(skipDataRead?: boolean, timeout?: number): Promise<boolean>;
    isConnected(): boolean;
    disconnect(): Promise<void>;
    isInitialized(): boolean;
    isPaired(): boolean;
    hasLockSound(): boolean;
    hasPassCode(): boolean;
    hasICCard(): boolean;
    hasFingerprint(): boolean;
    hasAutolock(): boolean;
    hasNewEvents(): boolean;
    /**
     * Initialize and pair with a new lock
     */
    initLock(): Promise<boolean>;
    /**
     * Lock the lock
     */
    lock(): Promise<boolean>;
    /**
     * Unlock the lock
     */
    unlock(): Promise<boolean>;
    /**
     * Get the status of the lock (locked or unlocked)
     */
    getLockStatus(noCache?: boolean): Promise<LockedStatus>;
    getAutolockTime(noCache?: boolean): Promise<number>;
    setAutoLockTime(autoLockTime: number): Promise<boolean>;
    getLockSound(noCache?: boolean): Promise<AudioManage>;
    setLockSound(lockSound: AudioManage.TURN_ON | AudioManage.TURN_OFF): Promise<boolean>;
    resetLock(): Promise<boolean>;
    getPassageMode(): Promise<PassageModeData[]>;
    setPassageMode(data: PassageModeData): Promise<boolean>;
    deletePassageMode(data: PassageModeData): Promise<boolean>;
    clearPassageMode(): Promise<boolean>;
    /**
     * Add a new passcode to unlock
     * @param type PassCode type: 1 - permanent, 2 - one time, 3 - limited time
     * @param passCode 4-9 digits code
     * @param startDate Valid from YYYYMMDDHHmm
     * @param endDate Valid to YYYYMMDDHHmm
     */
    addPassCode(type: KeyboardPwdType, passCode: string, startDate?: string, endDate?: string): Promise<boolean>;
    /**
     * Update a passcode to unlock
     * @param type PassCode type: 1 - permanent, 2 - one time, 3 - limited time
     * @param oldPassCode 4-9 digits code - old code
     * @param newPassCode 4-9 digits code - new code
     * @param startDate Valid from YYYYMMDDHHmm
     * @param endDate Valid to YYYYMMDDHHmm
     */
    updatePassCode(type: KeyboardPwdType, oldPassCode: string, newPassCode: string, startDate?: string, endDate?: string): Promise<boolean>;
    /**
     * Delete a set passcode
     * @param type PassCode type: 1 - permanent, 2 - one time, 3 - limited time
     * @param passCode 4-9 digits code
     */
    deletePassCode(type: KeyboardPwdType, passCode: string): Promise<boolean>;
    /**
     * Remove all stored passcodes
     */
    clearPassCodes(): Promise<boolean>;
    /**
     * Get all valid passcodes
     */
    getPassCodes(): Promise<KeyboardPassCode[]>;
    /**
     * Add an IC Card
     * @param startDate Valid from YYYYMMDDHHmm
     * @param endDate Valid to YYYYMMDDHHmm
     * @param cardNumber serial number of an already known card
     * @returns serial number of the card that was added
     */
    addICCard(startDate: string, endDate: string, cardNumber?: string): Promise<string>;
    /**
     * Update an IC Card
     * @param cardNumber Serial number of the card
     * @param startDate Valid from YYYYMMDDHHmm
     * @param endDate Valid to YYYYMMDDHHmm
     */
    updateICCard(cardNumber: string, startDate: string, endDate: string): Promise<boolean>;
    /**
     * Delete an IC Card
     * @param cardNumber Serial number of the card
     */
    deleteICCard(cardNumber: string): Promise<boolean>;
    /**
     * Clear all IC Card data
     */
    clearICCards(): Promise<boolean>;
    /**
     * Get all valid IC cards and their validity interval
     */
    getICCards(): Promise<ICCard[]>;
    /**
     * Add a Fingerprint
     * @param startDate Valid from YYYYMMDDHHmm
     * @param endDate Valid to YYYYMMDDHHmm
     * @returns serial number of the firngerprint that was added
     */
    addFingerprint(startDate: string, endDate: string): Promise<string>;
    /**
     * Update a fingerprint
     * @param fpNumber Serial number of the fingerprint
     * @param startDate Valid from YYYYMMDDHHmm
     * @param endDate Valid to YYYYMMDDHHmm
     */
    updateFingerprint(fpNumber: string, startDate: string, endDate: string): Promise<boolean>;
    /**
     * Delete a fingerprint
     * @param fpNumber Serial number of the fingerprint
     */
    deleteFingerprint(fpNumber: string): Promise<boolean>;
    /**
     * Clear all fingerprint data
     */
    clearFingerprints(): Promise<boolean>;
    /**
     * Get all valid IC cards and their validity interval
     */
    getFingerprints(): Promise<Fingerprint[]>;
    /**
     * No ideea what this does ...
     * @param type
     */
    setRemoteUnlock(type?: ConfigRemoteUnlock.OP_CLOSE | ConfigRemoteUnlock.OP_OPEN): Promise<ConfigRemoteUnlock.OP_CLOSE | ConfigRemoteUnlock.OP_OPEN | undefined>;
    getOperationLog(all?: boolean, noCache?: boolean): Promise<LogEntry[]>;
    private onDataReceived;
    private onConnected;
    private onDisconnected;
    private onTTDeviceUpdated;
    getLockData(): TTLockData | void;
    /** Just for debugging */
    toJSON(asObject?: boolean): string | Object;
}
