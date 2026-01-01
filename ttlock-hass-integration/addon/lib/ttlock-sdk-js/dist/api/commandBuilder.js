'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandFromType = exports.commandFromData = void 0;
const commands = __importStar(require("./Commands"));
// TODO: index commands based on COMMAND_TYPE for faster lookup
function getCommandClass(commandType) {
    let commandTypeInt = commandType;
    // if (typeof commandTypeInt == "string") {
    //   commandTypeInt = commandTypeInt.charCodeAt(0);
    // }
    const classNames = Object.keys(commands);
    for (let i = 0; i < classNames.length; i++) {
        if (classNames[i] != "UnknownCommand") {
            const commandClass = Reflect.get(commands, classNames[i]);
            let cmdTypeInt = commandClass.COMMAND_TYPE;
            // if (typeof cmdTypeInt == 'string') {
            //   cmdTypeInt = cmdTypeInt.charCodeAt(0);
            // }
            if (cmdTypeInt == commandTypeInt) {
                return commandClass;
            }
        }
    }
}
function commandFromData(data) {
    const commandType = data.readUInt8(0);
    const commandClass = getCommandClass(commandType);
    if (commandClass) {
        return Reflect.construct(commandClass, [data]);
    }
    else {
        return new commands.UnknownCommand(data);
    }
}
exports.commandFromData = commandFromData;
function commandFromType(commandType) {
    const commandClass = getCommandClass(commandType);
    if (commandClass) {
        return Reflect.construct(commandClass, []);
    }
    else {
        return new commands.UnknownCommand();
    }
}
exports.commandFromType = commandFromType;
