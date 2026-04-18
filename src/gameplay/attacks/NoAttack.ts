import type { ActionBehavior } from "../../core/interfaces/Behaviors";
import { Enemy } from "../../core/abstracts/Enemy";

export class NoAttack implements ActionBehavior {
    public readonly animationName = "NO_ATTACK";
    public readonly duration = 0;
    public readonly damageMoment = 0;
    public readonly range = 0;

    executeEffect(_owner: Enemy): void {}

    onHit(_owner: Enemy, _targetId: string): void {}
}
