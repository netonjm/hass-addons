'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTLockClient = void 0;
const events_1 = __importDefault(require("events"));
const Lock_1 = require("./constant/Lock");
const TTLock_1 = require("./device/TTLock");
const BluetoothLeService_1 = require("./scanner/BluetoothLeService");
const timingUtil_1 = require("./util/timingUtil");
class TTLockClient extends events_1.default.EventEmitter {
    constructor(options) {
        super();
        this.bleService = null;
        this.scannerType = "noble";
        this.lockDevices = new Map();
        this.scanning = false;
        this.monitoring = false;
        this.adapterReady = false;
        if (options.uuids) {
            this.uuids = options.uuids;
        }
        else {
            this.uuids = BluetoothLeService_1.TTLockUUIDs;
        }
        if (typeof options.scannerType != "undefined") {
            this.scannerType = options.scannerType;
        }
        if (typeof options.scannerOptions != "undefined") {
            this.scannerOptions = options.scannerOptions;
        }
        else {
            this.scannerOptions = {};
        }
        this.lockData = new Map();
        if (options.lockData && options.lockData.length > 0) {
            this.setLockData(options.lockData);
        }
    }
    async prepareBTService() {
        if (this.bleService == null) {
            this.bleService = new BluetoothLeService_1.BluetoothLeService(this.uuids, this.scannerType, this.scannerOptions);
            this.bleService.on("ready", () => { this.adapterReady = true; this.emit("ready"); });
            this.bleService.on("scanStart", this.onScanStart.bind(this));
            this.bleService.on("scanStop", this.onScanStop.bind(this));
            this.bleService.on("discover", this.onScanResult.bind(this));
            // wait for adapter to become ready
            let counter = 5;
            do {
                await (0, timingUtil_1.sleep)(500);
                counter--;
            } while (counter > 0 && !this.adapterReady);
            return this.adapterReady;
        }
        return true;
    }
    stopBTService() {
        if (this.bleService != null) {
            this.stopScanLock();
            this.bleService = null;
        }
        return true;
    }
    async startScanLock() {
        if (this.bleService != null && !this.scanning && !this.monitoring) {
            this.scanning = true;
            this.scanning = await this.bleService.startScan();
            return this.scanning;
        }
        return false;
    }
    async stopScanLock() {
        if (this.bleService != null && this.isScanning()) {
            return await this.bleService.stopScan();
        }
        return true;
    }
    async startMonitor() {
        if (this.bleService != null && !this.scanning && !this.monitoring) {
            this.monitoring = true;
            this.monitoring = await this.bleService.startScan(true);
            return this.monitoring;
        }
        return false;
    }
    async stopMonitor() {
        if (this.bleService != null && this.isMonitoring()) {
            return await this.bleService.stopScan();
        }
        return false;
    }
    isScanning() {
        if (this.bleService) {
            return (this.bleService.isScanning() && this.scanning);
        }
        return false;
    }
    isMonitoring() {
        if (this.bleService) {
            return (this.bleService.isScanning() && this.monitoring);
        }
        return false;
    }
    getLockData() {
        const lockData = [];
        for (let [id, lock] of this.lockData) {
            lockData.push(lock);
        }
        return lockData;
    }
    setLockData(newLockData) {
        this.lockData = new Map();
        if (newLockData && newLockData.length > 0) {
            newLockData.forEach((lockData) => {
                this.lockData.set(lockData.address, lockData);
                const lock = this.lockDevices.get(lockData.address);
                if (typeof lock != "undefined") {
                    lock.updateLockData(lockData);
                }
            });
        }
    }
    onScanStart() {
        if (this.scanning) {
            this.emit("scanStart");
        }
        else if (this.monitoring) {
            this.emit("monitorStart");
        }
    }
    onScanStop() {
        if (this.scanning) {
            this.emit("scanStop");
            this.scanning = false;
        }
        else if (this.monitoring) {
            this.emit("monitorStop");
            this.monitoring = false;
        }
    }
    onScanResult(device) {
        // Is it a Lock device ?
        if (device.lockType != Lock_1.LockType.UNKNOWN) {
            if (!this.lockDevices.has(device.address)) {
                const data = this.lockData.get(device.address);
                const lock = new TTLock_1.TTLock(device, data);
                this.lockDevices.set(device.address, lock);
                lock.on("dataUpdated", (lock) => {
                    const lockData = lock.getLockData();
                    if (typeof lockData != "undefined") {
                        this.lockData.set(lockData.address, lockData);
                        this.emit("updatedLockData");
                    }
                });
                lock.on("lockReset", (address, id) => {
                    var _a;
                    this.lockData.delete(address);
                    this.lockDevices.delete(address);
                    (_a = this.bleService) === null || _a === void 0 ? void 0 : _a.forgetDevice(id);
                    this.emit("updatedLockData");
                });
                this.emit("foundLock", lock);
            }
        }
    }
}
exports.TTLockClient = TTLockClient;
