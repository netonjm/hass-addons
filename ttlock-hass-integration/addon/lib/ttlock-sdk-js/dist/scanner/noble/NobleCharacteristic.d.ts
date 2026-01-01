/// <reference types="node" />
/// <reference types="node" />
import { Characteristic } from "@abandonware/noble";
import { EventEmitter } from "events";
import { CharacteristicInterface, DescriptorInterface } from "../DeviceInterface";
import { NobleDescriptor } from "./NobleDescriptor";
import { NobleDevice } from "./NobleDevice";
export declare class NobleCharacteristic extends EventEmitter implements CharacteristicInterface {
    uuid: string;
    name?: string | undefined;
    type?: string | undefined;
    properties: string[];
    isReading: boolean;
    lastValue?: Buffer;
    descriptors: Map<string, NobleDescriptor>;
    private device;
    private characteristic;
    constructor(device: NobleDevice, characteristic: Characteristic);
    getUUID(): string;
    discoverDescriptors(): Promise<Map<string, DescriptorInterface>>;
    read(): Promise<Buffer | undefined>;
    write(data: Buffer, withoutResponse: boolean): Promise<boolean>;
    subscribe(): Promise<void>;
    private onRead;
    toJSON(asObject: boolean): string | Object;
    toString(): string;
}
