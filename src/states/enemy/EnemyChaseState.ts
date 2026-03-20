import { Vector3, Scalar, TransformNode } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Enemy } from "../../core/abstracts/Enemy"; // Vérifie ton import
import { EnemyIdleState } from "./EnemyIdleState";
import { EnemyAttackState } from "./EnemyAttackState"; // Import indispensable
import { EnemyAttackIdleState } from "./EnemyAttackIdleState";
import { SteeringManager } from "../../managers/SteeringManager";

export class EnemyChaseState extends BaseState<Enemy> {
    public readonly name = "ChaseState";

    protected handleEnter(owner: Enemy): void {
        owner.playAnim("relax", true);
    }

    protected handleUpdate(owner: Enemy, dt: number): void {
        const target = owner.targetTransform;

        if (!target) {
            owner.movementFSM.transitionTo(new EnemyIdleState());
            return;
        }

        const dist = Vector3.Distance(owner.position, target.position);

        // --- 1. MOUVEMENT ---
        // Si on est plus loin que la portée d'interaction, on avance
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
        }
        // Si on est à portée, on freine proprement
        else {
            owner.velocity.scaleInPlace(Math.pow(0.01, dt));
            if (owner.velocity.length() < 0.1) {
                owner.velocity.setAll(0);
            }
        }

        owner.move(owner.velocity, dt);

        // --- 2. ORIENTATION ---
        this.updateOrientation(owner, target, dt);

        // --- 3. LOGIQUE D'ATTAQUE (Le lien entre les deux FSM) ---
        // Si on est assez proche ET que l'AttackFSM est au repos (Idle)
        if (dist <= owner.config.interactionRange) {
            const currentAttackState = owner.attackFSM.currentState;

            if (currentAttackState instanceof EnemyAttackIdleState) {
                if (currentAttackState.canAttack) {
                    owner.attackFSM.transitionTo(new EnemyAttackState());
                }
            }
        }

        // --- 4. TRANSITION DE SORTIE (ABANDON) ---
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
