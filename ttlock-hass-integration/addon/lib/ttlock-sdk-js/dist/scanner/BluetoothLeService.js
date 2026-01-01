'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.BluetoothLeService = exports.TTLockUUIDs = void 0;
const events_1 = require("events");
const NobleScanner_1 = require("./noble/NobleScanner");
const TTBluetoothDevice_1 = require("../device/TTBluetoothDevice");
const NobleScannerWebsocket_1 = require("./noble/NobleScannerWebsocket");
exports.TTLockUUIDs = ["1910", "00001910-0000-1000-8000-00805f9b34fb"];
class BluetoothLeService extends events_1.EventEmitter {
    constructor(uuids = exports.TTLockUUIDs, scannerType = "noble", scannerOptions) {
        super();
        this.btDevices = new Map();
        if (scannerType == "noble") {
            this.scanner = new NobleScanner_1.NobleScanner(uuids);
        }
        else if (scannerType == "noble-websocket") {
            this.scanner = new NobleScannerWebsocket_1.NobleScannerWebsocket(uuids, scannerOptions.websocketHost, scannerOptions.websocketPort, scannerOptions.websocketAesKey, scannerOptions.websocketUsername, scannerOptions.websocketPassword);
        }
        else {
            throw "Invalid parameters";
        }
        this.scanner.on("ready", () => this.emit("ready"));
        this.scanner.on("discover", this.onDiscover.bind(this));
        this.scanner.on("scanStart", () => this.emit("scanStart"));
        this.scanner.on("scanStop", () => this.emit("scanStop"));
    }
    async startScan(passive = false) {
        return await this.scanner.startScan(passive);
    }
    async stopScan() {
        return await this.scanner.stopScan();
    }
    isScanning() {
        return this.scanner.getState() == "scanning";
    }
    forgetDevice(id) {
        this.btDevices.delete(id);
    }
    onDiscover(device) {
        // TODO: move device storage to TTLockClient
        // check if the device was previously discovered and update
        if (this.btDevices.has(device.id)) {
            const ttDevice = this.btDevices.get(device.id);
            if (typeof ttDevice != 'undefined') {
                ttDevice.updateFromDevice(device);
                // this.emit("discover", ttDevice);
            }
        }
        else {
            const ttDevice = TTBluetoothDevice_1.TTBluetoothDevice.createFromDevice(device, this.scanner);
            this.btDevices.set(device.id, ttDevice);
            this.emit("discover", ttDevice);
        }
    }
}
exports.BluetoothLeService = BluetoothLeService;
