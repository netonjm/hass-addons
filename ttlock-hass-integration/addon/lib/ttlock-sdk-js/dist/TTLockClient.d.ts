/// <reference types="node" />
import events from "events";
import { TTLock } from "./device/TTLock";
import { BluetoothLeService, ScannerType } from "./scanner/BluetoothLeService";
import { ScannerOptions } from "./scanner/ScannerInterface";
import { TTLockData } from "./store/TTLockData";
export interface Settings {
    uuids?: string[];
    scannerType?: ScannerType;
    scannerOptions?: ScannerOptions;
    lockData?: TTLockData[];
}
export interface TTLockClient {
    on(event: "ready", listener: () => void): this;
    on(event: "foundLock", listener: (lock: TTLock) => void): this;
    on(event: "scanStart", listener: () => void): this;
    on(event: "scanStop", listener: () => void): this;
    on(event: "updatedLockData", listener: () => void): this;
    on(event: "monitorStart", listener: () => void): this;
    on(event: "monitorStop", listener: () => void): this;
}
export declare class TTLockClient extends events.EventEmitter implements TTLockClient {
    bleService: BluetoothLeService | null;
    uuids: string[];
    scannerType: ScannerType;
    scannerOptions: ScannerOptions;
    lockData: Map<string, TTLockData>;
    private adapterReady;
    private lockDevices;
    private scanning;
    private monitoring;
    constructor(options: Settings);
    prepareBTService(): Promise<boolean>;
    stopBTService(): boolean;
    startScanLock(): Promise<boolean>;
    stopScanLock(): Promise<boolean>;
    startMonitor(): Promise<boolean>;
    stopMonitor(): Promise<boolean>;
    isScanning(): boolean;
    isMonitoring(): boolean;
    getLockData(): TTLockData[];
    setLockData(newLockData: TTLockData[]): void;
    private onScanStart;
    private onScanStop;
    private onScanResult;
}
