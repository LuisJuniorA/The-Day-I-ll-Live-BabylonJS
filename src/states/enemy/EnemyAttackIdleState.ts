import type { Enemy } from "../../core/abstracts/Enemy";
import { EnemyState } from "../../core/abstracts/EnemyState";

export class EnemyAttackIdleState extends EnemyState {
    public readonly name = "AttackIdle";
    private _cooldownTimer: number = 0;

    public get canAttack(): boolean {
        // On peut utiliser une valeur par défaut ou une valeur config
        const cd = 1.5;
        return this._cooldownTimer >= cd;
    }

    protected handleEnter(): void {
        this._cooldownTimer = 0;
    }

    protected handleUpdate(_owner: Enemy, dt: number): void {
        this._cooldownTimer += dt;
    }
}
