'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTDevice = void 0;
const events_1 = require("events");
const Lock_1 = require("../constant/Lock");
class TTDevice extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        // public data
        this.id = "";
        this.uuid = "";
        this.name = "";
        this.manufacturer = "unknown";
        this.model = "unknown";
        this.hardware = "unknown";
        this.firmware = "unknown";
        this.address = "";
        this.rssi = 0;
        /** @type {byte} */
        this.protocolType = 0;
        /** @type {byte} */
        this.protocolVersion = 0;
        /** @type {byte} */
        this.scene = 0;
        /** @type {byte} */
        this.groupId = 0;
        /** @type {byte} */
        this.orgId = 0;
        /** @type {byte} */
        this.lockType = Lock_1.LockType.UNKNOWN;
        this.isTouch = false;
        this.isUnlock = false;
        this.hasEvents = true;
        this.isSettingMode = false;
        /** @type {byte} */
        this.txPowerLevel = 0;
        /** @type {byte} */
        this.batteryCapacity = -1;
        /** @type {number} */
        this.date = 0;
        this.isWristband = false;
        this.isRoomLock = false;
        this.isSafeLock = false;
        this.isBicycleLock = false;
        this.isLockcar = false;
        this.isGlassLock = false;
        this.isPadLock = false;
        this.isCyLinder = false;
        this.isRemoteControlDevice = false;
        this.isDfuMode = false;
        this.isNoLockService = false;
        this.remoteUnlockSwitch = 0;
        this.disconnectStatus = 0;
        this.parkStatus = 0;
    }
    toJSON(asObject = false) {
        const temp = new TTDevice();
        var json = {};
        // exclude keys that we don't need from the export
        const excludedKeys = new Set([
            "_eventsCount"
        ]);
        Object.getOwnPropertyNames(temp).forEach((key) => {
            if (!excludedKeys.has(key)) {
                const val = Reflect.get(this, key);
                if (typeof val != 'undefined' && ((typeof val == "string" && val != "") || typeof val != "string")) {
                    if ((typeof val) == "object") {
                        if (val.length && val.length > 0) {
                            Reflect.set(json, key, val.toString('hex'));
                        }
                    }
                    else {
                        Reflect.set(json, key, val);
                    }
                }
            }
        });
        if (asObject) {
            return json;
        }
        else {
            return JSON.stringify(json);
        }
    }
}
exports.TTDevice = TTDevice;
