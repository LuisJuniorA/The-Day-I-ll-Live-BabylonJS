import { Enemy } from "../../core/abstracts/Enemy";
import type { ActionBehavior } from "../../core/interfaces/Behaviors";

export class GenericEnemy extends Enemy {
    protected availableAttacks: ActionBehavior[] = [];
    public getNextAttack(): ActionBehavior {
        throw new Error("Method not implemented.");
    }
    public playIdle(): void {
        throw new Error("Method not implemented.");
    }
    public playMove(): void {
        throw new Error("Method not implemented.");
    }
}
