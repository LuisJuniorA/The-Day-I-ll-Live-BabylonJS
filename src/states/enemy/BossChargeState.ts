import { Vector3, Scalar } from "@babylonjs/core";
import { EnemyState } from "../../core/abstracts/EnemyState";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyChaseState } from "./EnemyChaseState";
import type { HookPoint } from "../../core/engines/HookScanner";
import { EnemyAttackIdleState } from "./EnemyAttackIdleState";
import type { ShadowBoss } from "../../entities/enemies/ShadowBoss";

export class BossChargeState extends EnemyState {
    public readonly name = "ChargeState";

    private _target: HookPoint;
    private _startPosition: Vector3 = new Vector3();
    private _duration: number = 1.0; // Durée du déplacement
    private _windUpDuration: number = 1.0; // 1 seconde de préparation

    private _hasDealtDamage: boolean = false;
    private _damageRange: number = 4;

    constructor(target: HookPoint) {
        super();
        this._target = target;
    }

    public get targetPosition(): Vector3 {
        return this._target.position;
    }

    protected handleEnter(owner: Enemy): void {
        this._hasDealtDamage = false;
        this._startPosition.copyFrom(owner.position);
        owner.velocity.setAll(0);

        // Optionnel : Lancer ici l'animation de préparation (ex: "charge_windup")
        // owner.playAnim("charge_windup", false, true);
    }

    protected handleUpdate(owner: Enemy, _dt: number): void {
        // Phase 1 : Préparation (le boss ne bouge pas, il se tourne vers la cible)
        if (this.timeInState < this._windUpDuration) {
            const chargeDir = this.targetPosition
                .subtract(owner.position)
                .normalize();
            this._rotateTowardsDirection(owner, chargeDir);
            return;
        }

        // Phase 2 : Charge (le boss se déplace)
        const chargeTime = this.timeInState - this._windUpDuration;
        const progress = Math.min(chargeTime / this._duration, 1);
        const smoothedProgress = Scalar.SmoothStep(0, 1, progress);

        const newPos = Vector3.Lerp(
            this._startPosition,
            this.targetPosition,
            smoothedProgress,
        );
        owner.position.copyFrom(newPos);

        // Rotation pendant la charge
        const chargeDir = this.targetPosition
            .subtract(this._startPosition)
            .normalize();
        this._rotateTowardsDirection(owner, chargeDir);

        // Logique d'impact
        if (!this._hasDealtDamage) {
            this.checkHit(owner);
        }

        // Fin de l'état
        if (progress >= 1) {
            owner.movementFSM.transitionTo(new EnemyChaseState());
            owner.attackFSM.transitionTo(new EnemyAttackIdleState());
        }
    }

    private checkHit(owner: Enemy): void {
        const target = owner.targetTransform;
        if (!target) return;

        const dist = Vector3.Distance(owner.position, target.position);

        if (dist <= this._damageRange) {
            (owner as ShadowBoss).currentAttack?.onHit(owner, "Player");
            this._hasDealtDamage = true;
        }
    }

    private _rotateTowardsDirection(owner: Enemy, dir: Vector3): void {
        const angle = Math.atan2(dir.x, dir.z);
        owner.transform.rotation.y = Scalar.LerpAngle(
            owner.transform.rotation.y,
            angle,
            0.2,
        );
    }
}
