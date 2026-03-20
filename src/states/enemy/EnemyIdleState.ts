import { Vector3 } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyChaseState } from "./EnemyChaseState";

export class EnemyIdleState extends BaseState<Enemy> {
    public readonly name = "IdleState";

    protected handleEnter(owner: Enemy): void {
        owner.velocity.setAll(0);
        owner.playAnim("idle", true);
    }

    protected handleUpdate(owner: Enemy, dt: number): void {
        // On applique une petite gravité constante (plus propre que le -0.1 en dur)
        owner.velocity.y = owner.isGrounded ? -1 : 0.91 * dt;

        // On utilise le nouveau move qui gère le Tunnel Z et la synchro
        owner.move(owner.velocity, dt);

        const target = owner.targetTransform;
        if (target) {
            const distance = Vector3.Distance(owner.position, target.position);

            // On utilise la config de l'ennemi pour la détection
            if (distance <= owner.config.detectionRange) {
                owner.fsm.transitionTo(new EnemyChaseState());
            }
        }
    }
}
