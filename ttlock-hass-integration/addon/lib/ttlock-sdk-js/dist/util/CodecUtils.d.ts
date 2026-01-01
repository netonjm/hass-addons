/// <reference types="node" />
export declare class CodecUtils {
    static encodeWithEncrypt(p0: Buffer, key?: number): Buffer;
    static encode(p0: Buffer): Buffer;
    static decodeWithEncrypt(p0: Buffer, key?: number): Buffer;
    static decode(p0: Buffer): Buffer;
    static crccompute(p0: Buffer): number;
}
