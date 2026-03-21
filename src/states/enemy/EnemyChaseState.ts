import { Vector3, Scalar, TransformNode } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyIdleState } from "./EnemyIdleState";
import { EnemyAttackState } from "./EnemyAttackState";
import { EnemyAttackIdleState } from "./EnemyAttackIdleState";
import { SteeringSystem } from "../../core/engines/SteeringSystem";

export class EnemyChaseState extends BaseState<Enemy> {
    public readonly name = "ChaseState";

    protected handleUpdate(owner: Enemy, dt: number): void {
        const target = owner.targetTransform;

        if (!target) {
            owner.movementFSM.transitionTo(new EnemyIdleState());
            return;
        }

        const dist = Vector3.Distance(owner.position, target.position);

        // --- 1. MOUVEMENT ---
        if (dist > owner.config.interactionRange) {
            const seekForce = SteeringSystem.seek(owner, target.position);
            const neighbors = owner.getNearbyNeighbors();
            const sepForce = SteeringSystem.separate(owner, neighbors, 10.0);

            const steering = seekForce
                .scale(owner.config.weights.seek)
                .add(sepForce.scale(owner.config.weights.separation));

            owner.velocity.addInPlace(steering.scale(dt * 10));

            if (owner.velocity.length() > owner.config.maxSpeed) {
                owner.velocity.normalize().scaleInPlace(owner.config.maxSpeed);
            }

            // On demande l'anim à chaque frame (sera ignorée si une attaque tourne)
            owner.playMove();
        } else {
            owner.velocity.scaleInPlace(Math.pow(0.01, dt));
            if (owner.velocity.length() < 0.1) {
                owner.velocity.setAll(0);
            }
            owner.playIdle();
        }

        owner.move(owner.velocity, dt);

        // --- 2. ORIENTATION ---
        this.updateOrientation(owner, target, dt);

        // --- 3. LOGIQUE D'ATTAQUE ---
        if (dist <= owner.config.interactionRange) {
            const currentAttackState = owner.attackFSM.currentState;
            if (currentAttackState instanceof EnemyAttackIdleState) {
                if (currentAttackState.canAttack) {
                    owner.attackFSM.transitionTo(new EnemyAttackState());
                }
            }
        }

        // --- 4. ABANDON ---
        if (dist > owner.config.escapeRange) {
            owner.movementFSM.transitionTo(new EnemyIdleState());
        }
    }

    private updateOrientation(
        owner: Enemy,
        target: TransformNode,
        dt: number,
    ): void {
        const visualPivot =
            owner.transform
                .getChildMeshes()
                .find((m) => m.name.includes("visual_pivot"))?.parent ||
            owner.transform
                .getChildren()
                .find((c) => c.name.includes("visual_pivot"));

        if (visualPivot instanceof TransformNode) {
            const diffX = target.position.x - owner.transform.position.x;
            const targetAngle = diffX > 0 ? 0 : Math.PI;

            visualPivot.rotation.y = Scalar.LerpAngle(
                visualPivot.rotation.y,
                targetAngle,
                owner.config.turnSpeed * (dt * 60),
            );
        }
    }
}
