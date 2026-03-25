import { Vector3 } from "@babylonjs/core";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyAttackIdleState } from "./EnemyAttackIdleState";
import type { ActionBehavior } from "../../core/interfaces/Behaviors";
import { EnemyState } from "../../core/abstracts/EnemyState";

export class EnemyAttackState extends EnemyState {
    public readonly name = "AttackState";

    private _hasDealtDamage: boolean = false;
    private _currentAttack!: ActionBehavior;

    protected handleEnter(owner: Enemy): void {
        this._hasDealtDamage = false;
        this._currentAttack = owner.getNextAttack();

        owner.velocity.setAll(0);

        // Appel avec priorité = true
        owner.playAnim(this._currentAttack.animationName, false, true);
        this._currentAttack.executeEffect(owner);
    }

    protected handleUpdate(owner: Enemy, _dt: number): void {
        // Logique d'impact
        if (
            !this._hasDealtDamage &&
            this.timeInState >= this._currentAttack.damageMoment
        ) {
            this.checkHit(owner);
            this._hasDealtDamage = true;
        }

        // Fin de l'état
        if (this.timeInState >= this._currentAttack.duration) {
            owner.attackFSM.transitionTo(new EnemyAttackIdleState());
        }
    }

    private checkHit(owner: Enemy): void {
        const target = owner.targetTransform;
        if (!target) return;

        const dist = Vector3.Distance(owner.position, target.position);
        if (dist <= this._currentAttack.range) {
            this._currentAttack.onHit(owner, target.id);
        }
    }
}
