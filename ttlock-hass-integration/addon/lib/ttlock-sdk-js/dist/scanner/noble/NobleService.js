'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NobleService = void 0;
const NobleCharacteristic_1 = require("./NobleCharacteristic");
class NobleService {
    constructor(device, service) {
        this.characteristics = new Map();
        this.device = device;
        this.service = service;
        this.uuid = service.uuid;
        this.name = service.name;
        this.type = service.type;
        this.includedServiceUuids = service.includedServiceUuids;
        // also add characteristics if they exist
        if (service.characteristics && service.characteristics.length > 0) {
            this.characteristics = new Map();
            service.characteristics.forEach((characteristic) => {
                const c = new NobleCharacteristic_1.NobleCharacteristic(this.device, characteristic);
                this.characteristics.set(c.getUUID(), c);
            });
        }
    }
    getUUID() {
        if (this.uuid.length > 4) {
            return this.uuid.replace("-0000-1000-8000-00805f9b34fb", "").replace("0000", "");
        }
        return this.uuid;
    }
    async discoverCharacteristics() {
        try {
            this.characteristics = new Map();
            this.device.checkBusy();
            const characteristics = await this.service.discoverCharacteristicsAsync();
            this.device.resetBusy();
            characteristics.forEach((characteristic) => {
                const c = new NobleCharacteristic_1.NobleCharacteristic(this.device, characteristic);
                this.characteristics.set(c.getUUID(), c);
            });
            return this.characteristics;
        }
        catch (error) {
            console.error(error);
            this.device.resetBusy();
            return new Map();
        }
    }
    async readCharacteristics() {
        if (this.characteristics.size == 0) {
            await this.discoverCharacteristics();
        }
        for (let [uuid, characteristic] of this.characteristics) {
            await characteristic.read();
        }
        return this.characteristics;
    }
    toJSON(asObject) {
        let json = {
            uuid: this.uuid,
            name: this.name,
            type: this.type,
            characteristics: {}
        };
        this.characteristics.forEach((characteristic) => {
            json.characteristics[characteristic.uuid] = characteristic.toJSON(true);
        });
        if (asObject) {
            return json;
        }
        else {
            return JSON.stringify(json);
        }
    }
    toString() {
        return this.service.toString();
    }
}
exports.NobleService = NobleService;
