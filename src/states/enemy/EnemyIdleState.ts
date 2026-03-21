import { Vector3 } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyChaseState } from "./EnemyChaseState";

export class EnemyIdleState extends BaseState<Enemy> {
    public readonly name = "IdleState";

    protected handleUpdate(owner: Enemy, dt: number): void {
        owner.velocity.y = owner.isGrounded ? -1 : 0.91 * dt;

        // Rafraîchissement de l'animation
        owner.playIdle();

        owner.move(owner.velocity, dt);

        const target = owner.targetTransform;
        if (target) {
            const distance = Vector3.Distance(owner.position, target.position);
            if (distance <= owner.config.detectionRange) {
                owner.movementFSM.transitionTo(new EnemyChaseState());
            }
        }
    }
}
