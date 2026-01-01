/// <reference types="node" />
import { Command } from "../Command";
export declare class UnknownCommand extends Command {
    protected processData(): void;
    build(): Buffer;
}
