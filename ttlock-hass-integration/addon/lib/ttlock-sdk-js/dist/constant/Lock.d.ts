import { TTDevice } from "../device/TTDevice";
export declare enum LockType {
    UNKNOWN = 0,
    LOCK_TYPE_V1 = 1,
    /** 3.0 */
    LOCK_TYPE_V2 = 2,
    /** 5.1 */
    LOCK_TYPE_V2S = 3,
    /** 5.4 */
    LOCK_TYPE_V2S_PLUS = 4,
    /** Third generation lock 5.3 */
    LOCK_TYPE_V3 = 5,
    /** Parking lock a.1 */
    LOCK_TYPE_CAR = 6,
    /** Third generation parking lock 5.3.7 */
    LOCK_TYPE_V3_CAR = 8,
    /** Electric car lock b.1 */
    LOCK_TYPE_MOBI = 7
}
export declare class LockVersion {
    static lockVersion_V2S_PLUS: LockVersion;
    static lockVersion_V3: LockVersion;
    static lockVersion_V2S: LockVersion;
    /**
     *The second-generation parking lock scene is also changed to 7
     */
    static lockVersion_Va: LockVersion;
    /**
     *The electric car lock scene will be changed to 1 and there is no electric car lock
     */
    static lockVersion_Vb: LockVersion;
    static lockVersion_V2: LockVersion;
    static lockVersion_V3_car: LockVersion;
    private protocolType;
    private protocolVersion;
    private scene;
    private groupId;
    private orgId;
    constructor(protocolType: number, protocolVersion: number, scene: number, groupId: number, orgId: number);
    getProtocolType(): number;
    setProtocolType(protocolType: number): void;
    getProtocolVersion(): number;
    setProtocolVersion(protocolVersion: number): void;
    getScene(): number;
    setScene(scene: number): void;
    getGroupId(): number;
    setGroupId(groupId: number): void;
    getOrgId(): number;
    setOrgId(orgId: number): void;
    static getLockVersion(lockType: LockType): LockVersion | null;
    static getLockType(device: TTDevice): LockType;
    toString(): string;
}
