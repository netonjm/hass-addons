'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTLock = void 0;
const AudioManage_1 = require("../constant/AudioManage");
const FeatureValue_1 = require("../constant/FeatureValue");
const Lock_1 = require("../constant/Lock");
const LockedStatus_1 = require("../constant/LockedStatus");
const PassageModeOperate_1 = require("../constant/PassageModeOperate");
const timingUtil_1 = require("../util/timingUtil");
const TTLockApi_1 = require("./TTLockApi");
class TTLock extends TTLockApi_1.TTLockApi {
    constructor(device, data) {
        super(device, data);
        this.skipDataRead = false;
        this.connecting = false;
        this.connected = false;
        this.pendingAutoLock = null; // Promise that resolves when auto-lock notification arrives
        this.pendingAutoLockResolver = null; // Resolver for the pending auto-lock promise
        this.device.on("connected", this.onConnected.bind(this));
        this.device.on("disconnected", this.onDisconnected.bind(this));
        this.device.on("updated", this.onTTDeviceUpdated.bind(this));
        this.device.on("dataReceived", this.onDataReceived.bind(this));
    }
    getAddress() {
        return this.device.address;
    }
    getName() {
        return this.device.name;
    }
    getManufacturer() {
        return this.device.manufacturer;
    }
    getModel() {
        return this.device.model;
    }
    getFirmware() {
        return this.device.firmware;
    }
    getBattery() {
        return this.batteryCapacity;
    }
    getRssi() {
        return this.rssi;
    }
    async connect(options = {}) {
        // Support both old signature (skipDataRead, timeout) and new options object
        let skipDataRead = false;
        let timeout = 15;
        let maxRetries = 3;
        let retryDelay = 1000;
        
        if (typeof options === 'boolean') {
            // Old signature: connect(skipDataRead, timeout)
            skipDataRead = options;
            timeout = arguments[1] || 15;
        } else if (typeof options === 'object') {
            skipDataRead = options.skipBasicInfo || options.skipDataRead || false;
            timeout = options.timeout || 15;
            maxRetries = options.maxRetries || 3;
            retryDelay = options.retryDelay || 1000;
        }
        
        if (this.connecting) {
            console.log("Connect already in progress");
            return false;
        }
        if (this.connected) {
            return true;
        }
        
        // Retry loop
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            this.connecting = true;
            this.skipDataRead = skipDataRead;
            
            try {
                const connected = await this.device.connect(skipDataRead);
                let timeoutCycles = timeout * 10;
                
                if (connected) {
                    console.log("Lock waiting for connection to be completed");
                    do {
                        await (0, timingUtil_1.sleep)(100);
                        timeoutCycles--;
                    } while (!this.connected && timeoutCycles > 0 && this.connecting);
                    
                    if (this.connected) {
                        this.skipDataRead = false;
                        this.connecting = false;
                        return true;
                    }
                }
                
                console.log(`Lock connect attempt ${attempt}/${maxRetries} failed`);
                
            } catch (err) {
                console.log(`Lock connect attempt ${attempt}/${maxRetries} error: ${err.message}`);
            }
            
            this.skipDataRead = false;
            this.connecting = false;
            
            // Wait before retry (except on last attempt)
            if (attempt < maxRetries) {
                await (0, timingUtil_1.sleep)(retryDelay);
            }
        }
        
        console.log("Lock connect failed after all retries");
        return false;
    }
    isConnected() {
        return this.connected;
    }
    async disconnect() {
        // Clear any pending auto-lock
        if (this.pendingAutoLockResolver) {
            this.pendingAutoLockResolver();
            this.pendingAutoLockResolver = null;
            this.pendingAutoLock = null;
        }
        await this.device.disconnect();
        // Small pause after disconnect to let the lock stabilize
        await (0, timingUtil_1.sleep)(500);
    }
    isInitialized() {
        return this.initialized;
    }
    isPaired() {
        const privateData = this.privateData;
        if (privateData.aesKey && privateData.admin && privateData.admin.adminPs && privateData.admin.unlockKey) {
            return true;
        }
        else {
            return false;
        }
    }
    hasLockSound() {
        if (typeof this.featureList != "undefined" && this.featureList.has(FeatureValue_1.FeatureValue.AUDIO_MANAGEMENT)) {
            return true;
        }
        return false;
    }
    hasPassCode() {
        if (typeof this.featureList != "undefined" && this.featureList.has(FeatureValue_1.FeatureValue.PASSCODE)) {
            return true;
        }
        return false;
    }
    hasICCard() {
        if (typeof this.featureList != "undefined" && this.featureList.has(FeatureValue_1.FeatureValue.IC)) {
            return true;
        }
        return false;
    }
    hasFingerprint() {
        if (typeof this.featureList != "undefined" && this.featureList.has(FeatureValue_1.FeatureValue.FINGER_PRINT)) {
            return true;
        }
        return false;
    }
    hasAutolock() {
        if (typeof this.featureList != "undefined" && this.featureList.has(FeatureValue_1.FeatureValue.AUTO_LOCK)) {
            return true;
        }
        return false;
    }
    hasNewEvents() {
        return this.newEvents;
    }
    /**
     * Initialize and pair with a new lock
     */
    async initLock() {
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        if (this.initialized) {
            throw new Error("Lock is not in pairing mode");
        }
        // TODO: also check if lock is already inited (has AES key)
        try {
            // Init
            console.log("========= init");
            await this.initCommand();
            console.log("========= init");
            // Get AES key
            console.log("========= AES key");
            const aesKey = await this.getAESKeyCommand();
            console.log("========= AES key:", aesKey.toString("hex"));
            // Add admin
            console.log("========= admin");
            const admin = await this.addAdminCommand(aesKey);
            console.log("========= admin:", admin);
            // Calibrate time
            // this seems to fail on some locks
            // see https://github.com/kind3r/hass-addons/issues/11
            try {
                console.log("========= time");
                await this.calibrateTimeCommand(aesKey);
                console.log("========= time");
            }
            catch (error) {
                console.error(error);
            }
            // Search device features
            console.log("========= feature list");
            const featureList = await this.searchDeviceFeatureCommand(aesKey);
            console.log("========= feature list", featureList);
            let switchState, lockSound, displayPasscode, autoLockTime, lightingTime, adminPasscode, pwdInfo, remoteUnlock;
            // Feature depended queries
            // if (featureList.has(FeatureValue.RESET_BUTTON)
            //   || featureList.has(FeatureValue.TAMPER_ALERT)
            //   || featureList.has(FeatureValue.PRIVACK_LOCK)) {
            //   console.log("========= switchState");
            //   switchState = await this.getSwitchStateCommand(undefined, aesKey);
            //   console.log("========= switchState:", switchState);
            // }
            if (featureList.has(FeatureValue_1.FeatureValue.AUDIO_MANAGEMENT)) {
                console.log("========= lockSound");
                try {
                    lockSound = await this.audioManageCommand(undefined, aesKey);
                }
                catch (error) {
                    // this sometimes fails
                    console.error(error);
                }
                console.log("========= lockSound:", lockSound);
            }
            if (featureList.has(FeatureValue_1.FeatureValue.PASSWORD_DISPLAY_OR_HIDE)) {
                console.log("========= displayPasscode");
                displayPasscode = await this.screenPasscodeManageCommand(undefined, aesKey);
                console.log("========= displayPasscode:", displayPasscode);
            }
            if (featureList.has(FeatureValue_1.FeatureValue.AUTO_LOCK)) {
                console.log("========= autoLockTime");
                autoLockTime = await this.searchAutoLockTimeCommand(undefined, aesKey);
                console.log("========= autoLockTime:", autoLockTime);
            }
            // if (featureList.has(FeatureValue.LAMP)) {
            //   console.log("========= lightingTime");
            //   lightingTime = await this.controlLampCommand(undefined, aesKey);
            //   console.log("========= lightingTime:", lightingTime);
            // }
            if (featureList.has(FeatureValue_1.FeatureValue.GET_ADMIN_CODE)) {
                // Command.COMM_GET_ADMIN_CODE
                console.log("========= getAdminCode");
                adminPasscode = await this.getAdminCodeCommand(aesKey);
                console.log("========= getAdminCode", adminPasscode);
                if (adminPasscode == "") {
                    console.log("========= set adminPasscode");
                    adminPasscode = await this.setAdminKeyboardPwdCommand(undefined, aesKey);
                    console.log("========= set adminPasscode:", adminPasscode);
                }
            }
            else if (this.device.lockType == Lock_1.LockType.LOCK_TYPE_V3_CAR) {
                // Command.COMM_GET_ALARM_ERRCORD_OR_OPERATION_FINISHED
            }
            else if (this.device.lockType == Lock_1.LockType.LOCK_TYPE_V3) {
                console.log("========= set adminPasscode");
                adminPasscode = await this.setAdminKeyboardPwdCommand(undefined, aesKey);
                console.log("========= set adminPasscode:", adminPasscode);
            }
            // console.log("========= init passwords");
            // pwdInfo = await this.initPasswordsCommand(aesKey);
            // console.log("========= init passwords:", pwdInfo);
            if (featureList.has(FeatureValue_1.FeatureValue.CONFIG_GATEWAY_UNLOCK)) {
                console.log("========= remoteUnlock");
                remoteUnlock = await this.controlRemoteUnlockCommand(undefined, aesKey);
                console.log("========= remoteUnlock:", remoteUnlock);
            }
            console.log("========= finished");
            await this.operateFinishedCommand(aesKey);
            console.log("========= finished");
            // save all the data we gathered during init sequence
            if (aesKey)
                this.privateData.aesKey = Buffer.from(aesKey);
            if (admin)
                this.privateData.admin = admin;
            if (featureList)
                this.featureList = featureList;
            if (switchState)
                this.switchState = switchState;
            if (lockSound)
                this.lockSound = lockSound;
            if (displayPasscode)
                this.displayPasscode = displayPasscode;
            if (autoLockTime)
                this.autoLockTime = autoLockTime;
            if (lightingTime)
                this.lightingTime = lightingTime;
            if (adminPasscode)
                this.privateData.adminPasscode = adminPasscode;
            if (pwdInfo)
                this.privateData.pwdInfo = pwdInfo;
            if (remoteUnlock)
                this.remoteUnlock = remoteUnlock;
            this.lockedStatus = LockedStatus_1.LockedStatus.LOCKED; // always locked by default
            // read device information
            console.log("========= device info");
            try {
                this.deviceInfo = await this.macro_readAllDeviceInfo(aesKey);
            }
            catch (error) {
                // this sometimes fails
                console.error(error);
            }
            console.log("========= device info:", this.deviceInfo);
        }
        catch (error) {
            console.error("Error while initialising lock", error);
            return false;
        }
        // TODO: we should now refresh the device's data (disconnect and reconnect maybe ?)
        this.initialized = true;
        this.emit("dataUpdated", this);
        return true;
    }
    /**
     * Wait for pending auto-lock notification if there is one
     */
    async waitForPendingAutoLock() {
        if (this.pendingAutoLock) {
            console.log("[AutoLock] Waiting for pending auto-lock notification...");
            await this.pendingAutoLock;
            console.log("[AutoLock] Pending auto-lock cleared");
        }
    }
    /**
     * Lock the lock
     */
    async lock() {
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        try {
            // Wait for any pending auto-lock notification
            await this.waitForPendingAutoLock();
            // Ensure minimum delay since last command
            await this.device.ensureCommandDelay();
            
            console.log("========= check user time");
            const psFromLock = await this.checkUserTime();
            console.log("========= check user time", psFromLock);
            console.log("========= lock");
            const lockData = await this.lockCommand(psFromLock);
            console.log("========= lock", lockData);
            
            // Wait for SearchBicycleStatusCommand as confirmation (expected status = 0 = locked)
            const confirmedStatus = await this.waitForStatusConfirmation(0, 3000);
            console.log("========= lock confirmed, status:", confirmedStatus);
            
            this.lockedStatus = LockedStatus_1.LockedStatus.LOCKED;
            this.emit("locked", this);
        }
        catch (error) {
            console.error("Error locking the lock", error);
            return false;
        }
        return true;
    }
    /**
     * Unlock the lock
     */
    async unlock() {
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        try {
            // Wait for any pending auto-lock notification
            await this.waitForPendingAutoLock();
            // Ensure minimum delay since last command
            await this.device.ensureCommandDelay();
            
            console.log("========= check user time");
            const psFromLock = await this.checkUserTime();
            console.log("========= check user time", psFromLock);
            console.log("========= unlock");
            const unlockData = await this.unlockCommand(psFromLock);
            console.log("========= unlock", unlockData);
            
            // Note: The lock does NOT send a SearchBicycleStatusCommand confirmation after unlock
            // It only sends confirmation after lock. The unlock command response itself is the confirmation.
            
            this.lockedStatus = LockedStatus_1.LockedStatus.UNLOCKED;
            this.emit("unlocked", this);
            // if autolock is on, set up pending auto-lock promise
            if (this.autoLockTime > 0) {
                console.log(`[AutoLock] Auto-lock is active (${this.autoLockTime}s), setting up pending lock...`);
                this.pendingAutoLock = new Promise((resolve) => {
                    this.pendingAutoLockResolver = resolve;
                    // Timeout after autoLockTime + 2s margin
                    setTimeout(() => {
                        if (this.pendingAutoLockResolver) {
                            console.log("[AutoLock] Timeout waiting for auto-lock notification");
                            this.pendingAutoLockResolver = null;
                            this.pendingAutoLock = null;
                            resolve();
                        }
                    }, (this.autoLockTime + 2) * 1000);
                });
            }
        }
        catch (error) {
            console.error("Error unlocking the lock", error);
            return false;
        }
        return true;
    }
    /**
     * Get the status of the lock (locked or unlocked)
     */
    async getLockStatus(noCache = false) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        const oldStatus = this.lockedStatus;
        if (noCache || this.lockedStatus == LockedStatus_1.LockedStatus.UNKNOWN) {
            if (!this.isConnected()) {
                throw new Error("Lock is not connected");
            }
            try {
                console.log("========= check lock status");
                this.lockedStatus = await this.searchBycicleStatusCommand();
                console.log("========= check lock status", this.lockedStatus);
            }
            catch (error) {
                console.error("Error getting lock status", error);
            }
        }
        if (oldStatus != this.lockedStatus) {
            if (this.lockedStatus == LockedStatus_1.LockedStatus.LOCKED) {
                this.emit("locked", this);
            }
            else {
                this.emit("unlocked", this);
            }
        }
        return this.lockedStatus;
    }
    async getAutolockTime(noCache = false) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        const oldAutoLockTime = this.autoLockTime;
        if (noCache || this.autoLockTime == -1) {
            // Check if lock supports auto-lock: either via featureList or if autoLockTime was previously set
            const hasAutoLockFeature = (typeof this.featureList != "undefined" && this.featureList.has(FeatureValue_1.FeatureValue.AUTO_LOCK))
                || (oldAutoLockTime >= 0);
            if (hasAutoLockFeature) {
                if (!this.isConnected()) {
                    throw new Error("Lock is not connected");
                }
                try {
                    if (await this.macro_adminLogin()) {
                        console.log("========= autoLockTime");
                        this.autoLockTime = await this.searchAutoLockTimeCommand();
                        console.log("========= autoLockTime:", this.autoLockTime);
                    }
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
        if (oldAutoLockTime != this.autoLockTime) {
            this.emit("dataUpdated", this);
        }
        return this.autoLockTime;
    }
    async setAutoLockTime(autoLockTime) {
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (this.autoLockTime != autoLockTime) {
            // Check if lock supports auto-lock: either via featureList or if autoLockTime was previously set
            const hasAutoLockFeature = (typeof this.featureList != "undefined" && this.featureList.has(FeatureValue_1.FeatureValue.AUTO_LOCK))
                || (this.autoLockTime != -1);
            if (hasAutoLockFeature) {
                try {
                    if (await this.macro_adminLogin()) {
                        console.log("========= autoLockTime");
                        await this.searchAutoLockTimeCommand(autoLockTime);
                        console.log("========= autoLockTime");
                        this.autoLockTime = autoLockTime;
                        this.emit("dataUpdated", this);
                        return true;
                    }
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
        return false;
    }
    async getLockSound(noCache = false) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        const oldSound = this.lockSound;
        if (noCache || this.lockSound == AudioManage_1.AudioManage.UNKNOWN) {
            if (typeof this.featureList != "undefined" && this.featureList.has(FeatureValue_1.FeatureValue.AUDIO_MANAGEMENT)) {
                if (!this.isConnected()) {
                    throw new Error("Lock is not connected");
                }
                try {
                    console.log("========= lockSound");
                    this.lockSound = await this.audioManageCommand();
                    console.log("========= lockSound:", this.lockSound);
                }
                catch (error) {
                    console.error("Error getting lock sound status", error);
                }
            }
        }
        if (oldSound != this.lockSound) {
            this.emit("dataUpdated", this);
        }
        return this.lockSound;
    }
    async setLockSound(lockSound) {
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (this.lockSound != lockSound) {
            if (typeof this.featureList != "undefined" && this.featureList.has(FeatureValue_1.FeatureValue.AUDIO_MANAGEMENT)) {
                try {
                    if (await this.macro_adminLogin()) {
                        console.log("========= lockSound");
                        this.lockSound = await this.audioManageCommand(lockSound);
                        console.log("========= lockSound:", this.lockSound);
                        this.emit("dataUpdated", this);
                        return true;
                    }
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
        return false;
    }
    async resetLock() {
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= reset");
                await this.resetLockCommand();
                console.log("========= reset");
            }
            else {
                return false;
            }
        }
        catch (error) {
            console.error("Error while reseting the lock", error);
            return false;
        }
        await this.disconnect();
        this.emit("lockReset", this.device.address, this.device.id);
        return true;
    }
    async getPassageMode() {
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        let data = [];
        try {
            if (await this.macro_adminLogin()) {
                let sequence = 0;
                do {
                    console.log("========= get passage mode");
                    const response = await this.getPassageModeCommand(sequence);
                    console.log("========= get passage mode", response);
                    sequence = response.sequence;
                    response.data.forEach((passageData) => {
                        data.push(passageData);
                    });
                } while (sequence != -1);
            }
        }
        catch (error) {
            console.error("Error while getting passage mode", error);
        }
        return data;
    }
    async setPassageMode(data) {
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= set passage mode");
                await this.setPassageModeCommand(data);
                console.log("========= set passage mode");
            }
            else {
                return false;
            }
        }
        catch (error) {
            console.error("Error while getting passage mode", error);
            return false;
        }
        return true;
    }
    async deletePassageMode(data) {
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= delete passage mode");
                await this.setPassageModeCommand(data, PassageModeOperate_1.PassageModeOperate.DELETE);
                console.log("========= delete passage mode");
            }
        }
        catch (error) {
            console.error("Error while deleting passage mode", error);
            return false;
        }
        return true;
    }
    async clearPassageMode() {
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= clear passage mode");
                await this.clearPassageModeCommand();
                console.log("========= clear passage mode");
            }
            else {
                return false;
            }
        }
        catch (error) {
            console.error("Error while deleting passage mode", error);
            return false;
        }
        return true;
    }
    /**
     * Add a new passcode to unlock
     * @param type PassCode type: 1 - permanent, 2 - one time, 3 - limited time
     * @param passCode 4-9 digits code
     * @param startDate Valid from YYYYMMDDHHmm
     * @param endDate Valid to YYYYMMDDHHmm
     */
    async addPassCode(type, passCode, startDate, endDate) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasPassCode()) {
            throw new Error("No PassCode support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= add passCode");
                const result = await this.createCustomPasscodeCommand(type, passCode, startDate, endDate);
                console.log("========= add passCode", result);
                return result;
            }
            else {
                return false;
            }
        }
        catch (error) {
            console.error("Error while adding passcode", error);
            return false;
        }
    }
    /**
     * Update a passcode to unlock
     * @param type PassCode type: 1 - permanent, 2 - one time, 3 - limited time
     * @param oldPassCode 4-9 digits code - old code
     * @param newPassCode 4-9 digits code - new code
     * @param startDate Valid from YYYYMMDDHHmm
     * @param endDate Valid to YYYYMMDDHHmm
     */
    async updatePassCode(type, oldPassCode, newPassCode, startDate, endDate) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasPassCode()) {
            throw new Error("No PassCode support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= update passCode");
                const result = await this.updateCustomPasscodeCommand(type, oldPassCode, newPassCode, startDate, endDate);
                console.log("========= update passCode", result);
                return result;
            }
            else {
                return false;
            }
        }
        catch (error) {
            console.error("Error while updating passcode", error);
            return false;
        }
    }
    /**
     * Delete a set passcode
     * @param type PassCode type: 1 - permanent, 2 - one time, 3 - limited time
     * @param passCode 4-9 digits code
     */
    async deletePassCode(type, passCode) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasPassCode()) {
            throw new Error("No PassCode support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= delete passCode");
                const result = await this.deleteCustomPasscodeCommand(type, passCode);
                console.log("========= delete passCode", result);
                return result;
            }
            else {
                return false;
            }
        }
        catch (error) {
            console.error("Error while deleting passcode", error);
            return false;
        }
    }
    /**
     * Remove all stored passcodes
     */
    async clearPassCodes() {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasPassCode()) {
            throw new Error("No PassCode support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= clear passCodes");
                const result = await this.clearCustomPasscodesCommand();
                console.log("========= clear passCodes", result);
                return result;
            }
            else {
                return false;
            }
        }
        catch (error) {
            console.error("Error while clearing passcodes", error);
            return false;
        }
    }
    /**
     * Get all valid passcodes
     */
    async getPassCodes() {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasPassCode()) {
            throw new Error("No PassCode support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        let data = [];
        try {
            if (await this.macro_adminLogin()) {
                let sequence = 0;
                do {
                    console.log("========= get passCodes", sequence);
                    const response = await this.getCustomPasscodesCommand(sequence);
                    console.log("========= get passCodes", response);
                    sequence = response.sequence;
                    response.data.forEach((passageData) => {
                        data.push(passageData);
                    });
                } while (sequence != -1);
            }
        }
        catch (error) {
            console.error("Error while getting passCodes", error);
        }
        return data;
    }
    /**
     * Add an IC Card
     * @param startDate Valid from YYYYMMDDHHmm
     * @param endDate Valid to YYYYMMDDHHmm
     * @param cardNumber serial number of an already known card
     * @returns serial number of the card that was added
     */
    async addICCard(startDate, endDate, cardNumber) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasICCard()) {
            throw new Error("No IC Card support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        let data = "";
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= add IC Card");
                if (typeof cardNumber != "undefined") {
                    const addedCardNumber = await this.addICCommand(cardNumber, startDate, endDate);
                    console.log("========= add IC Card", addedCardNumber);
                }
                else {
                    const addedCardNumber = await this.addICCommand();
                    console.log("========= updating IC Card", addedCardNumber);
                    const response = await this.updateICCommand(addedCardNumber, startDate, endDate);
                    console.log("========= updating IC Card", response);
                    data = addedCardNumber;
                }
            }
        }
        catch (error) {
            console.error("Error while adding IC Card", error);
        }
        return data;
    }
    /**
     * Update an IC Card
     * @param cardNumber Serial number of the card
     * @param startDate Valid from YYYYMMDDHHmm
     * @param endDate Valid to YYYYMMDDHHmm
     */
    async updateICCard(cardNumber, startDate, endDate) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasICCard()) {
            throw new Error("No IC Card support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        let data = false;
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= updating IC Card", cardNumber);
                const response = await this.updateICCommand(cardNumber, startDate, endDate);
                console.log("========= updating IC Card", response);
                data = response;
            }
        }
        catch (error) {
            console.error("Error while updating IC Card", error);
        }
        return data;
    }
    /**
     * Delete an IC Card
     * @param cardNumber Serial number of the card
     */
    async deleteICCard(cardNumber) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasICCard()) {
            throw new Error("No IC Card support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        let data = false;
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= updating IC Card", cardNumber);
                const response = await this.deleteICCommand(cardNumber);
                console.log("========= updating IC Card", response);
                data = response;
            }
        }
        catch (error) {
            console.error("Error while adding IC Card", error);
        }
        return data;
    }
    /**
     * Clear all IC Card data
     */
    async clearICCards() {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasICCard()) {
            throw new Error("No IC Card support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        let data = false;
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= clearing IC Cards");
                const response = await this.clearICCommand();
                console.log("========= clearing IC Cards", response);
                data = response;
            }
        }
        catch (error) {
            console.error("Error while clearing IC Cards", error);
        }
        return data;
    }
    /**
     * Get all valid IC cards and their validity interval
     */
    async getICCards() {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasICCard()) {
            throw new Error("No IC Card support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        let data = [];
        try {
            if (await this.macro_adminLogin()) {
                let sequence = 0;
                do {
                    console.log("========= get IC Cards", sequence);
                    const response = await this.getICCommand(sequence);
                    console.log("========= get IC Cards", response);
                    sequence = response.sequence;
                    response.data.forEach((card) => {
                        data.push(card);
                    });
                } while (sequence != -1);
            }
        }
        catch (error) {
            console.error("Error while getting IC Cards", error);
        }
        return data;
    }
    /**
     * Add a Fingerprint
     * @param startDate Valid from YYYYMMDDHHmm
     * @param endDate Valid to YYYYMMDDHHmm
     * @returns serial number of the firngerprint that was added
     */
    async addFingerprint(startDate, endDate) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasFingerprint()) {
            throw new Error("No fingerprint support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        let data = "";
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= add Fingerprint");
                const fpNumber = await this.addFRCommand();
                console.log("========= updating Fingerprint", fpNumber);
                const response = await this.updateFRCommand(fpNumber, startDate, endDate);
                console.log("========= updating Fingerprint", response);
                data = fpNumber;
            }
        }
        catch (error) {
            console.error("Error while adding Fingerprint", error);
        }
        return data;
    }
    /**
     * Update a fingerprint
     * @param fpNumber Serial number of the fingerprint
     * @param startDate Valid from YYYYMMDDHHmm
     * @param endDate Valid to YYYYMMDDHHmm
     */
    async updateFingerprint(fpNumber, startDate, endDate) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasFingerprint()) {
            throw new Error("No fingerprint support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        let data = false;
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= updating Fingerprint", fpNumber);
                const response = await this.updateFRCommand(fpNumber, startDate, endDate);
                console.log("========= updating Fingerprint", response);
                data = response;
            }
        }
        catch (error) {
            console.error("Error while updating Fingerprint", error);
        }
        return data;
    }
    /**
     * Delete a fingerprint
     * @param fpNumber Serial number of the fingerprint
     */
    async deleteFingerprint(fpNumber) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasFingerprint()) {
            throw new Error("No fingerprint support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        let data = false;
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= updating Fingerprint", fpNumber);
                const response = await this.deleteFRCommand(fpNumber);
                console.log("========= updating Fingerprint", response);
                data = response;
            }
        }
        catch (error) {
            console.error("Error while adding Fingerprint", error);
        }
        return data;
    }
    /**
     * Clear all fingerprint data
     */
    async clearFingerprints() {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasFingerprint()) {
            throw new Error("No fingerprint support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        let data = false;
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= clearing Fingerprints");
                const response = await this.clearFRCommand();
                console.log("========= clearing Fingerprints", response);
                data = response;
            }
        }
        catch (error) {
            console.error("Error while clearing Fingerprints", error);
        }
        return data;
    }
    /**
     * Get all valid IC cards and their validity interval
     */
    async getFingerprints() {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.hasFingerprint()) {
            throw new Error("No fingerprint support");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        let data = [];
        try {
            if (await this.macro_adminLogin()) {
                let sequence = 0;
                do {
                    console.log("========= get Fingerprints", sequence);
                    const response = await this.getFRCommand(sequence);
                    console.log("========= get Fingerprints", response);
                    sequence = response.sequence;
                    response.data.forEach((fingerprint) => {
                        data.push(fingerprint);
                    });
                } while (sequence != -1);
            }
        }
        catch (error) {
            console.error("Error while getting Fingerprints", error);
        }
        return data;
    }
    /**
     * No ideea what this does ...
     * @param type
     */
    async setRemoteUnlock(type) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (typeof this.featureList == "undefined") {
            throw new Error("Lock features missing");
        }
        if (!this.featureList.has(FeatureValue_1.FeatureValue.CONFIG_GATEWAY_UNLOCK)) {
            throw new Error("Lock does not support remote unlock");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        try {
            if (await this.macro_adminLogin()) {
                console.log("========= remoteUnlock");
                if (typeof type != "undefined") {
                    this.remoteUnlock = await this.controlRemoteUnlockCommand(type);
                }
                else {
                    this.remoteUnlock = await this.controlRemoteUnlockCommand();
                }
                console.log("========= remoteUnlock:", this.remoteUnlock);
            }
        }
        catch (error) {
            console.error("Error on remote unlock", error);
        }
        return this.remoteUnlock;
    }
    async getOperationLog(all = false, noCache = false) {
        if (!this.initialized) {
            throw new Error("Lock is in pairing mode");
        }
        if (!this.isConnected()) {
            throw new Error("Lock is not connected");
        }
        let newOperations = [];
        // in all mode do the following
        // - get new operations
        // - sort operation log by recordNumber
        // - create list of missing/invalid recordNumber
        // - fetch those records
        const maxRetry = 3;
        // first, always get new operations
        if (this.hasNewEvents()) {
            let sequence = 0xffff;
            let retry = 0;
            do {
                console.log("========= get OperationLog", sequence);
                try {
                    const response = await this.getOperationLogCommand(sequence);
                    sequence = response.sequence;
                    for (let log of response.data) {
                        if (log) {
                            newOperations.push(log);
                            this.operationLog[log.recordNumber] = log;
                        }
                    }
                    retry = 0;
                }
                catch (error) {
                    retry++;
                }
            } while (sequence > 0 && retry < maxRetry);
        }
        // if all operations were requested
        if (all) {
            let operations = [];
            let maxRecordNumber = 0;
            if (noCache) {
                // if cache will not be used start with only the new operations
                for (let log of newOperations) {
                    if (log) {
                        operations[log.recordNumber] = log;
                        if (log.recordNumber > maxRecordNumber) {
                            maxRecordNumber = log.recordNumber;
                        }
                    }
                }
            }
            else {
                // otherwise copy current operation log
                for (let log of this.operationLog) {
                    if (log) {
                        operations[log.recordNumber] = log;
                        if (log.recordNumber > maxRecordNumber) {
                            maxRecordNumber = log.recordNumber;
                        }
                    }
                }
            }
            if (operations.length == 0) {
                // if no operations, start with 0 and keep going
                let sequence = 0;
                let failedSequences = 0;
                let retry = 0;
                do {
                    console.log("========= get OperationLog", sequence);
                    try {
                        const response = await this.getOperationLogCommand(sequence);
                        sequence = response.sequence;
                        console.log("========= get OperationLog next seq", sequence);
                        for (let log of response.data) {
                            operations[log.recordNumber] = log;
                        }
                        retry = 0;
                    }
                    catch (error) {
                        retry++;
                        // some operations just can't be read
                        if (retry == maxRetry) {
                            console.log("========= get OperationLog skip seq", sequence);
                            sequence++;
                            failedSequences++;
                            retry = 0;
                        }
                    }
                } while (sequence > 0 && retry < maxRetry);
            }
            else {
                // if we have operations, check for missing
                let missing = [];
                for (let i = 0; i < maxRecordNumber; i++) {
                    if (typeof operations[i] == "undefined" || operations[i] == null) {
                        missing.push(i);
                    }
                }
                for (let sequence of missing) {
                    let retry = 0;
                    let success = false;
                    do {
                        console.log("========= get OperationLog", sequence);
                        try {
                            const response = await this.getOperationLogCommand(sequence);
                            for (let log of response.data) {
                                operations[log.recordNumber] = log;
                            }
                            retry = 0;
                            success = true;
                        }
                        catch (error) {
                            retry++;
                        }
                    } while (!success && retry < maxRetry);
                }
            }
            this.operationLog = operations;
            this.emit("dataUpdated", this);
            return this.operationLog;
        }
        else {
            if (newOperations.length > 0) {
                this.emit("dataUpdated", this);
            }
            return newOperations;
        }
    }
    onDataReceived(command) {
        // is this just a notification (like the lock was locked/unlocked etc.)
        if (process.env.TTLOCK_DEBUG) {
            console.log("[onDataReceived] Command received, crcok:", command.crcok, "type:", command.commandType);
        }
        if (this.privateData.aesKey) {
            command.setAesKey(this.privateData.aesKey);
            const cmd = command.getCommand();
            const data = cmd.getRawData();
            if (process.env.TTLOCK_DEBUG) {
                console.log("Received:", command);
                if (data) {
                    console.log("Data", data.toString("hex"));
                }
            }
            // Check if this is a SearchBicycleStatusCommand (status confirmation)
            // The command must have getLockStatus AND be a SearchBicycleStatusCommand (first byte = 0x14)
            const isSearchBicycleStatus = data && data.length > 0 && data[0] === 0x14;
            if (isSearchBicycleStatus && typeof cmd.getLockStatus === 'function') {
                const lockStatus = cmd.getLockStatus();
                console.log("[StatusConfirmation] Lock status confirmed:", lockStatus === 1 ? "UNLOCKED" : "LOCKED");
                this.emit("statusConfirmation", lockStatus);
                
                // If we receive a LOCKED status and there's a pending auto-lock, resolve it
                if (lockStatus === 0 && this.pendingAutoLockResolver) {
                    console.log("[AutoLock] Auto-lock notification received, clearing pending lock");
                    this.lockedStatus = LockedStatus_1.LockedStatus.LOCKED;
                    this.emit("locked", this);
                    this.pendingAutoLockResolver();
                    this.pendingAutoLockResolver = null;
                    this.pendingAutoLock = null;
                }
            }
        }
        else {
            console.error("Unable to decrypt notification, no AES key");
        }
    }
    /**
     * Wait for status confirmation from the lock (SearchBicycleStatusCommand)
     * @param expectedStatus Expected status (0=locked, 1=unlocked), or -1 for any
     * @param timeout Timeout in ms
     * @returns Promise that resolves with the status, or rejects on timeout
     */
    waitForStatusConfirmation(expectedStatus = -1, timeout = 3000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.removeListener("statusConfirmation", handler);
                console.log("[StatusConfirmation] Timeout");
                resolve(-1); // Resolve with -1 on timeout instead of rejecting
            }, timeout);
            
            const handler = (status) => {
                if (expectedStatus === -1 || status === expectedStatus) {
                    clearTimeout(timeoutId);
                    this.removeListener("statusConfirmation", handler);
                    resolve(status);
                }
            };
            
            this.on("statusConfirmation", handler);
        });
    }
    async onConnected() {
        if (this.isPaired() && !this.skipDataRead) {
            // read general data
            console.log("Connected to known lock, reading general data");
            try {
                if (typeof this.featureList == "undefined") {
                    // Search device features
                    console.log("========= feature list");
                    this.featureList = await this.searchDeviceFeatureCommand();
                    console.log("========= feature list", this.featureList);
                }
                // Auto lock time
                if (this.featureList.has(FeatureValue_1.FeatureValue.AUTO_LOCK) && this.autoLockTime == -1 && await this.macro_adminLogin()) {
                    console.log("========= autoLockTime");
                    this.autoLockTime = await this.searchAutoLockTimeCommand();
                    console.log("========= autoLockTime:", this.autoLockTime);
                }
                if (this.lockedStatus == LockedStatus_1.LockedStatus.UNKNOWN) {
                    // Locked/unlocked status
                    console.log("========= check lock status");
                    this.lockedStatus = await this.searchBycicleStatusCommand();
                    console.log("========= check lock status", this.lockedStatus);
                }
                if (this.featureList.has(FeatureValue_1.FeatureValue.AUDIO_MANAGEMENT) && this.lockSound == AudioManage_1.AudioManage.UNKNOWN) {
                    console.log("========= lockSound");
                    this.lockSound = await this.audioManageCommand();
                    console.log("========= lockSound:", this.lockSound);
                }
            }
            catch (error) {
                console.error("Failed reading all general data from lock", error);
                // TODO: judge the error and fail connect
            }
        }
        else {
            if (this.device.isUnlock) {
                this.lockedStatus = LockedStatus_1.LockedStatus.UNLOCKED;
            }
            else {
                this.lockedStatus = LockedStatus_1.LockedStatus.LOCKED;
            }
        }
        // are we still connected ? It is possible the lock will disconnect while reading general data
        if (this.device.connected) {
            this.connected = true;
            this.emit("connected", this);
        }
    }
    async onDisconnected() {
        this.connected = false;
        this.adminAuth = false;
        this.connecting = false;
        this.emit("disconnected", this);
    }
    async onTTDeviceUpdated() {
        this.updateFromTTDevice();
    }
    getLockData() {
        var _a;
        if (this.isPaired()) {
            const privateData = {
                aesKey: (_a = this.privateData.aesKey) === null || _a === void 0 ? void 0 : _a.toString("hex"),
                admin: this.privateData.admin,
                adminPasscode: this.privateData.adminPasscode,
                pwdInfo: this.privateData.pwdInfo
            };
            const data = {
                address: this.device.address,
                battery: this.batteryCapacity,
                rssi: this.rssi,
                autoLockTime: this.autoLockTime ? this.autoLockTime : -1,
                lockedStatus: this.lockedStatus,
                privateData: privateData,
                operationLog: this.operationLog
            };
            return data;
        }
    }
    /** Just for debugging */
    toJSON(asObject = false) {
        let json = this.device.toJSON(true);
        if (this.featureList)
            Reflect.set(json, 'featureList', this.featureList);
        if (this.switchState)
            Reflect.set(json, 'switchState', this.switchState);
        if (this.lockSound)
            Reflect.set(json, 'lockSound', this.lockSound);
        if (this.displayPasscode)
            Reflect.set(json, 'displayPasscode', this.displayPasscode);
        if (this.autoLockTime)
            Reflect.set(json, 'autoLockTime', this.autoLockTime);
        if (this.lightingTime)
            Reflect.set(json, 'lightingTime', this.lightingTime);
        if (this.remoteUnlock)
            Reflect.set(json, 'remoteUnlock', this.remoteUnlock);
        if (this.deviceInfo)
            Reflect.set(json, 'deviceInfo', this.deviceInfo);
        const privateData = {};
        if (this.privateData.aesKey)
            Reflect.set(privateData, 'aesKey', this.privateData.aesKey.toString("hex"));
        if (this.privateData.admin)
            Reflect.set(privateData, 'admin', this.privateData.admin);
        if (this.privateData.adminPasscode)
            Reflect.set(privateData, 'adminPasscode', this.privateData.adminPasscode);
        if (this.privateData.pwdInfo)
            Reflect.set(privateData, 'pwdInfo', this.privateData.pwdInfo);
        Reflect.set(json, 'privateData', privateData);
        if (this.operationLog)
            Reflect.set(json, 'operationLog', this.operationLog);
        if (asObject) {
            return json;
        }
        else {
            return JSON.stringify(json);
        }
    }
}
exports.TTLock = TTLock;
