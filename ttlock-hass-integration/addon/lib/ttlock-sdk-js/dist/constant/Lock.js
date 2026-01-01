'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockVersion = exports.LockType = void 0;
var LockType;
(function (LockType) {
    LockType[LockType["UNKNOWN"] = 0] = "UNKNOWN";
    LockType[LockType["LOCK_TYPE_V1"] = 1] = "LOCK_TYPE_V1";
    /** 3.0 */
    LockType[LockType["LOCK_TYPE_V2"] = 2] = "LOCK_TYPE_V2";
    /** 5.1 */
    LockType[LockType["LOCK_TYPE_V2S"] = 3] = "LOCK_TYPE_V2S";
    /** 5.4 */
    LockType[LockType["LOCK_TYPE_V2S_PLUS"] = 4] = "LOCK_TYPE_V2S_PLUS";
    /** Third generation lock 5.3 */
    LockType[LockType["LOCK_TYPE_V3"] = 5] = "LOCK_TYPE_V3";
    /** Parking lock a.1 */
    LockType[LockType["LOCK_TYPE_CAR"] = 6] = "LOCK_TYPE_CAR";
    /** Third generation parking lock 5.3.7 */
    LockType[LockType["LOCK_TYPE_V3_CAR"] = 8] = "LOCK_TYPE_V3_CAR";
    /** Electric car lock b.1 */
    LockType[LockType["LOCK_TYPE_MOBI"] = 7] = "LOCK_TYPE_MOBI";
    //    /** Remote control equipment 5.3.10 */
    //    static LOCK_TYPE_REMOTE_CONTROL_DEVICE:number = 9;
    //    /** safe lock */
    //    static LOCK_TYPE_SAFE_LOCK:number = 8;
    //    /** bicycle lock */
    //    static LOCK_TYPE_BICYCLE:number = 9;
})(LockType = exports.LockType || (exports.LockType = {}));
class LockVersion {
    constructor(protocolType, protocolVersion, scene, groupId, orgId) {
        this.protocolType = protocolType;
        this.protocolVersion = protocolVersion;
        this.scene = scene;
        this.groupId = groupId;
        this.orgId = orgId;
    }
    getProtocolType() {
        return this.protocolType;
    }
    setProtocolType(protocolType) {
        this.protocolType = protocolType;
    }
    getProtocolVersion() {
        return this.protocolVersion;
    }
    setProtocolVersion(protocolVersion) {
        this.protocolVersion = protocolVersion;
    }
    getScene() {
        return this.scene;
    }
    setScene(scene) {
        this.scene = scene;
    }
    getGroupId() {
        return this.groupId;
    }
    setGroupId(groupId) {
        this.groupId = groupId;
    }
    getOrgId() {
        return this.orgId;
    }
    setOrgId(orgId) {
        this.orgId = orgId;
    }
    static getLockVersion(lockType) {
        switch (lockType) {
            case LockType.LOCK_TYPE_V3_CAR:
                return LockVersion.lockVersion_V3_car;
            case LockType.LOCK_TYPE_V3:
                return LockVersion.lockVersion_V3;
            case LockType.LOCK_TYPE_V2S_PLUS:
                return LockVersion.lockVersion_V2S_PLUS;
            case LockType.LOCK_TYPE_V2S:
                return LockVersion.lockVersion_V2S;
            case LockType.LOCK_TYPE_CAR:
                return LockVersion.lockVersion_Va;
            case LockType.LOCK_TYPE_MOBI:
                return LockVersion.lockVersion_Vb;
            case LockType.LOCK_TYPE_V2:
                return LockVersion.lockVersion_V2;
            default:
                return null;
        }
    }
    static getLockType(device) {
        if (device.lockType == LockType.UNKNOWN) {
            if (device.protocolType == 5 && device.protocolVersion == 3 && device.scene == 7) {
                device.lockType = LockType.LOCK_TYPE_V3_CAR;
            }
            else if (device.protocolType == 10 && device.protocolVersion == 1) {
                device.lockType = LockType.LOCK_TYPE_CAR;
            }
            else if (device.protocolType == 11 && device.protocolVersion == 1) {
                device.lockType = LockType.LOCK_TYPE_MOBI;
            }
            else if (device.protocolType == 5 && device.protocolVersion == 4) {
                device.lockType = LockType.LOCK_TYPE_V2S_PLUS;
            }
            else if (device.protocolType == 5 && device.protocolVersion == 3) {
                device.lockType = LockType.LOCK_TYPE_V3;
            }
            else if ((device.protocolType == 5 && device.protocolVersion == 1) || (device.name != null && device.name.toUpperCase().startsWith("LOCK_"))) {
                device.lockType = LockType.LOCK_TYPE_V2S;
            }
        }
        return device.lockType;
    }
    toString() {
        return this.protocolType + "," + this.protocolVersion + "," + this.scene + "," + this.groupId + "," + this.orgId;
    }
}
exports.LockVersion = LockVersion;
LockVersion.lockVersion_V2S_PLUS = new LockVersion(5, 4, 1, 1, 1);
LockVersion.lockVersion_V3 = new LockVersion(5, 3, 1, 1, 1);
LockVersion.lockVersion_V2S = new LockVersion(5, 1, 1, 1, 1);
/**
 *The second-generation parking lock scene is also changed to 7
 */
LockVersion.lockVersion_Va = new LockVersion(0x0a, 1, 0x07, 1, 1);
/**
 *The electric car lock scene will be changed to 1 and there is no electric car lock
 */
LockVersion.lockVersion_Vb = new LockVersion(0x0b, 1, 0x01, 1, 1);
LockVersion.lockVersion_V2 = new LockVersion(3, 0, 0, 0, 0);
LockVersion.lockVersion_V3_car = new LockVersion(5, 3, 7, 1, 1);
