/// <reference types="node" />
import { CommandType } from "../constant/CommandType";
import { Command } from "./Command";
export declare function commandFromData(data: Buffer): Command;
export declare function commandFromType(commandType: CommandType): Command;
