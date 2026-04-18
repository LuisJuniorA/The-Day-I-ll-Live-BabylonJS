import { TransformNode } from "@babylonjs/core";

export interface Targeting {
    readonly transform: TransformNode;
    interactionRange: number;
    setProximityState(isNear: boolean): void;
}