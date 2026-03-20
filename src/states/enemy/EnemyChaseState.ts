import { Vector3, Scalar, TransformNode } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyIdleState } from "./EnemyIdleState";
import { SteeringManager } from "../../managers/SteeringManager";

export class EnemyChaseState extends BaseState<Enemy> {
    public readonly name = "ChaseState";

    protected handleEnter(owner: Enemy): void {
        owner.playAnim("relax", true);
    }

    protected handleUpdate(owner: Enemy, dt: number): void {
        const target = owner.targetTransform;

        if (!target) {
            owner.fsm.transitionTo(new EnemyIdleState());
            return;
        }

        const dist = Vector3.Distance(owner.position, target.position);

        // --- 1. MOUVEMENT ---
        if (dist > owner.config.interactionRange) {
            const seekForce = SteeringManager.seek(owner, target.position);
            const neighbors = owner.getNearbyNeighbors();
            const sepForce = SteeringManager.separate(owner, neighbors, 10.0);

            const steering = seekForce
                .scale(owner.config.weights.seek)
                .add(sepForce.scale(owner.config.weights.separation));

            owner.velocity.addInPlace(steering.scale(dt * 10));

            if (owner.velocity.length() > owner.config.maxSpeed) {
                owner.velocity.normalize().scaleInPlace(owner.config.maxSpeed);
            }
        } else {
            owner.velocity.scaleInPlace(Math.pow(0.01, dt));
            if (owner.velocity.length() < 0.1) {
                owner.velocity.setAll(0);
                owner.playAnim("relax", true);
            }
        }

        owner.move(owner.velocity, dt);

        // --- 2. ORIENTATION (SUR LES BONS AXES) ---
        // On récupère le pivot visuel (celui qui a l'offset -1)
        const visualPivot =
            owner.transform
                .getChildMeshes()
                .find((m) => m.name.includes("visual_pivot"))?.parent ||
            owner.transform
                .getChildren()
                .find((c) => c.name.includes("visual_pivot"));

        if (visualPivot instanceof TransformNode) {
            const diffX = target.position.x - owner.transform.position.x;

            // SI PI/2 FAISAIT DEVANT/DERRIERE :
            // Alors Droite = 0 et Gauche = PI (180°)
            const targetAngle = diffX > 0 ? 0 : Math.PI;

            visualPivot.rotation.y = Scalar.LerpAngle(
                visualPivot.rotation.y,
                targetAngle,
                owner.config.turnSpeed * (dt * 60),
            );
        }

        // --- 3. TRANSITION ---
        if (dist > owner.config.escapeRange) {
            owner.fsm.transitionTo(new EnemyIdleState());
        }
    }
}
