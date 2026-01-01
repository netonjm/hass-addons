'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NobleDevice = void 0;
const events_1 = require("events");
const NobleService_1 = require("./NobleService");
const timingUtil_1 = require("../../util/timingUtil");
class NobleDevice extends events_1.EventEmitter {
    constructor(peripheral) {
        super();
        this.connecting = false;
        this.connected = false;
        this.mtu = 20;
        this.busy = false;
        this.peripheral = peripheral;
        this.id = peripheral.id;
        this.uuid = peripheral.uuid;
        this.name = peripheral.advertisement.localName;
        this.address = peripheral.address.replace(/\-/g, ':').toUpperCase();
        this.addressType = peripheral.addressType;
        this.connectable = peripheral.connectable;
        this.rssi = peripheral.rssi;
        // this.mtu = peripheral.mtu;
        if (peripheral.advertisement.manufacturerData) {
            this.manufacturerData = peripheral.advertisement.manufacturerData;
        }
        else {
            this.manufacturerData = Buffer.from([]);
        }
        this.peripheral.on("connect", this.onConnect.bind(this));
        this.peripheral.on("disconnect", this.onDisconnect.bind(this));
        this.services = new Map();
    }
    updateFromPeripheral() {
        this.name = this.peripheral.advertisement.localName;
        this.address = this.peripheral.address.replace(/\-/g, ':').toUpperCase();
        this.addressType = this.peripheral.addressType;
        this.connectable = this.peripheral.connectable;
        this.rssi = this.peripheral.rssi;
        // this.mtu = peripheral.mtu;
        if (this.peripheral.advertisement.manufacturerData) {
            this.manufacturerData = this.peripheral.advertisement.manufacturerData;
        }
        else {
            this.manufacturerData = Buffer.from([]);
        }
    }
    checkBusy() {
        if (this.busy) {
            throw new Error("NobleDevice is busy");
        }
        else {
            this.busy = true;
            return true;
        }
    }
    resetBusy() {
        if (this.busy) {
            this.busy = false;
        }
        return this.busy;
    }
    async connect(timeout = 10) {
        if (this.connectable && !this.connected && !this.connecting) {
            if (this.peripheral.state == "connected") {
                this.connected = true;
                return true;
            }
            this.connecting = true;
            console.log("Peripheral connect start");
            this.peripheral.connect((error) => {
                if (typeof error != "undefined" && error != null) {
                    console.log("Peripheral connect error:", error);
                }
                else {
                    console.log("Peripheral state:", this.peripheral.state);
                    if (this.peripheral.state == "connected") {
                        this.connected = true;
                        this.connecting = false;
                    }
                }
            });
            let timeoutCycles = timeout * 10;
            do {
                await (0, timingUtil_1.sleep)(100);
                timeoutCycles--;
            } while (!this.connected && timeoutCycles > 0 && this.connecting);
            await (0, timingUtil_1.sleep)(10);
            if (!this.connected) {
                this.connecting = false;
                try {
                    this.peripheral.cancelConnect();
                }
                catch (error) { }
                return false;
            }
            console.log("Device emiting connected");
            this.emit("connected");
            return true;
        }
        console.log("Peripheral state:", this.peripheral.state);
        return false;
    }
    async disconnect() {
        if (this.connectable && this.connected) {
            try {
                await this.peripheral.disconnectAsync();
                return true;
            }
            catch (error) {
                console.error(error);
                return false;
            }
        }
        return false;
    }
    /**
     * Discover all services, characteristics and descriptors
     */
    async discoverAll() {
        try {
            this.checkBusy();
            if (!this.connected) {
                this.resetBusy();
                throw new Error("NobleDevice not connected");
            }
            const snc = await this.peripheral.discoverAllServicesAndCharacteristicsAsync();
            this.resetBusy();
            this.services = new Map();
            snc.services.forEach((service) => {
                const s = new NobleService_1.NobleService(this, service);
                this.services.set(s.getUUID(), s);
            });
            return this.services;
        }
        catch (error) {
            console.error(error);
            this.resetBusy();
            return new Map();
        }
    }
    /**
     * Discover services only
     */
    async discoverServices() {
        try {
            this.checkBusy();
            if (!this.connected) {
                this.resetBusy();
                throw new Error("NobleDevice not connected");
            }
            let timeoutCycles = 10 * 100;
            let services = [];
            this.services = new Map();
            this.peripheral.discoverServices([], (error, discoveredServices) => {
                services = discoveredServices;
            });
            do {
                await (0, timingUtil_1.sleep)(10);
                timeoutCycles--;
            } while (services.length == 0 && timeoutCycles > 0 && this.connected);
            // const services = await this.peripheral.discoverServicesAsync();
            this.resetBusy();
            if (!this.connected) {
                return this.services;
            }
            if (services.length > 0) {
                for (let service of services) {
                    const s = new NobleService_1.NobleService(this, service);
                    this.services.set(s.getUUID(), s);
                }
            }
            return this.services;
        }
        catch (error) {
            console.error(error);
            this.resetBusy();
            return new Map();
        }
    }
    /**
     * Read all available characteristics
     */
    async readCharacteristics() {
        try {
            if (!this.connected) {
                throw new Error("NobleDevice not connected");
            }
            if (this.services.size == 0) {
                await this.discoverServices();
            }
            for (let [uuid, service] of this.services) {
                for (let [uuid, characteristic] of service.characteristics) {
                    if (characteristic.properties.includes("read")) {
                        console.log("Reading", uuid);
                        const data = await characteristic.read();
                        if (typeof data != "undefined") {
                            console.log("Data", data.toString("ascii"));
                        }
                    }
                }
            }
            return true;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    onConnect(error) {
        console.log("Peripheral connect triggered");
        // if (typeof error != "undefined" && error != "" && error != null) {
        //   this.connected = false;
        // } else {
        //   this.connected = true;
        // }
        // this.connecting = false;
    }
    onDisconnect(error) {
        this.connected = false;
        this.connecting = false;
        this.resetBusy();
        this.services = new Map();
        this.emit("disconnected");
    }
    toString() {
        let text = "";
        this.services.forEach((service) => {
            text += service.toString() + "\n";
        });
        return text;
    }
    toJSON(asObject = false) {
        let json = {
            id: this.id,
            uuid: this.uuid,
            name: this.name,
            address: this.address,
            addressType: this.addressType,
            connectable: this.connectable,
            rssi: this.rssi,
            mtu: this.mtu,
            services: {}
        };
        let services = {};
        this.services.forEach((service) => {
            json.services[service.uuid] = service.toJSON(true);
        });
        if (asObject) {
            return json;
        }
        else {
            return JSON.stringify(json);
        }
    }
}
exports.NobleDevice = NobleDevice;
