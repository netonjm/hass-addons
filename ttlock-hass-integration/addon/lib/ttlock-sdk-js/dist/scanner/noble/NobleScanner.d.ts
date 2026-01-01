/// <reference types="node" />
import { ScannerInterface, ScannerStateType } from "../ScannerInterface";
import nobleObj from "@abandonware/noble";
import { EventEmitter } from "events";
type nobleStateType = "unknown" | "resetting" | "unsupported" | "unauthorized" | "poweredOff" | "poweredOn";
export declare class NobleScanner extends EventEmitter implements ScannerInterface {
    uuids: string[];
    scannerState: ScannerStateType;
    private nobleState;
    private devices;
    protected noble?: typeof nobleObj;
    constructor(uuids?: string[]);
    protected createNoble(): void;
    protected initNoble(): void;
    getState(): ScannerStateType;
    startScan(passive: boolean): Promise<boolean>;
    stopScan(): Promise<boolean>;
    private startNobleScan;
    private stopNobleScan;
    protected onNobleStateChange(state: nobleStateType): void;
    protected onNobleDiscover(peripheral: nobleObj.Peripheral): Promise<void>;
    protected checkPeripheralAdvertisement(peripheral: nobleObj.Peripheral): boolean;
    protected onNobleScanStart(): void;
    protected onNobleScanStop(): void;
}
export {};
