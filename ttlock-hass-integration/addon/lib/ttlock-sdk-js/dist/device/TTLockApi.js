'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTLockApi = void 0;
const events_1 = require("events");
const __1 = require("..");
const AudioManage_1 = require("../constant/AudioManage");
const CommandResponse_1 = require("../constant/CommandResponse");
const CommandType_1 = require("../constant/CommandType");
const FeatureValue_1 = require("../constant/FeatureValue");
const AESUtil_1 = require("../util/AESUtil");
const Commands_1 = require("../api/Commands");
const PassageModeOperate_1 = require("../constant/PassageModeOperate");
const DeviceInfoEnum_1 = require("../constant/DeviceInfoEnum");
const ICOperate_1 = require("../constant/ICOperate");
const LockedStatus_1 = require("../constant/LockedStatus");
class TTLockApi extends events_1.EventEmitter {
    constructor(device, data) {
        super();
        this.adminAuth = false;
        this.device = device;
        this.privateData = {};
        if (this.device.isUnlock) {
            this.lockedStatus = LockedStatus_1.LockedStatus.UNLOCKED;
        }
        else {
            this.lockedStatus = LockedStatus_1.LockedStatus.LOCKED;
        }
        this.newEvents = this.device.hasEvents;
        this.autoLockTime = -1;
        this.lockSound = AudioManage_1.AudioManage.UNKNOWN;
        this.batteryCapacity = this.device.batteryCapacity;
        this.rssi = this.device.rssi;
        this.initialized = false; // just workaround for TypeScript
        this.operationLog = [];
        if (typeof data != "undefined") {
            this.updateLockData(data);
        }
        else {
            this.initialized = !this.device.isSettingMode;
        }
    }
    updateFromTTDevice() {
        let paramsChanged = {
            batteryCapacity: this.batteryCapacity != this.device.batteryCapacity,
            newEvents: (this.device.hasEvents && this.newEvents != this.device.hasEvents),
            lockedStatus: false
        };
        this.batteryCapacity = this.device.batteryCapacity;
        this.rssi = this.device.rssi;
        this.initialized = !this.device.isSettingMode;
        this.newEvents = this.device.hasEvents;
        if (this.device.isUnlock) {
            paramsChanged.lockedStatus = this.lockedStatus != LockedStatus_1.LockedStatus.UNLOCKED;
            this.lockedStatus = LockedStatus_1.LockedStatus.UNLOCKED;
        }
        else {
            paramsChanged.lockedStatus = this.lockedStatus != LockedStatus_1.LockedStatus.LOCKED;
            this.lockedStatus = LockedStatus_1.LockedStatus.LOCKED;
        }
        if (paramsChanged.batteryCapacity || paramsChanged.lockedStatus || paramsChanged.newEvents) {
            console.log("Emmiting paramsChanged", paramsChanged);
            this.emit("updated", this, paramsChanged);
        }
    }
    updateLockData(data) {
        const privateData = data.privateData;
        if (privateData.aesKey) {
            this.privateData.aesKey = Buffer.from(privateData.aesKey, "hex");
        }
        this.privateData.admin = privateData.admin;
        this.privateData.adminPasscode = privateData.adminPasscode;
        this.privateData.pwdInfo = privateData.pwdInfo;
        if (typeof data.operationLog != "undefined") {
            this.operationLog = data.operationLog;
        }
        if (typeof data.autoLockTime != "undefined") {
            this.autoLockTime = data.autoLockTime;
        }
        if (typeof data.lockedStatus != "undefined") {
            this.lockedStatus = data.lockedStatus;
        }
        this.initialized = true;
    }
    /**
     * Send init command
     */
    async initCommand() {
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, AESUtil_1.defaultAESKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_INITIALIZATION);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
        }
        else {
            throw new Error("No response to init");
        }
    }
    /**
     * Send get AESKey command
     */
    async getAESKeyCommand() {
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, AESUtil_1.defaultAESKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_GET_AES_KEY);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(AESUtil_1.defaultAESKey);
            let cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed getting AES key from lock");
            }
            if (cmd instanceof Commands_1.AESKeyCommand) {
                const command = cmd;
                const aesKey = command.getAESKey();
                if (aesKey) {
                    return aesKey;
                }
                else {
                    throw new Error("Unable to getAESKey");
                }
            }
            else {
                throw new Error("Invalid response to getAESKey");
            }
        }
        else {
            throw new Error("No response to getAESKey");
        }
    }
    /**
     * Send AddAdmin command
     */
    async addAdminCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_ADD_ADMIN);
        const addAdminCommand = requestEnvelope.getCommand();
        const admin = {
            adminPs: addAdminCommand.setAdminPs(),
            unlockKey: addAdminCommand.setUnlockKey(),
        };
        console.log("Setting adminPs", admin.adminPs, "and unlockKey", admin.unlockKey);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            console.log("[DEBUG AddAdmin] Response code:", cmd.getResponse(), "Expected SUCCESS:", CommandResponse_1.CommandResponse.SUCCESS);
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed AddAdmin - response code: " + cmd.getResponse());
            }
            return admin;
        }
        else {
            throw new Error("No response to AddAdmin");
        }
    }
    /**
     * Send CalibrationTime command
     */
    async calibrateTimeCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_TIME_CALIBRATE);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope, true, true);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed setting lock time");
            }
        }
        else {
            throw new Error("No response to time calibration");
        }
    }
    /**
     * Send SearchDeviceFeature command
     */
    async searchDeviceFeatureCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_SEARCHE_DEVICE_FEATURE);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed to search device features");
            }
            return cmd.getFeaturesList();
        }
        else {
            throw new Error("No response to search device features");
        }
    }
    async getSwitchStateCommand(newValue, aesKey) {
        throw new Error("Method not implemented.");
    }
    /**
     * Send AudioManage command to get or set the audio feedback
     */
    async audioManageCommand(newValue, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_AUDIO_MANAGE);
        if (typeof newValue != "undefined") {
            const cmd = requestEnvelope.getCommand();
            cmd.setNewValue(newValue);
        }
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed to set audio mode");
            }
            this.batteryCapacity = cmd.getBatteryCapacity();
            if (typeof newValue != "undefined") {
                return newValue;
            }
            else {
                const value = cmd.getValue();
                if (typeof value != "undefined") {
                    return value;
                }
                else {
                    throw new Error("Unable to get audioManage value");
                }
            }
        }
        else {
            throw new Error("No response to get audioManage");
        }
    }
    /**
     * Send ScreenPasscodeManage command to get or set password display
     */
    async screenPasscodeManageCommand(newValue, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_SHOW_PASSWORD);
        if (typeof newValue != "undefined") {
            const cmd = requestEnvelope.getCommand();
            cmd.setNewValue(newValue);
        }
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed to set screenPasscode mode");
            }
            if (typeof newValue != "undefined") {
                return newValue;
            }
            else {
                const value = cmd.getValue();
                if (value) {
                    return value;
                }
                else {
                    throw new Error("Unable to get screenPasscode value");
                }
            }
        }
        else {
            throw new Error("No response to get screenPasscode");
        }
    }
    async searchAutoLockTimeCommand(newValue, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_AUTO_LOCK_MANAGE);
        if (typeof newValue != "undefined") {
            const cmd = requestEnvelope.getCommand();
            cmd.setTime(newValue);
        }
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed to set/get autoLockTime");
            }
            return cmd.getTime();
        }
        else {
            throw new Error("No response to autoLockTime");
        }
    }
    async controlLampCommand(newValue, aesKey) {
        throw new Error("Method not implemented.");
    }
    async getAdminCodeCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_GET_ADMIN_CODE);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed to set adminPasscode");
            }
            const adminPasscode = cmd.getAdminPasscode();
            if (adminPasscode) {
                return adminPasscode;
            }
            else {
                return "";
            }
        }
        else {
            throw new Error("No response to get adminPasscode");
        }
    }
    /**
     * Send SetAdminKeyboardPwd
     */
    async setAdminKeyboardPwdCommand(adminPasscode, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        if (typeof adminPasscode == "undefined") {
            adminPasscode = "";
            for (let i = 0; i < 7; i++) {
                adminPasscode += (Math.floor(Math.random() * 10)).toString();
            }
            console.log("Generated adminPasscode:", adminPasscode);
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_SET_ADMIN_KEYBOARD_PWD);
        let cmd = requestEnvelope.getCommand();
        cmd.setAdminPasscode(adminPasscode);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed to set adminPasscode");
            }
            return adminPasscode;
        }
        else {
            throw new Error("No response to set adminPasscode");
        }
    }
    /**
     * Send InitPasswords command
     */
    async initPasswordsCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_INIT_PASSWORDS);
        let cmd = requestEnvelope.getCommand();
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            const pwdInfo = cmd.getPwdInfo();
            if (pwdInfo) {
                responseEnvelope.setAesKey(aesKey);
                cmd = responseEnvelope.getCommand();
                if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                    console.error(pwdInfo);
                    throw new Error("Failed to init passwords");
                }
                return pwdInfo;
            }
            else {
                throw new Error("Failed generating pwdInfo");
            }
        }
        else {
            throw new Error("No response to initPasswords");
        }
    }
    /**
     * Send ControlRemoteUnlock command to activate or disactivate remote unlock (via gateway?)
     */
    async controlRemoteUnlockCommand(newValue, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_CONTROL_REMOTE_UNLOCK);
        if (typeof newValue != "undefined") {
            const cmd = requestEnvelope.getCommand();
            cmd.setNewValue(newValue);
        }
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed to set remote unlock");
            }
            if (typeof newValue != "undefined") {
                return newValue;
            }
            else {
                this.batteryCapacity = cmd.getBatteryCapacity();
                const value = cmd.getValue();
                if (typeof value != "undefined") {
                    return value;
                }
                else {
                    throw new Error("Unable to get remote unlock value");
                }
            }
        }
        else {
            throw new Error("No response to get remote unlock");
        }
    }
    /**
     * Send OperateFinished command
     */
    async operateFinishedCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_GET_ALARM_ERRCORD_OR_OPERATION_FINISHED);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed to set operateFinished");
            }
        }
        else {
            throw new Error("No response to operateFinished");
        }
    }
    async readDeviceInfoCommand(infoType, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_READ_DEVICE_INFO);
        let cmd = requestEnvelope.getCommand();
        cmd.setInfoType(infoType);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                console.error("Failed deviceInfo response");
                // throw new Error("Failed deviceInfo response");
            }
            const infoData = cmd.getInfoData();
            if (infoData) {
                return infoData;
            }
            else {
                return Buffer.from([]);
            }
        }
        else {
            throw new Error("No response to deviceInfo");
        }
    }
    async checkAdminCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        if (typeof this.privateData.admin == "undefined" || typeof this.privateData.admin.adminPs == "undefined") {
            throw new Error("Admin data is not set");
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_CHECK_ADMIN);
        let cmd = requestEnvelope.getCommand();
        cmd.setParams(this.privateData.admin.adminPs);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed checkAdmin response");
            }
            return cmd.getPsFromLock();
        }
        else {
            throw new Error("No response to checkAdmin");
        }
    }
    async checkRandomCommand(psFromLock, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        if (typeof this.privateData.admin == "undefined" || typeof this.privateData.admin.unlockKey == "undefined") {
            throw new Error("Admin data is not set");
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_CHECK_RANDOM);
        let cmd = requestEnvelope.getCommand();
        cmd.setSum(psFromLock, this.privateData.admin.unlockKey);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed checkRandom response");
            }
        }
        else {
            throw new Error("No response to checkRandom");
        }
    }
    async resetLockCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_RESET_LOCK);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            // reset returns an empty response
        }
        else {
            throw new Error("No response to resetLock");
        }
    }
    async checkUserTime(startDate = '0001311400', endDate = "9911301400", aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_CHECK_USER_TIME);
        let cmd = requestEnvelope.getCommand();
        cmd.setPayload(0, startDate, endDate, 0);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            // Verify we got the right response type
            if (typeof cmd.getPsFromLock !== 'function') {
                console.log("[checkUserTime] Wrong response type, retrying...");
                // Got wrong response (e.g. SearchBicycleStatusCommand), retry once
                const retryEnvelope = await this.device.sendCommand(requestEnvelope);
                if (retryEnvelope) {
                    retryEnvelope.setAesKey(aesKey);
                    cmd = retryEnvelope.getCommand();
                }
            }
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed checkUserTime response");
            }
            if (typeof cmd.getPsFromLock !== 'function') {
                throw new Error("Invalid checkUserTime response type");
            }
            return cmd.getPsFromLock();
        }
        else {
            throw new Error("No response to checkUserTime");
        }
    }
    async unlockCommand(psFromLock, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        if (typeof this.privateData.admin == "undefined" || typeof this.privateData.admin.unlockKey == "undefined") {
            throw new Error("Admin data is not set");
        }
        console.log("[DEBUG unlock] psFromLock:", psFromLock);
        console.log("[DEBUG unlock] unlockKey:", this.privateData.admin.unlockKey);
        console.log("[DEBUG unlock] adminPs:", this.privateData.admin.adminPs);
        console.log("[DEBUG unlock] aesKey:", aesKey.toString('hex'));
        console.log("[DEBUG unlock] lockType:", this.device.lockType);
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_UNLOCK);
        let cmd = requestEnvelope.getCommand();
        cmd.setSum(psFromLock, this.privateData.admin.unlockKey);
        console.log("[DEBUG unlock] Command sum set, sending...");
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            console.log("[DEBUG unlock] Response code:", cmd.getResponse(), "Expected SUCCESS:", CommandResponse_1.CommandResponse.SUCCESS);
            console.log("[DEBUG unlock] CRC ok:", responseEnvelope.isCrcOk());
            console.log("[DEBUG unlock] Command data:", cmd.commandData ? cmd.commandData.toString('hex') : 'none');
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                const errorCode = cmd.commandData ? cmd.commandData.readUInt8(0) : -1;
                const errorMessages = {
                    0x02: 'NO_PERMISSION',
                    0x03: 'WRONG_ID_OR_PASSWORD',
                    0x04: 'REACH_LIMIT',
                    0x05: 'IN_SETTING',
                    0x06: 'SAME_USERID',
                    0x07: 'NO_ADMIN_YET',
                    0x08: 'DYNAMIC_PASSWORD_EXPIRED',
                    0x09: 'NO_DATA',
                    0x0a: 'LOCK_NO_POWER',
                    0x1e: 'PRIVACY_LOCK_ACTIVE - El bloqueo de privacidad está activo desde el interior. Desactívalo manualmente.'
                };
                const errorName = errorMessages[errorCode] || 'UNKNOWN';
                throw new Error("Failed unlock response (code: " + cmd.getResponse() + ", error: 0x" + errorCode.toString(16) + " " + errorName + ")");
            }
            // it is possible here that the UnlockCommand will have a bad CRC 
            // and we will read a SearchBicycleStatusCommand that is sent right after instead
            if (typeof cmd.getBatteryCapacity != "undefined") {
                this.batteryCapacity = cmd.getBatteryCapacity();
                return cmd.getUnlockData();
            }
            else {
                return {};
            }
        }
        else {
            throw new Error("No response to unlock");
        }
    }
    async lockCommand(psFromLock, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        if (typeof this.privateData.admin == "undefined" || typeof this.privateData.admin.unlockKey == "undefined") {
            throw new Error("Admin data is not set");
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_FUNCTION_LOCK);
        let cmd = requestEnvelope.getCommand();
        cmd.setSum(psFromLock, this.privateData.admin.unlockKey);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed unlock response");
            }
            // it is possible here that the LockCommand will have a bad CRC 
            // and we will read a SearchBicycleStatusCommand  that is sent right after instead
            if (typeof cmd.getBatteryCapacity != "undefined") {
                this.batteryCapacity = cmd.getBatteryCapacity();
                return cmd.getUnlockData();
            }
            else {
                return {};
            }
        }
        else {
            throw new Error("No response to unlock");
        }
    }
    async getPassageModeCommand(sequence = 0, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_CONFIGURE_PASSAGE_MODE);
        let cmd = requestEnvelope.getCommand();
        cmd.setSequence(sequence);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed get passage mode response");
            }
            return {
                sequence: cmd.getSequence(),
                data: cmd.getData()
            };
        }
        else {
            throw new Error("No response to get passage mode");
        }
    }
    async setPassageModeCommand(data, type = PassageModeOperate_1.PassageModeOperate.ADD, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_CONFIGURE_PASSAGE_MODE);
        let cmd = requestEnvelope.getCommand();
        cmd.setData(data, type);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed set passage mode response");
            }
            return true;
        }
        else {
            throw new Error("No response to set passage mode");
        }
    }
    async clearPassageModeCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_CONFIGURE_PASSAGE_MODE);
        let cmd = requestEnvelope.getCommand();
        cmd.setClear();
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed clear passage mode response");
            }
            return true;
        }
        else {
            throw new Error("No response to clear passage mode");
        }
    }
    async searchBycicleStatusCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_SEARCH_BICYCLE_STATUS);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed search status response");
            }
            return cmd.getLockStatus();
        }
        else {
            throw new Error("No response to search status");
        }
    }
    async createCustomPasscodeCommand(type, passCode, startDate, endDate, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_MANAGE_KEYBOARD_PASSWORD);
        let cmd = requestEnvelope.getCommand();
        cmd.addPasscode(type, passCode, startDate, endDate);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed create passcode response");
            }
            return true;
        }
        else {
            throw new Error("No response to create passcode");
        }
    }
    async updateCustomPasscodeCommand(type, oldPassCode, newPassCode, startDate, endDate, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_MANAGE_KEYBOARD_PASSWORD);
        let cmd = requestEnvelope.getCommand();
        cmd.updatePasscode(type, oldPassCode, newPassCode, startDate, endDate);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed update passcode response");
            }
            return true;
        }
        else {
            throw new Error("No response to update passcode");
        }
    }
    async deleteCustomPasscodeCommand(type, passCode, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_MANAGE_KEYBOARD_PASSWORD);
        let cmd = requestEnvelope.getCommand();
        cmd.deletePasscode(type, passCode);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed delete passcode response");
            }
            return true;
        }
        else {
            throw new Error("No response to delete passcode");
        }
    }
    async clearCustomPasscodesCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_MANAGE_KEYBOARD_PASSWORD);
        let cmd = requestEnvelope.getCommand();
        cmd.clearAllPasscodes();
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            const cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed clear passcodes response");
            }
            return true;
        }
        else {
            throw new Error("No response to clear passcodes");
        }
    }
    async getCustomPasscodesCommand(sequence = 0, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_PWD_LIST);
        let cmd = requestEnvelope.getCommand();
        cmd.setSequence(sequence);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope, true, true);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed get passCodes response");
            }
            return {
                sequence: cmd.getSequence(),
                data: cmd.getPasscodes()
            };
        }
        else {
            throw new Error("No response to get passCodes");
        }
    }
    async getICCommand(sequence = 0, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_IC_MANAGE);
        let cmd = requestEnvelope.getCommand();
        cmd.setSequence(sequence);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope, true, true);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed get IC response");
            }
            this.batteryCapacity = cmd.getBatteryCapacity();
            return {
                sequence: cmd.getSequence(),
                data: cmd.getCards()
            };
        }
        else {
            throw new Error("No response to get IC");
        }
    }
    async addICCommand(cardNumber, startDate, endDate, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_IC_MANAGE);
        let cmd = requestEnvelope.getCommand();
        if (typeof cardNumber != "undefined" && typeof startDate != "undefined" && typeof endDate != "undefined") {
            cmd.setAdd(cardNumber, startDate, endDate);
        }
        else {
            cmd.setAdd();
        }
        let responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS || (cmd.getType() != ICOperate_1.ICOperate.STATUS_ENTER_ADD_MODE && cmd.getType() != ICOperate_1.ICOperate.STATUS_ADD_SUCCESS)) {
                throw new Error("Failed add IC response");
            }
            if (typeof cardNumber != "undefined" && typeof startDate != "undefined" && typeof endDate != "undefined") {
                return cmd.getCardNumber();
            }
            this.emit("scanICStart", this);
            responseEnvelope = await this.device.waitForResponse();
            if (responseEnvelope) {
                responseEnvelope.setAesKey(aesKey);
                cmd = responseEnvelope.getCommand();
                if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS || cmd.getType() != ICOperate_1.ICOperate.STATUS_ADD_SUCCESS) {
                    throw new Error("Failed add IC response");
                }
                this.batteryCapacity = cmd.getBatteryCapacity();
                return cmd.getCardNumber();
            }
            else {
                throw new Error("No response to add IC");
            }
        }
        else {
            throw new Error("No response to add IC");
        }
    }
    async updateICCommand(cardNumber, startDate, endDate, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_IC_MANAGE);
        let cmd = requestEnvelope.getCommand();
        cmd.setModify(cardNumber, startDate, endDate);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed update IC");
            }
            this.batteryCapacity = cmd.getBatteryCapacity();
            return true;
        }
        else {
            throw new Error("No response to update IC");
        }
    }
    async deleteICCommand(cardNumber, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_IC_MANAGE);
        let cmd = requestEnvelope.getCommand();
        cmd.setDelete(cardNumber);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed delete IC");
            }
            this.batteryCapacity = cmd.getBatteryCapacity();
            return true;
        }
        else {
            throw new Error("No response to delete IC");
        }
    }
    async clearICCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_IC_MANAGE);
        let cmd = requestEnvelope.getCommand();
        cmd.setClear();
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed clear IC");
            }
            this.batteryCapacity = cmd.getBatteryCapacity();
            return true;
        }
        else {
            throw new Error("No response to clear IC");
        }
    }
    async getFRCommand(sequence = 0, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_FR_MANAGE);
        let cmd = requestEnvelope.getCommand();
        cmd.setSequence(sequence);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope, true, true);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed get FR response");
            }
            this.batteryCapacity = cmd.getBatteryCapacity();
            return {
                sequence: cmd.getSequence(),
                data: cmd.getFingerprints()
            };
        }
        else {
            throw new Error("No response to get FR");
        }
    }
    async addFRCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_FR_MANAGE);
        let cmd = requestEnvelope.getCommand();
        cmd.setAdd();
        let responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS || cmd.getType() != ICOperate_1.ICOperate.STATUS_ENTER_ADD_MODE) {
                throw new Error("Failed add FR mode response");
            }
            this.emit("scanFRStart", this);
            // Fingerprint scanning progress
            do {
                responseEnvelope = await this.device.waitForResponse();
                if (responseEnvelope) {
                    responseEnvelope.setAesKey(aesKey);
                    cmd = responseEnvelope.getCommand();
                    if (cmd.getType() == ICOperate_1.ICOperate.STATUS_FR_PROGRESS) {
                        this.emit("scanFRProgress", this);
                    }
                }
                else {
                    throw new Error("No response to add FR progress");
                }
            } while (cmd.getResponse() == CommandResponse_1.CommandResponse.SUCCESS && cmd.getType() == ICOperate_1.ICOperate.STATUS_FR_PROGRESS);
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed during FR progress");
            }
            if (cmd.getType() != ICOperate_1.ICOperate.STATUS_ADD_SUCCESS) {
                throw new Error("Failed to add FR");
            }
            this.batteryCapacity = cmd.getBatteryCapacity();
            return cmd.getFpNumber();
        }
        else {
            throw new Error("No response to add FR mode");
        }
    }
    async updateFRCommand(fpNumber, startDate, endDate, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_FR_MANAGE);
        let cmd = requestEnvelope.getCommand();
        cmd.setModify(fpNumber, startDate, endDate);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed update FR");
            }
            this.batteryCapacity = cmd.getBatteryCapacity();
            return true;
        }
        else {
            throw new Error("No response to update FR");
        }
    }
    async deleteFRCommand(fpNumber, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_FR_MANAGE);
        let cmd = requestEnvelope.getCommand();
        cmd.setDelete(fpNumber);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed delete FR");
            }
            this.batteryCapacity = cmd.getBatteryCapacity();
            return true;
        }
        else {
            throw new Error("No response to delete FR");
        }
    }
    async clearFRCommand(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_FR_MANAGE);
        let cmd = requestEnvelope.getCommand();
        cmd.setClear();
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed clear FR");
            }
            this.batteryCapacity = cmd.getBatteryCapacity();
            return true;
        }
        else {
            throw new Error("No response to clear FR");
        }
    }
    async getOperationLogCommand(sequence = 0xffff, aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const requestEnvelope = __1.CommandEnvelope.createFromLockType(this.device.lockType, aesKey);
        requestEnvelope.setCommandType(CommandType_1.CommandType.COMM_GET_OPERATE_LOG);
        let cmd = requestEnvelope.getCommand();
        cmd.setSequence(sequence);
        const responseEnvelope = await this.device.sendCommand(requestEnvelope);
        if (responseEnvelope) {
            responseEnvelope.setAesKey(aesKey);
            cmd = responseEnvelope.getCommand();
            if (cmd.getResponse() != CommandResponse_1.CommandResponse.SUCCESS) {
                throw new Error("Failed get OperationLog response");
            }
            return {
                sequence: cmd.getSequence(),
                data: cmd.getLogs()
            };
        }
        else {
            throw new Error("No response to get OperationLog");
        }
    }
    async macro_readAllDeviceInfo(aesKey) {
        if (typeof aesKey == "undefined") {
            if (this.privateData.aesKey) {
                aesKey = this.privateData.aesKey;
            }
            else {
                throw new Error("No AES key for lock");
            }
        }
        const deviceInfo = {
            featureValue: "",
            modelNum: "",
            hardwareRevision: "",
            firmwareRevision: "",
            nbNodeId: "",
            nbOperator: "",
            nbCardNumber: "",
            nbRssi: -1,
            factoryDate: "",
            lockClock: "",
        };
        deviceInfo.modelNum = (await this.readDeviceInfoCommand(DeviceInfoEnum_1.DeviceInfoEnum.MODEL_NUMBER, aesKey)).toString();
        deviceInfo.hardwareRevision = (await this.readDeviceInfoCommand(DeviceInfoEnum_1.DeviceInfoEnum.HARDWARE_REVISION, aesKey)).toString();
        deviceInfo.firmwareRevision = (await this.readDeviceInfoCommand(DeviceInfoEnum_1.DeviceInfoEnum.FIRMWARE_REVISION, aesKey)).toString();
        deviceInfo.factoryDate = (await this.readDeviceInfoCommand(DeviceInfoEnum_1.DeviceInfoEnum.MANUFACTURE_DATE, aesKey)).toString();
        if (this.featureList && this.featureList.has(FeatureValue_1.FeatureValue.NB_LOCK)) {
            deviceInfo.nbOperator = (await this.readDeviceInfoCommand(DeviceInfoEnum_1.DeviceInfoEnum.NB_OPERATOR, aesKey)).toString();
            deviceInfo.nbNodeId = (await this.readDeviceInfoCommand(DeviceInfoEnum_1.DeviceInfoEnum.NB_IMEI, aesKey)).toString();
            deviceInfo.nbCardNumber = (await this.readDeviceInfoCommand(DeviceInfoEnum_1.DeviceInfoEnum.NB_CARD_INFO, aesKey)).toString();
            deviceInfo.nbRssi = (await this.readDeviceInfoCommand(DeviceInfoEnum_1.DeviceInfoEnum.NB_RSSI, aesKey)).readInt8(0);
        }
        return deviceInfo;
    }
    async macro_adminLogin() {
        if (this.adminAuth) {
            return true;
        }
        try {
            console.log("========= check admin");
            const psFromLock = await this.checkAdminCommand();
            console.log("========= check admin:", psFromLock);
            if (psFromLock > 0) {
                console.log("========= check random");
                await this.checkRandomCommand(psFromLock);
                console.log("========= check random");
                this.adminAuth = true;
                return true;
            }
            else {
                console.error("Invalid psFromLock received", psFromLock);
            }
        }
        catch (error) {
            console.error("macro_adminLogin:", error);
        }
        return false;
    }
}
exports.TTLockApi = TTLockApi;
