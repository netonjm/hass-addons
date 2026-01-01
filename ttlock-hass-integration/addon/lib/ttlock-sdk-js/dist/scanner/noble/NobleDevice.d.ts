/// <reference types="node" />
/// <reference types="node" />
import { DeviceInterface, ServiceInterface } from "../DeviceInterface";
import { Peripheral } from "@abandonware/noble";
import { EventEmitter } from "events";
import { NobleService } from "./NobleService";
export declare class NobleDevice extends EventEmitter implements DeviceInterface {
    id: string;
    uuid: string;
    name: string;
    address: string;
    addressType: string;
    connectable: boolean;
    connecting: boolean;
    connected: boolean;
    rssi: number;
    mtu: number;
    manufacturerData: Buffer;
    services: Map<string, NobleService>;
    busy: boolean;
    private peripheral;
    constructor(peripheral: Peripheral);
    updateFromPeripheral(): void;
    checkBusy(): boolean;
    resetBusy(): boolean;
    connect(timeout?: number): Promise<boolean>;
    disconnect(): Promise<boolean>;
    /**
     * Discover all services, characteristics and descriptors
     */
    discoverAll(): Promise<Map<string, ServiceInterface>>;
    /**
     * Discover services only
     */
    discoverServices(): Promise<Map<string, ServiceInterface>>;
    /**
     * Read all available characteristics
     */
    readCharacteristics(): Promise<boolean>;
    onConnect(error: string): void;
    onDisconnect(error: string): void;
    toString(): string;
    toJSON(asObject?: boolean): string | Object;
}
