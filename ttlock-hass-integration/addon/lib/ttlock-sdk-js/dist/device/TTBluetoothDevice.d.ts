/// <reference types="node" />
import { CommandEnvelope } from "../api/CommandEnvelope";
import { DeviceInterface } from "../scanner/DeviceInterface";
import { ScannerInterface } from "../scanner/ScannerInterface";
import { TTDevice } from "./TTDevice";
export interface TTBluetoothDevice {
    on(event: "connected", listener: () => void): this;
    on(event: "disconnected", listener: () => void): this;
    on(event: "updated", listener: () => void): this;
    on(event: "dataReceived", listener: (command: CommandEnvelope) => void): this;
}
export declare class TTBluetoothDevice extends TTDevice implements TTBluetoothDevice {
    device?: DeviceInterface;
    connected: boolean;
    incomingDataBuffer: Buffer;
    private scanner;
    private waitingForResponse;
    private responses;
    private constructor();
    static createFromDevice(device: DeviceInterface, scanner: ScannerInterface): TTBluetoothDevice;
    updateFromDevice(device?: DeviceInterface): void;
    connect(): Promise<boolean>;
    private onDeviceConnected;
    private onDeviceDisconnected;
    private readBasicInfo;
    private subscribe;
    sendCommand(command: CommandEnvelope, waitForResponse?: boolean, ignoreCrc?: boolean): Promise<CommandEnvelope | void>;
    /**
     *
     * @param timeout Timeout to wait in ms
     */
    waitForResponse(timeout?: number): Promise<CommandEnvelope | undefined>;
    private writeCharacteristic;
    private onIncomingData;
    private readDeviceResponse;
    private putCharacteristicValue;
    disconnect(): Promise<void>;
    parseManufacturerData(manufacturerData: Buffer): void;
}
