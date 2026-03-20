import { BaseState } from "../../core/abstracts/BaseState";
import { Enemy } from "../../core/abstracts/Enemy";

export class EnemyAttackIdleState extends BaseState<Enemy> {
    public readonly name = "AttackIdle";

    private _cooldownTimer: number = 0;
    // On peut imaginer mettre ce cooldown dans la config de l'ennemi plus tard
    private readonly COOLDOWN_DURATION: number = 1.5;

    /**
     * Permet au ChaseState de savoir s'il peut déclencher une nouvelle attaque
     */
    public get canAttack(): boolean {
        return this._cooldownTimer >= this.COOLDOWN_DURATION;
    }

    protected handleEnter(): void {
        this._cooldownTimer = 0; // Reset le chrono au début du repos
    }

    protected handleUpdate(_owner: Enemy, dt: number): void {
        this._cooldownTimer += dt;
    }
}
