import { Vector3, Scalar } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyIdleState } from "./EnemyIdleState";

export class EnemyChaseState extends BaseState<Enemy> {
    public readonly name = "ChaseState";
    private readonly ESCAPE_RANGE = 18; // Distance à laquelle l'ennemi abandonne

    protected handleUpdate(owner: Enemy, dt: number): void {
        const target = owner.targetTransform;

        // 1. Sortie de l'état si plus de cible
        if (!target) {
            owner.fsm.transitionTo(new EnemyIdleState());
            return;
        }

        const targetPos = target.position;
        const currentPos = owner.position;

        // 2. Calcul du mouvement
        const direction = targetPos.subtract(currentPos);
        direction.y = 0; // On reste sur le plan horizontal
        const distance = direction.length();

        // Si on est encore loin, on avance
        if (distance > 1.2) {
            direction.normalize();

            // Calcul des vélocités cibles
            const targetVX = direction.x * owner.stats.speed;
            const targetVZ = direction.z * owner.stats.speed;

            // Lerp pour un mouvement fluide
            owner.velocity.x = Scalar.Lerp(owner.velocity.x, targetVX, 0.1);
            owner.velocity.z = Scalar.Lerp(owner.velocity.z, targetVZ, 0.1);

            // Orientation du mesh vers la cible (uniquement sur l'axe Y)
            owner.mesh?.lookAt(new Vector3(targetPos.x, currentPos.y, targetPos.z));
        } else {
            // On freine si on est arrivé
            owner.velocity.x = Scalar.Lerp(owner.velocity.x, 0, 0.2);
            owner.velocity.z = Scalar.Lerp(owner.velocity.z, 0, 0.2);
        }

        // 3. Application du mouvement avec moveWithCollisions
        // On multiplie par dt pour la frame et on ajoute une gravité constante
        const movement = new Vector3(
            owner.velocity.x * dt,
            -0.1,
            owner.velocity.z * dt
        );
        owner.mesh?.moveWithCollisions(movement);

        // 4. Transitions basées sur le ProximitySystem (tracking)

        // Si le ProximitySystem dit qu'on est au corps à corps
        if (owner.isNear) {
            // owner.fsm.transitionTo(new EnemyAttackState());
            console.log(`${owner.name} est à portée !`);
        }

        // Si le joueur a semé l'ennemi
        if (distance > this.ESCAPE_RANGE) {
            owner.fsm.transitionTo(new EnemyIdleState());
        }
    }
}