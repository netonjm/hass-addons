/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from "events";
export declare class NobleWebsocketBinding extends EventEmitter {
    private ws;
    private auth;
    private wasReady;
    private buffer;
    private startScanCommand;
    private peripherals;
    private aesKey;
    private credentials;
    constructor(address: string, port: number, key: string, user: string, pass: string);
    init(): void;
    private onOpen;
    private onClose;
    private onMessage;
    private sendCommand;
    startScanning(serviceUuids: string[], allowDuplicates?: boolean): void;
    stopScanning(): void;
    connect(deviceUuid: string): void;
    disconnect(deviceUuid: string): void;
    updateRssi(deviceUuid: string): void;
    discoverServices(deviceUuid: string, uuids: string[]): void;
    discoverIncludedServices(deviceUuid: string, serviceUuid: string, serviceUuids: string[]): void;
    discoverCharacteristics(deviceUuid: string, serviceUuid: string, characteristicUuids: string[]): void;
    read(deviceUuid: string, serviceUuid: string, characteristicUuid: string): void;
    write(deviceUuid: string, serviceUuid: string, characteristicUuid: string, data: Buffer, withoutResponse: boolean): void;
    broadcast(deviceUuid: string, serviceUuid: string, characteristicUuid: string, broadcast: any): void;
    notify(deviceUuid: string, serviceUuid: string, characteristicUuid: string, notify: any): void;
    discoverDescriptors(deviceUuid: string, serviceUuid: string, characteristicUuid: string): void;
    readValue(deviceUuid: string, serviceUuid: string, characteristicUuid: string, descriptorUuid: string): void;
    writeValue(deviceUuid: string, serviceUuid: string, characteristicUuid: string, descriptorUuid: string, data: Buffer): void;
    readHandle(deviceUuid: string, handle: any): void;
    writeHandle(deviceUuid: string, handle: any, data: Buffer, withoutResponse: boolean): void;
}
