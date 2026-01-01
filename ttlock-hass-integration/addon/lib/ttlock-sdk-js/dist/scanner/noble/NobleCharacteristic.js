'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NobleCharacteristic = void 0;
const events_1 = require("events");
const timingUtil_1 = require("../../util/timingUtil");
const NobleDescriptor_1 = require("./NobleDescriptor");
class NobleCharacteristic extends events_1.EventEmitter {
    constructor(device, characteristic) {
        super();
        this.isReading = false;
        this.descriptors = new Map();
        this.device = device;
        this.characteristic = characteristic;
        this.uuid = characteristic.uuid;
        this.name = characteristic.name;
        this.type = characteristic.type;
        this.properties = characteristic.properties;
        this.characteristic.on("read", this.onRead.bind(this));
    }
    getUUID() {
        if (this.uuid.length > 4) {
            return this.uuid.replace("-0000-1000-8000-00805f9b34fb", "").replace("0000", "");
        }
        return this.uuid;
    }
    async discoverDescriptors() {
        this.device.checkBusy();
        if (!this.device.connected) {
            this.device.resetBusy();
            throw new Error("NobleDevice is not connected");
        }
        try {
            const descriptors = await this.characteristic.discoverDescriptorsAsync();
            this.descriptors = new Map();
            descriptors.forEach((descriptor) => {
                this.descriptors.set(descriptor.uuid, new NobleDescriptor_1.NobleDescriptor(this.device, descriptor));
            });
        }
        catch (error) {
            console.error(error);
        }
        this.device.resetBusy();
        return this.descriptors;
    }
    async read() {
        if (!this.properties.includes("read")) {
            return;
        }
        this.device.checkBusy();
        if (!this.device.connected) {
            this.device.resetBusy();
            throw new Error("NobleDevice is not connected");
        }
        this.isReading = true;
        try {
            this.lastValue = await this.characteristic.readAsync();
        }
        catch (error) {
            console.error(error);
        }
        this.isReading = false;
        this.device.resetBusy();
        return this.lastValue;
    }
    async write(data, withoutResponse) {
        if (!this.properties.includes("write") && !this.properties.includes("writeWithoutResponse")) {
            return false;
        }
        this.device.checkBusy();
        if (!this.device.connected) {
            this.device.resetBusy();
            return false;
            // throw new Error("NobleDevice is not connected");
        }
        let written = false;
        let writeError = false;
        let counter = 5000;
        // await this.characteristic.writeAsync(data, withoutResponse);
        this.characteristic.write(data, withoutResponse, (error) => {
            if (error) {
                writeError = true;
            }
            written = true;
        });
        do {
            await (0, timingUtil_1.sleep)(1);
            counter--;
        } while (!written && counter > 0);
        this.device.resetBusy();
        return written && !writeError;
    }
    async subscribe() {
        await this.characteristic.subscribeAsync();
        // await this.characteristic.notifyAsync(true);
    }
    onRead(data) {
        // if the read notification comes from a manual read, just ignore it
        // we are only interested in data pushed by the device
        if (!this.isReading) {
            this.lastValue = data;
            this.emit("dataRead", this.lastValue);
        }
    }
    toJSON(asObject) {
        var _a;
        let json = {
            uuid: this.uuid,
            name: this.name,
            type: this.type,
            properties: this.properties,
            value: (_a = this.lastValue) === null || _a === void 0 ? void 0 : _a.toString("hex"),
            descriptors: {}
        };
        this.descriptors.forEach((descriptor) => {
            json.descriptors[this.uuid] = this.toJSON(true);
        });
        if (asObject) {
            return json;
        }
        else {
            return JSON.stringify(json);
        }
    }
    toString() {
        return this.characteristic.toString();
    }
}
exports.NobleCharacteristic = NobleCharacteristic;
