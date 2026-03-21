import { Enemy } from "../abstracts/Enemy";

export interface AttackBehavior {
    readonly animationName: string;
    readonly duration: number;
    readonly damageMoment: number;
    readonly range: number;
    executeEffect(owner: Enemy): void;
    onHit(owner: Enemy, targetId: string): void;
}
