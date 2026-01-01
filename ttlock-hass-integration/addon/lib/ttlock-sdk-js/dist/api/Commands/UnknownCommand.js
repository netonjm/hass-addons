'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownCommand = void 0;
const Command_1 = require("../Command");
class UnknownCommand extends Command_1.Command {
    processData() {
        if (this.commandData) {
            console.error("Unknown command type 0x" + this.commandData.readInt8().toString(16), "succes", this.commandResponse, "data", this.commandData.toString("hex"));
        }
    }
    build() {
        throw new Error("Method not implemented.");
    }
}
exports.UnknownCommand = UnknownCommand;
