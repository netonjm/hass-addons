import { Service } from "@abandonware/noble";
import { CharacteristicInterface, ServiceInterface } from "../DeviceInterface";
import { NobleCharacteristic } from "./NobleCharacteristic";
import { NobleDevice } from "./NobleDevice";
export declare class NobleService implements ServiceInterface {
    uuid: string;
    name: string;
    type: string;
    includedServiceUuids: string[];
    characteristics: Map<string, NobleCharacteristic>;
    private device;
    private service;
    constructor(device: NobleDevice, service: Service);
    getUUID(): string;
    discoverCharacteristics(): Promise<Map<string, CharacteristicInterface>>;
    readCharacteristics(): Promise<Map<string, CharacteristicInterface>>;
    toJSON(asObject: boolean): string | Object;
    toString(): string;
}
