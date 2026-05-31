import { Vector3, Scalar } from "@babylonjs/core";
import { EnemyState } from "../../core/abstracts/EnemyState";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyChaseState } from "./EnemyChaseState";
import { EnemyAttackIdleState } from "./EnemyAttackIdleState";
import type { ShadowBoss } from "../../entities/enemies/ShadowBoss";
import { PoolManager } from "../../managers/PoolManager";
import { Player } from "../../entities/Player";
import { BossChaseState } from "./BossChaseState";

export class BossClawAttackState extends EnemyState {
    public readonly name = "ClawState";

    private _targetPosition: Vector3; // Utilisé comme destination du trait
    private _windUpDuration: number = 0.5;
    private _attackDuration: number = 0.8;
    private _damageMoment: number = 0;

    private _hasDealtDamage: boolean = false;

    constructor(targetPos: Vector3) {
        super();
        this._targetPosition = targetPos.clone();
    }

    public get targetPosition(): Vector3 {
        return this._targetPosition;
    }

    protected handleEnter(owner: Enemy): void {
        this._hasDealtDamage = false;
        owner.velocity.setAll(0);
    }

    protected handleUpdate(owner: Enemy, _dt: number): void {
        if (this.timeInState < this._windUpDuration) {
            const lookDir = this._targetPosition
                .subtract(owner.position)
                .normalize();
            this._rotateTowardsDirection(owner, lookDir);
            return;
        }

        const attackTime = this.timeInState - this._windUpDuration;

        if (!this._hasDealtDamage && attackTime >= this._damageMoment) {
            this.spawnAttackHitbox(owner);
            this._hasDealtDamage = true;
        }
        if (attackTime >= this._attackDuration) {
            owner.movementFSM.transitionTo(new BossChaseState());
            owner.attackFSM.transitionTo(new EnemyAttackIdleState());
        }
    }

    private spawnAttackHitbox(owner: Enemy): void {
        const start = owner.position;
        const end = this._targetPosition;

        const direction = end.subtract(start);
        const distance = Math.max(0.1, direction.length());

        // 1. Calculer le centre exact du segment
        const center = start.add(direction.scale(0.5));

        // 2. Spawn au centre (C'est là que la box veut naturellement être)
        const hitbox = PoolManager.getInstance().spawn(
            center,
            new Vector3(distance, 2, 10),
            0.5,
            (h) => {
                h.mesh.computeWorldMatrix(true);
                Player.staticMesh.computeWorldMatrix(true);
                if (h.mesh.intersectsMesh(Player.staticMesh, true)) {
                    (owner as ShadowBoss).currentAttack?.onHit(owner, "Player");
                    hitbox.mesh.rotation.y = 0; // On tourne la boîte de 90° à la création
                }
            },
            true,
        );

        // 3. Orientation : Au lieu de lookAt, on définit la rotation manuellement
        // Cela évite que le lookAt ne déplace le centre de la boîte par rapport au pivot.
        hitbox.mesh.rotation.y = Math.PI / 2; // On tourne la boîte de 90° à la création
        hitbox.mesh.lookAt(end);
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
