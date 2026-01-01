'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NobleDescriptor = void 0;
const events_1 = require("events");
class NobleDescriptor extends events_1.EventEmitter {
    constructor(device, descriptor) {
        super();
        this.isReading = false;
        this.device = device;
        this.descriptor = descriptor;
        this.uuid = descriptor.uuid;
        this.name = descriptor.name;
        this.type = descriptor.type;
        this.descriptor.on("valueRead", this.onRead.bind(this));
    }
    async readValue() {
        this.device.checkBusy();
        if (!this.device.connected) {
            this.device.resetBusy();
            throw new Error("NobleDevice is not connected");
        }
        this.isReading = true;
        try {
            this.lastValue = await this.descriptor.readValueAsync();
        }
        catch (error) {
            console.error(error);
        }
        this.isReading = false;
        this.device.resetBusy();
        return this.lastValue;
    }
    async writeValue(data) {
        this.device.checkBusy();
        if (!this.device.connected) {
            this.device.resetBusy();
            throw new Error("NobleDevice is not connected");
        }
        await this.descriptor.writeValueAsync(data);
        this.lastValue = data;
        this.device.resetBusy();
    }
    onRead(data) {
        // if the read notification comes from a manual read, just ignore it
        // we are only interested in data pushed by the device
        if (!this.isReading) {
            this.lastValue = data;
            console.log("Descriptor received data", data);
            this.emit("valueRead", this.lastValue);
        }
    }
    toJSON(asObject = false) {
        var _a;
        const json = {
            uuid: this.uuid,
            name: this.name,
            type: this.type,
            value: (_a = this.lastValue) === null || _a === void 0 ? void 0 : _a.toString("hex")
        };
        if (asObject) {
            return json;
        }
        else {
            return JSON.stringify(json);
        }
    }
    toString() {
        return this.descriptor.toString();
    }
}
exports.NobleDescriptor = NobleDescriptor;
