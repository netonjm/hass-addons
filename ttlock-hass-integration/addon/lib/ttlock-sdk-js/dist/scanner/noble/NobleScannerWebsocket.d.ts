import { NobleScanner } from "./NobleScanner";
export declare class NobleScannerWebsocket extends NobleScanner {
    private websocketAddress;
    private websocketPort;
    private aesKey;
    private username;
    private password;
    constructor(uuids?: string[], address?: string, port?: number, aesKey?: string, username?: string, password?: string);
    protected createNoble(): void;
    protected createNobleWebsocket(): void;
}
