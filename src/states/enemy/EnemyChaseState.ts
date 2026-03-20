import { Vector3, Scalar } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyIdleState } from "./EnemyIdleState";
import { SteeringManager } from "../../managers/SteeringManager";

export class EnemyChaseState extends BaseState<Enemy> {
    public readonly name = "ChaseState";

    protected handleEnter(owner: Enemy): void {
        owner.playAnim("run", true);
    }

    protected handleUpdate(owner: Enemy, dt: number): void {
        const target = owner.targetTransform;
        if (!target) {
            owner.fsm.transitionTo(new EnemyIdleState());
            return;
        }

        const dist = Vector3.Distance(owner.position, target.position);

        // --- LOGIQUE IA ---
        if (dist > owner.config.interactionRange) {
            // Forces de steering
            const seekForce = SteeringManager.seek(owner, target.position);

            // RAYON DE SÉPARATION : Il doit être supérieur à la largeur physique de tes ennemis.
            // Si tes ennemis font 1 mètre de diamètre, mets un rayon de 1.5 ou 2.0.
            const neighbors = owner.getNearbyNeighbors();
            const sepForce = SteeringManager.separate(owner, neighbors, 10.0);

            // Combinaison des forces.
            // LE SECRET DU SEPARATE : Son coefficient (weights.separation) doit être ÉLEVÉ.
            // Essaie weights.seek = 1.0 et weights.separation = 5.0 pour tester.
            const steering = seekForce
                .scale(owner.config.weights.seek)
                .add(sepForce.scale(owner.config.weights.separation));

            // Application de l'accélération (On multiplie par 10 pour la nervosité)
            owner.velocity.addInPlace(steering.scale(dt * 10));

            // Limitation de la vitesse max
            if (owner.velocity.length() > owner.config.maxSpeed) {
                owner.velocity.normalize().scaleInPlace(owner.config.maxSpeed);
            }
        } else {
            // Freinage doux (Damping indépendant du framerate)
            owner.velocity.scaleInPlace(Math.pow(0.01, dt)); // Réduit la vitesse de 99% par seconde

            if (owner.velocity.length() < 0.1) {
                owner.velocity.setAll(0);
                owner.playAnim("idle", true);
            }
        }

        // --- APPLICATION PHYSIQUE CENTRALISÉE ---
        // C'est CA qui synchronise le pivot logique (Transform) et évite les TP.
        owner.move(owner.velocity, dt);

        // --- ROTATION VISUELLE (Indépendante du framerate) ---
        if (owner.mesh && owner.velocity.length() > 0.2) {
            const targetAngle = Math.atan2(owner.velocity.x, owner.velocity.z);

            // On lisse la rotation avec turnSpeed (ex: 0.1) normalisé à 60fps
            owner.mesh.rotation.y = Scalar.LerpAngle(
                owner.mesh.rotation.y,
                targetAngle,
                owner.config.turnSpeed * (dt * 60),
            );
        }

        // Transitions
        if (dist > owner.config.escapeRange) {
            owner.fsm.transitionTo(new EnemyIdleState());
        }
    }
}
