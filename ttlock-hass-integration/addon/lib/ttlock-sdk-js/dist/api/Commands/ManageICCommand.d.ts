/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { ICOperate } from "../../constant/ICOperate";
import { Command } from "../Command";
export interface ICCard {
    cardNumber: string;
    startDate: string;
    endDate: string;
}
export declare class ManageICCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private opType?;
    private sequence?;
    private cards?;
    private cardNumber?;
    private startDate?;
    private endDate?;
    private batteryCapacity?;
    protected processData(): void;
    build(): Buffer;
    getType(): ICOperate;
    getCardNumber(): string;
    setSequence(sequence?: number): void;
    getSequence(): number;
    setAdd(cardNumber?: string, startDate?: string, endDate?: string): void;
    setModify(cardNumber: string, startDate: string, endDate: string): void;
    setDelete(cardNumber: string): void;
    setClear(): void;
    getCards(): ICCard[];
    getBatteryCapacity(): number;
}
