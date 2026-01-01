/// <reference types="node" />
import { EventEmitter } from "events";
import { LockType } from "../constant/Lock";
export declare class TTDevice extends EventEmitter {
    id: string;
    uuid: string;
    name: string;
    manufacturer: string;
    model: string;
    hardware: string;
    firmware: string;
    address: string;
    rssi: number;
    /** @type {byte} */
    protocolType: number;
    /** @type {byte} */
    protocolVersion: number;
    /** @type {byte} */
    scene: number;
    /** @type {byte} */
    groupId: number;
    /** @type {byte} */
    orgId: number;
    /** @type {byte} */
    lockType: LockType;
    isTouch: boolean;
    isUnlock: boolean;
    hasEvents: boolean;
    isSettingMode: boolean;
    /** @type {byte} */
    txPowerLevel: number;
    /** @type {byte} */
    batteryCapacity: number;
    /** @type {number} */
    date: number;
    isWristband: boolean;
    isRoomLock: boolean;
    isSafeLock: boolean;
    isBicycleLock: boolean;
    isLockcar: boolean;
    isGlassLock: boolean;
    isPadLock: boolean;
    isCyLinder: boolean;
    isRemoteControlDevice: boolean;
    isDfuMode: boolean;
    isNoLockService: boolean;
    remoteUnlockSwitch: number;
    disconnectStatus: number;
    parkStatus: number;
    toJSON(asObject?: boolean): string | Object;
}
