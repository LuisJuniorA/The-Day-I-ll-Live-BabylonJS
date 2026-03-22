import { Enemy } from "../../core/abstracts/Enemy";
import type { AttackBehavior } from "../../core/interfaces/AttackBehavior";

export class GenericEnemy extends Enemy {
    protected availableAttacks: AttackBehavior[] = [];
    public getNextAttack(): AttackBehavior {
        throw new Error("Method not implemented.");
    }
    public playIdle(): void {
        throw new Error("Method not implemented.");
    }
    public playMove(): void {
        throw new Error("Method not implemented.");
    }
}
