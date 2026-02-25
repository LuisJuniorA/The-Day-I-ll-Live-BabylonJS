import { Vector3 } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyChaseState } from "./EnemyChaseState";

export class EnemyIdleState extends BaseState<Enemy> {
    public readonly name = "IdleState";
    private readonly DETECTION_RANGE = 12;

    protected handleEnter(owner: Enemy): void {
        owner.velocity.x = 0;
        owner.velocity.z = 0;
        // owner.playAnimation("idle");
    }

    protected handleUpdate(owner: Enemy, _dt: number): void {
        // Application de la gravité de base
        owner.mesh?.moveWithCollisions(new Vector3(0, -0.1, 0));

        const target = owner.targetTransform;
        if (target) {
            const distance = Vector3.Distance(owner.position, target.position);

            // Si le joueur entre dans la zone de détection, on passe en Chase
            if (distance <= this.DETECTION_RANGE) {
                owner.fsm.transitionTo(new EnemyChaseState());
            }
        }
    }
}