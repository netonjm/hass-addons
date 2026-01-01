/// <reference types="node" />
import { CommandType } from "../../constant/CommandType";
import { FeatureValue } from "../../constant/FeatureValue";
import { Command } from "../Command";
export declare class DeviceFeaturesCommand extends Command {
    static COMMAND_TYPE: CommandType;
    private batteryCapacity?;
    private special?;
    private featureList?;
    protected processData(): void;
    protected readFeatures(data?: Buffer): string;
    protected processFeatures(features: number): Set<FeatureValue>;
    getBatteryCapacity(): number;
    getSpecial(): number;
    getFeaturesList(): Set<FeatureValue>;
    build(): Buffer;
}
