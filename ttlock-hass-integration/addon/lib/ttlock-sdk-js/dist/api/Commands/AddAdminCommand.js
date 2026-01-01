'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAdminCommand = void 0;
const CommandResponse_1 = require("../../constant/CommandResponse");
const CommandType_1 = require("../../constant/CommandType");
const Command_1 = require("../Command");
class AddAdminCommand extends Command_1.Command {
    generateNumber() {
        return Math.floor(Math.random() * 100000000);
    }
    setAdminPs(adminPassword) {
        if (adminPassword) {
            this.adminPs = adminPassword;
        }
        else {
            this.adminPs = this.generateNumber();
        }
        return this.adminPs;
    }
    getAdminPs() {
        return this.adminPs;
    }
    setUnlockKey(unlockNumber) {
        if (unlockNumber) {
            this.unlockKey = unlockNumber;
        }
        else {
            this.unlockKey = this.generateNumber();
        }
        return this.unlockKey;
    }
    getUnlockKey() {
        return this.unlockKey;
    }
    processData() {
        var _a;
        const data = (_a = this.commandData) === null || _a === void 0 ? void 0 : _a.toString();
        if (data != "SCIENER") {
            this.commandResponse = CommandResponse_1.CommandResponse.FAILED;
        }
    }
    build() {
        if (this.adminPs && this.unlockKey) {
            const adminUnlock = Buffer.alloc(8); //new ArrayBuffer(8);
            adminUnlock.writeInt32BE(this.adminPs, 0);
            adminUnlock.writeInt32BE(this.unlockKey, 4);
            return Buffer.concat([
                adminUnlock,
                Buffer.from("SCIENER"),
            ]);
        }
        else {
            throw new Error("adminPs and unlockKey were not set");
        }
    }
}
exports.AddAdminCommand = AddAdminCommand;
AddAdminCommand.COMMAND_TYPE = CommandType_1.CommandType.COMM_ADD_ADMIN;
