'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AESKeyCommand = void 0;
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class AESKeyCommand extends Command_1.Command {
    processData() {
        if (this.commandData) {
            this.setAESKey(this.commandData);
        }
    }
    build() {
        if (this.aesKey) {
            return Buffer.concat([
                Buffer.from([AESKeyCommand.COMMAND_TYPE, this.commandResponse]),
                this.aesKey
            ]);
        }
        else {
            return Buffer.from("SCIENER");
        }
    }
    setAESKey(key) {
        this.aesKey = key;
    }
    getAESKey() {
        return this.aesKey;
    }
}
exports.AESKeyCommand = AESKeyCommand;
AESKeyCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_GET_AES_KEY;
