/// <reference types="node" />
/// <reference types="node" />
import { Descriptor } from "@abandonware/noble";
import { EventEmitter } from "events";
import { DescriptorInterface } from "../DeviceInterface";
import { NobleDevice } from "./NobleDevice";
export declare class NobleDescriptor extends EventEmitter implements DescriptorInterface {
    uuid: string;
    name?: string | undefined;
    type?: string | undefined;
    isReading: boolean;
    lastValue?: Buffer;
    private device;
    private descriptor;
    constructor(device: NobleDevice, descriptor: Descriptor);
    readValue(): Promise<Buffer | undefined>;
    writeValue(data: Buffer): Promise<void>;
    private onRead;
    toJSON(asObject?: boolean): string | {
        uuid: string;
        name: string | undefined;
        type: string | undefined;
        value: string | undefined;
    };
    toString(): string;
}
