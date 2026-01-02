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
        this.commandQueue = Promise.resolve(); // Command queue for serialization
        this.lastCommandTime = 0; // Timestamp of last command completion
        this.minCommandInterval = 500; // Minimum ms between commands (increased for stability)
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
    async connect(skipBasicInfo = false) {
        if (typeof this.device != "undefined" && this.device.connectable) {
            // stop scan
            await this.scanner.stopScan();
            if (await this.device.connect()) {
                if (!skipBasicInfo) {
                    console.log("BLE Device reading basic info");
                    await this.readBasicInfo();
                    console.log("BLE Device read basic info");
                } else {
                    console.log("BLE Device skipping basic info (fast mode)");
                    // Still need to discover services to get the 1910 service
                    console.log("BLE Device discover services start");
                    await this.device.discoverServices();
                    console.log("BLE Device discover services end");
                }
                const subscribed = await this.subscribe();
                console.log("BLE Device subscribed");
                if (!subscribed) {
                    await this.device.disconnect();
                    return false;
                }
                else {
                    this.connected = true;
                    this.emit("connected");
                    return true;
                }
            }
            else {
                console.log("Connect failed");
            }
        }
        else {
            console.log("Missing device or not connectable");
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
        this.connected = false;
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
        console.log("[SUBSCRIBE v0.6.1] subscribe() called");
        if (typeof this.device != "undefined") {
            let service;
            if (this.device.services.has("1910")) {
                service = this.device.services.get("1910");
                console.log("[SUBSCRIBE] Found service 1910");
            }
            if (typeof service != "undefined") {
                // Check if characteristics are already loaded
                if (service.characteristics.size === 0) {
                    console.log("[SUBSCRIBE] Reading characteristics...");
                    await service.readCharacteristics();
                }
                console.log("[SUBSCRIBE] Characteristics:", Array.from(service.characteristics.keys()));
                if (service.characteristics.has("fff4")) {
                    const characteristic = service.characteristics.get("fff4");
                    if (typeof characteristic != "undefined") {
                        console.log("[SUBSCRIBE] Found characteristic fff4, subscribing...");
                        await characteristic.subscribe();
                        console.log("[SUBSCRIBE] Subscribe completed");
                        characteristic.on("dataRead", this.onIncomingData.bind(this));
                        console.log("[SUBSCRIBE] dataRead listener attached");
                        
                        // Note: For websocket gateway, characteristic.subscribe() already
                        // sends the 'notify' command which should enable CCCD.
                        // Skipping manual descriptor discovery as it may timeout.
                        
                        return true;
                    }
                } else {
                    console.log("[SUBSCRIBE] ERROR: fff4 characteristic not found!");
                }
            }
        }
        console.log("[SUBSCRIBE] returning false - something went wrong");
        return false;
    }
    async sendCommand(command, waitForResponse = true, ignoreCrc = false) {
        var _a;
        if (this.waitingForResponse) {
            throw new Error("Command already in progress");
        }
        if (this.responses.length > 0) {
            // Clear unprocessed responses (like SearchBicycleStatusCommand sent after unlock/lock)
            console.log("[sendCommand] Clearing", this.responses.length, "unprocessed response(s)");
            this.responses = [];
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
                                // wait a bit before retry
                                // console.log("Sleeping a bit");
                                await (0, timingUtil_1.sleep)(200);
                            }
                            const written = await this.writeCharacteristic(characteristic, data);
                            if (!written) {
                                this.waitingForResponse = false;
                                // make sure we clear response buffer as a response could still have been
                                // received between writing packets (before lock disconnects, on unstable network) 
                                this.responses = [];
                                throw new Error("Unable to send data to lock");
                            }
                            // wait for a response
                            // console.log("Waiting for response");
                            let cycles = 0;
                            while (this.responses.length == 0 && this.connected) {
                                cycles++;
                                await (0, timingUtil_1.sleep)(5);
                            }
                            // console.log("Waited for a response for", cycles, "=", cycles * 5, "ms");
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
    /**
     * Wait for and consume any pending notifications (like SearchBicycleStatusCommand)
     * that the lock sends automatically after unlock/lock operations.
     * @param timeout Timeout to wait in ms
     */
    async consumePendingNotifications(timeout = 500) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (this.responses.length > 0) {
                const notification = this.responses.pop();
                console.log("Received:", notification);
                // Reset timer to catch any additional notifications
                await (0, timingUtil_1.sleep)(100);
            } else {
                await (0, timingUtil_1.sleep)(50);
            }
        }
    }
    /**
     * Wait for SearchBicycleStatusCommand confirmation after unlock/lock.
     * This is the REAL confirmation that the operation completed.
     * @param aesKey AES key for decryption
     * @param expectedStatus Expected lock status (0=locked, 1=unlocked)
     * @param timeout Timeout to wait in ms
     * @returns Lock status from confirmation, or -1 if timeout
     */
    async waitForStatusConfirmation(aesKey, expectedStatus = -1, timeout = 2000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (this.responses.length > 0) {
                const envelope = this.responses.pop();
                if (envelope) {
                    envelope.setAesKey(aesKey);
                    const cmd = envelope.getCommand();
                    // Check if this is a SearchBicycleStatusCommand (commandType 0x14)
                    if (typeof cmd.getLockStatus === 'function') {
                        const status = cmd.getLockStatus();
                        console.log("[StatusConfirmation] Lock status:", status === 1 ? "UNLOCKED" : "LOCKED");
                        this.lastCommandTime = Date.now();
                        return status;
                    }
                }
            }
            await (0, timingUtil_1.sleep)(50);
        }
        console.log("[StatusConfirmation] Timeout waiting for status confirmation");
        this.lastCommandTime = Date.now();
        return -1;
    }
    /**
     * Ensure minimum delay between commands
     */
    async ensureCommandDelay() {
        const elapsed = Date.now() - this.lastCommandTime;
        if (elapsed < this.minCommandInterval) {
            await (0, timingUtil_1.sleep)(this.minCommandInterval - elapsed);
        }
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
            // await sleep(10);
            index += MTU;
        } while (index < data.length);
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
                        // Some lock firmware sends notifications with bad CRC but valid data
                        // Don't discard them - let upper layers decide what to do
                        this.emit("dataReceived", command);
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
