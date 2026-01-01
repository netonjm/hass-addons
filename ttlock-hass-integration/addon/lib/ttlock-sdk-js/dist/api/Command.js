'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const CommandResponse_1 = require("../constant/CommandResponse");
class Command {
    constructor(data) {
        this.commandResponse = CommandResponse_1.CommandResponse.UNKNOWN;
        if (data) {
            this.commandResponse = data.readInt8(1);
            this.commandData = data.subarray(2);
            if (process.env.TTLOCK_DEBUG_COMM == "1") {
                console.log('Command:', this.commandData.toString("hex"));
            }
            this.processData();
        }
    }
    getResponse() {
        return this.commandResponse;
    }
    getRawData() {
        return this.commandRawData;
    }
}
exports.Command = Command;
