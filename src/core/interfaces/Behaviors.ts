import { Enemy } from "../abstracts/Enemy";
import type { Entity } from "../abstracts/Entity";

export interface ActionBehavior {
    readonly animationName: string;
    readonly duration: number;
    readonly damageMoment: number;
    readonly range: number;
    cooldown?: number;
    lastUsed?: number;
    basePriority?: number;
    executeEffect(owner: Enemy): void;
    onHit(owner: Enemy, targetId: string): void;
}

export interface Behavior {
    update(owner: Entity, dt: number): void;
}
