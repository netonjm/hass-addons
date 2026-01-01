'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NobleScannerWebsocket = void 0;
const NobleScanner_1 = require("./NobleScanner");
const NobleWebsocketBinding_1 = require("./NobleWebsocketBinding");
const Noble = require("@abandonware/noble/with-bindings");
class NobleScannerWebsocket extends NobleScanner_1.NobleScanner {
    constructor(uuids, address, port, aesKey, username, password) {
        super(uuids || []);
        this.websocketAddress = address || "127.0.0.1";
        this.websocketPort = port || 80;
        this.aesKey = aesKey || "f8b55c272eb007f501560839be1f1e7e";
        this.username = username || "admin";
        this.password = password || "admin";
        this.createNobleWebsocket();
        this.initNoble();
    }
    createNoble() {
    }
    createNobleWebsocket() {
        const binding = new NobleWebsocketBinding_1.NobleWebsocketBinding(this.websocketAddress, this.websocketPort, this.aesKey, this.username, this.password);
        this.noble = new Noble(binding);
    }
}
exports.NobleScannerWebsocket = NobleScannerWebsocket;
