'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTBluetoothDevice = void 0;
const CommandEnvelope_1 = require("../api/CommandEnvelope");
const Lock_1 = require("../constant/Lock");
const timingUtil_1 = require("../util/timingUtil");
const TTDevice_1 = require("./TTDevice");
const CRLF = "0d0a";
const MTU = 20;
class TTBluetoothDevice extends TTDevice_1.TTDevice {
    constructor(scanner) {
        super();
        this.connected = false;
        this.incomingDataBuffer = Buffer.from([]);
        this.waitingForResponse = false;
        this.responses = [];
        this.scanner = scanner;
    }
    static createFromDevice(device, scanner) {
        const bDevice = new TTBluetoothDevice(scanner);
        bDevice.updateFromDevice(device);
        return bDevice;
    }
    updateFromDevice(device) {
        if (typeof device != "undefined") {
            if (typeof this.device != "undefined") {
                this.device.removeAllListeners();
            }
            this.device = device;
            this.device.on("connected", this.onDeviceConnected.bind(this));
            this.device.on("disconnected", this.onDeviceDisconnected.bind(this));
        }
        if (typeof this.device != "undefined") {
            this.id = this.device.id;
            this.name = this.device.name;
            this.rssi = this.device.rssi;
            if (this.device.manufacturerData.length >= 15) {
                this.parseManufacturerData(this.device.manufacturerData);
            }
        }
        this.emit("updated");
    }
    async connect() {
        if (typeof this.device != "undefined" && this.device.connectable) {
            // stop scan
            await this.scanner.stopScan();
            console.log(`[${new Date().toISOString().substr(11, 12)}] BLE Device connect() starting`);
            if (await this.device.connect()) {
                // TODO: something happens here (disconnect) and it's stuck in limbo
                console.log(`[${new Date().toISOString().substr(11, 12)}] BLE Device reading basic info`);
                await this.readBasicInfo();
                console.log(`[${new Date().toISOString().substr(11, 12)}] BLE Device read basic info`);
                const subscribed = await this.subscribe();
                console.log(`[${new Date().toISOString().substr(11, 12)}] BLE Device subscribed`);
                if (!subscribed) {
                    await this.device.disconnect();
                    return false;
                }
                else {
                    // Post-connection delay to stabilize (like Android SDK)
                    console.log(`[${new Date().toISOString().substr(11, 12)}] BLE Device post-connection delay start`);
                    await (0, timingUtil_1.sleep)(200);
                    console.log(`[${new Date().toISOString().substr(11, 12)}] BLE Device post-connection delay end, setting connected=true`);
                    this.connected = true;
                    this.emit("connected");
                    console.log(`[${new Date().toISOString().substr(11, 12)}] BLE Device emitted connected event`);
                    return true;
                }
            }
            else {
                console.log(`[${new Date().toISOString().substr(11, 12)}] Connect failed`);
            }
        }
        else {
            console.log(`[${new Date().toISOString().substr(11, 12)}] Missing device or not connectable`);
        }
        return false;
    }
    async onDeviceConnected() {
        // await this.readBasicInfo();
        // await this.subscribe();
        // this.connected = true;
        // this.emit("connected");
        // console.log("TTBluetoothDevice connected", this.device?.id);
    }
    async onDeviceDisconnected() {
        console.log(`[${new Date().toISOString().substr(11, 12)}] TTBluetoothDevice.onDeviceDisconnected() called`);
        this.connected = false;
        // Reset state to prevent "Command already in progress" errors
        this.waitingForResponse = false;
        this.responses = [];
        this.incomingDataBuffer = Buffer.from([]);
        // console.log("TTBluetoothDevice disconnected", this.device?.id);
        this.emit("disconnected");
    }
    async readBasicInfo() {
        if (typeof this.device != "undefined") {
            console.log("BLE Device discover services start");
            await this.device.discoverServices();
            console.log("BLE Device discover services end");
            // update some basic information
            let service;
            if (this.device.services.has("1800")) {
                service = this.device.services.get("1800");
                if (typeof service != "undefined") {
                    console.log("BLE Device read characteristics start");
                    await service.readCharacteristics();
                    console.log("BLE Device read characteristics end");
                    this.putCharacteristicValue(service, "2a00", "name");
                }
            }
            if (this.device.services.has("180a")) {
                service = this.device.services.get("180a");
                if (typeof service != "undefined") {
                    console.log("BLE Device read characteristics start");
                    await service.readCharacteristics();
                    console.log("BLE Device read characteristics end");
                    this.putCharacteristicValue(service, "2a29", "manufacturer");
                    this.putCharacteristicValue(service, "2a24", "model");
                    this.putCharacteristicValue(service, "2a27", "hardware");
                    this.putCharacteristicValue(service, "2a26", "firmware");
                }
            }
        }
    }
    async subscribe() {
        if (typeof this.device != "undefined") {
            let service;
            if (this.device.services.has("1910")) {
                service = this.device.services.get("1910");
            }
            if (typeof service != "undefined") {
                await service.readCharacteristics();
                if (service.characteristics.has("fff4")) {
                    const characteristic = service.characteristics.get("fff4");
                    if (typeof characteristic != "undefined") {
                        console.log(`[${new Date().toISOString().substr(11, 12)}] Subscribing to fff4 notifications`);
                        await characteristic.subscribe();
                        characteristic.on("dataRead", this.onIncomingData.bind(this));
                        
                        // CCCD descriptor write - required for proper BLE notification setup
                        // Android SDK writes ENABLE_NOTIFICATION_VALUE to descriptor 0x2902
                        console.log(`[${new Date().toISOString().substr(11, 12)}] Discovering descriptors for fff4`);
                        await characteristic.discoverDescriptors();
                        const descriptor = characteristic.descriptors.get("2902");
                        if (typeof descriptor != "undefined") {
                            console.log(`[${new Date().toISOString().substr(11, 12)}] Writing CCCD descriptor 0x2902 to enable notifications`);
                            await descriptor.writeValue(Buffer.from([0x01, 0x00])); // Little Endian: ENABLE_NOTIFICATION_VALUE
                            console.log(`[${new Date().toISOString().substr(11, 12)}] CCCD descriptor written successfully`);
                        } else {
                            console.log(`[${new Date().toISOString().substr(11, 12)}] Warning: CCCD descriptor 0x2902 not found`);
                        }
                        
                        // Small delay after subscription to let the lock process the notification setup
                        await (0, timingUtil_1.sleep)(100);
                        console.log(`[${new Date().toISOString().substr(11, 12)}] Subscribe complete`);
                        return true;
                    }
                }
            }
        }
        return false;
    }
    async sendCommand(command, waitForResponse = true, ignoreCrc = false) {
        var _a;
        if (this.waitingForResponse) {
            throw new Error("Command already in progress");
        }
        if (this.responses.length > 0) {
            // should this be an error ?
            throw new Error("Unprocessed responses");
        }
        const commandData = command.buildCommandBuffer();
        if (commandData) {
            let data = Buffer.concat([
                commandData,
                Buffer.from(CRLF, "hex")
            ]);
            // write with 20 bytes MTU
            const service = (_a = this.device) === null || _a === void 0 ? void 0 : _a.services.get("1910");
            if (typeof service != undefined) {
                const characteristic = service === null || service === void 0 ? void 0 : service.characteristics.get("fff2");
                if (typeof characteristic != "undefined") {
                    if (waitForResponse) {
                        let retry = 0;
                        let crcs = [];
                        let response;
                        this.waitingForResponse = true;
                        do {
                            if (retry > 0) {
                                // wait a bit before retry - increased from 200ms to 500ms
                                console.log(`Retry ${retry} after delay`);
                                await (0, timingUtil_1.sleep)(500);
                            }
                            const written = await this.writeCharacteristic(characteristic, data);
                            if (!written) {
                                this.waitingForResponse = false;
                                // make sure we clear response buffer as a response could still have been
                                // received between writing packets (before lock disconnects, on unstable network) 
                                this.responses = [];
                                throw new Error("Unable to send data to lock");
                            }
                            // wait for a response with timeout protection
                            // console.log("Waiting for response");
                            let cycles = 0;
                            const maxCycles = 200; // 10 second timeout (200 * 50ms)
                            while (this.responses.length == 0 && this.connected && cycles < maxCycles) {
                                cycles++;
                                await (0, timingUtil_1.sleep)(50);
                            }
                            // console.log("Waited for a response for", cycles, "=", cycles * 50, "ms");
                            if (cycles >= maxCycles) {
                                this.waitingForResponse = false;
                                this.responses = [];
                                throw new Error("Command timeout waiting for response");
                            }
                            if (!this.connected) {
                                this.waitingForResponse = false;
                                this.responses = [];
                                throw new Error("Disconnected while waiting for response");
                            }
                            response = this.responses.pop();
                            if (typeof response != "undefined") {
                                crcs.push(response.getCrc());
                            }
                            retry++;
                        } while (typeof response == "undefined" || (!response.isCrcOk() && !ignoreCrc && retry <= 2));
                        this.waitingForResponse = false;
                        if (!response.isCrcOk() && !ignoreCrc) {
                            // check if all CRCs match and auto-ignore bad CRC
                            if (crcs.length > 1) {
                                for (let i = 1; i < crcs.length; i++) {
                                    if (crcs[i - 1] != crcs[i]) {
                                        throw new Error("Malformed response, bad CRC");
                                    }
                                }
                            }
                            else {
                                throw new Error("Malformed response, bad CRC");
                            }
                        }
                        return response;
                    }
                    else {
                        await this.writeCharacteristic(characteristic, data);
                    }
                }
            }
        }
    }
    /**
     *
     * @param timeout Timeout to wait in ms
     */
    async waitForResponse(timeout = 10000) {
        if (this.waitingForResponse) {
            throw new Error("Command already in progress");
        }
        let response;
        this.waitingForResponse = true;
        console.log("Waiting for response");
        let cycles = 0;
        const sleepPerCycle = 100;
        while (this.responses.length == 0 && cycles * sleepPerCycle < timeout) {
            cycles++;
            await (0, timingUtil_1.sleep)(sleepPerCycle);
        }
        console.log("Waited for a response for", cycles, "=", cycles * sleepPerCycle, "ms");
        if (this.responses.length > 0) {
            response = this.responses.pop();
        }
        this.waitingForResponse = false;
        return response;
    }
    async writeCharacteristic(characteristic, data) {
        if (process.env.TTLOCK_DEBUG_COMM == "1") {
            console.log("Sending command:", data.toString("hex"));
        }
        let index = 0;
        do {
            const remaining = data.length - index;
            const written = await characteristic.write(data.subarray(index, index + Math.min(MTU, remaining)), true);
            if (!written) {
                return false;
            }
            // Delay between MTU fragments (like Android SDK)
            if (index + MTU < data.length) {
                await (0, timingUtil_1.sleep)(20);
            }
            index += MTU;
        } while (index < data.length);
        // Post-write delay to allow lock to process (Android SDK has 2500-5500ms)
        await (0, timingUtil_1.sleep)(100);
        return true;
    }
    onIncomingData(data) {
        this.incomingDataBuffer = Buffer.concat([this.incomingDataBuffer, data]);
        this.readDeviceResponse();
    }
    readDeviceResponse() {
        if (this.incomingDataBuffer.length >= 2) {
            // check for CRLF at the end of data
            const ending = this.incomingDataBuffer.subarray(this.incomingDataBuffer.length - 2);
            if (ending.toString("hex") == CRLF) {
                // we have a command response
                if (process.env.TTLOCK_DEBUG_COMM == "1") {
                    console.log("Received response:", this.incomingDataBuffer.toString("hex"));
                }
                try {
                    const command = CommandEnvelope_1.CommandEnvelope.createFromRawData(this.incomingDataBuffer.subarray(0, this.incomingDataBuffer.length - 2));
                    if (this.waitingForResponse) {
                        this.responses.push(command);
                    }
                    else {
                        // discard unsolicited messages if CRC is not ok
                        if (command.isCrcOk()) {
                            this.emit("dataReceived", command);
                        }
                    }
                }
                catch (error) {
                    // TODO: in case of a malformed response we should notify the waiting cycle and stop waiting
                    console.error(error);
                }
                this.incomingDataBuffer = Buffer.from([]);
            }
        }
    }
    putCharacteristicValue(service, uuid, property) {
        const value = service.characteristics.get(uuid);
        if (typeof value != "undefined" && typeof value.lastValue != "undefined") {
            Reflect.set(this, property, value.lastValue.toString());
        }
    }
    async disconnect() {
        var _a;
        if (await ((_a = this.device) === null || _a === void 0 ? void 0 : _a.disconnect())) {
            this.connected = false;
        }
    }
    parseManufacturerData(manufacturerData) {
        // TODO: check offset is within the limits of the Buffer
        // console.log(manufacturerData, manufacturerData.length)
        if (manufacturerData.length < 15) {
            throw new Error("Invalid manufacturer data length:" + manufacturerData.length.toString());
        }
        var offset = 0;
        this.protocolType = manufacturerData.readInt8(offset++);
        this.protocolVersion = manufacturerData.readInt8(offset++);
        if (this.protocolType == 18 && this.protocolVersion == 25) {
            this.isDfuMode = true;
            return;
        }
        if (this.protocolType == -1 && this.protocolVersion == -1) {
            this.isDfuMode = true;
            return;
        }
        if (this.protocolType == 52 && this.protocolVersion == 18) {
            this.isWristband = true;
        }
        if (this.protocolType == 5 && this.protocolVersion == 3) {
            this.scene = manufacturerData.readInt8(offset++);
        }
        else {
            offset = 4;
            this.protocolType = manufacturerData.readInt8(offset++);
            this.protocolVersion = manufacturerData.readInt8(offset++);
            offset = 7;
            this.scene = manufacturerData.readInt8(offset++);
        }
        if (this.protocolType < 5 || Lock_1.LockVersion.getLockType(this) == Lock_1.LockType.LOCK_TYPE_V2S) {
            this.isRoomLock = true;
            return;
        }
        if (this.scene <= 3) {
            this.isRoomLock = true;
        }
        else {
            switch (this.scene) {
                case 4: {
                    this.isGlassLock = true;
                    break;
                }
                case 5:
                case 11: {
                    this.isSafeLock = true;
                    break;
                }
                case 6: {
                    this.isBicycleLock = true;
                    break;
                }
                case 7: {
                    this.isLockcar = true;
                    break;
                }
                case 8: {
                    this.isPadLock = true;
                    break;
                }
                case 9: {
                    this.isCyLinder = true;
                    break;
                }
                case 10: {
                    if (this.protocolType == 5 && this.protocolVersion == 3) {
                        this.isRemoteControlDevice = true;
                        break;
                    }
                    break;
                }
            }
        }
        const params = manufacturerData.readInt8(offset);
        this.isUnlock = ((params & 0x1) == 0x1);
        this.hasEvents = ((params & 0x2) == 0x2);
        this.isSettingMode = ((params & 0x4) != 0x0);
        if (Lock_1.LockVersion.getLockType(this) == Lock_1.LockType.LOCK_TYPE_V3 || Lock_1.LockVersion.getLockType(this) == Lock_1.LockType.LOCK_TYPE_V3_CAR) {
            this.isTouch = ((params && 0x8) != 0x0);
        }
        else if (Lock_1.LockVersion.getLockType(this) == Lock_1.LockType.LOCK_TYPE_CAR) {
            this.isTouch = false;
            this.isLockcar = true;
        }
        if (this.isLockcar) {
            if (this.isUnlock) {
                if ((params & 0x10) == 0x10) {
                    this.parkStatus = 3;
                }
                else {
                    this.parkStatus = 2;
                }
            }
            else if ((params & 0x10) == 0x10) {
                this.parkStatus = 1;
            }
            else {
                this.parkStatus = 0;
            }
        }
        offset++;
        this.batteryCapacity = manufacturerData.readInt8(offset);
        // offset += 3 + 4; // Offset in original SDK is + 3, but in scans it's actually +4
        offset = manufacturerData.length - 6; // let's just get the last 6 bytes
        const macBuf = manufacturerData.slice(offset, offset + 6);
        var macArr = [];
        macBuf.forEach((m) => {
            let hexByte = m.toString(16);
            if (hexByte.length < 2) {
                hexByte = "0" + hexByte;
            }
            macArr.push(hexByte);
        });
        macArr.reverse();
        this.address = macArr.join(':').toUpperCase();
    }
}
exports.TTBluetoothDevice = TTBluetoothDevice;
