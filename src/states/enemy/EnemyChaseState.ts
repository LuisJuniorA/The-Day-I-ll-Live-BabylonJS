import { Vector3, Scalar, TransformNode, Color3 } from "@babylonjs/core";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyIdleState } from "./EnemyIdleState";
import { EnemyAttackState } from "./EnemyAttackState";
import { EnemyAttackIdleState } from "./EnemyAttackIdleState";
import { SteeringSystem } from "../../core/engines/SteeringSystem";
import { DebugService } from "../../core/engines/DebugService";
import { EnemyState } from "../../core/abstracts/EnemyState";

export class EnemyChaseState extends EnemyState {
    public readonly name = "ChaseState";

    protected handleUpdate(owner: Enemy, dt: number): void {
        const target = owner.targetTransform;
        const debug = DebugService.getInstance();
        const scene = owner.transform.getScene();

        if (!target) {
            this.clearAllDebug(owner);
            owner.movementFSM.transitionTo(new EnemyIdleState());
            return;
        }

        const dist = Vector3.Distance(owner.position, target.position);

        // --- 1. MOUVEMENT STEERING ---
        if (dist > owner.config.behavior.interactionRange) {
            const seekForce = SteeringSystem.seek(owner, target.position);
            const neighbors = owner.getNearbyNeighbors();
            const sepForce = SteeringSystem.separate(owner, neighbors, 10.0);

            const steering = seekForce
                .scale(owner.config.behavior.weights.seek)
                .add(sepForce.scale(owner.config.behavior.weights.separation));

            owner.velocity.addInPlace(steering.scale(dt * 10));

            if (owner.velocity.length() > owner.config.behavior.maxSpeed) {
                owner.velocity
                    .normalize()
                    .scaleInPlace(owner.config.behavior.maxSpeed);
            }

            // Debug visuel de la vélocité
            debug.drawRay(
                owner.id + "_vel",
                scene,
                owner.position,
                owner.velocity,
                1,
                Color3.Green(),
            );

            owner.playMove();
        } else {
            this.clearMovementDebug(owner);
            owner.velocity.scaleInPlace(Math.pow(0.01, dt));
            if (owner.velocity.length() < 0.1) owner.velocity.setAll(0);
            owner.playIdle();
        }

        owner.move(owner.velocity, dt);

        // --- 2. ORIENTATION & ATTAQUE ---
        this.updateOrientation(owner, target, dt);
        this.handleAttackTransition(owner, dist);

        // --- 3. ABANDON ---
        if (dist > owner.config.behavior.escapeRange) {
            this.clearAllDebug(owner);
            owner.movementFSM.transitionTo(new EnemyIdleState());
        }
    }

    private handleAttackTransition(owner: Enemy, dist: number): void {
        if (dist <= owner.config.behavior.interactionRange) {
            const currentAttackState = owner.attackFSM.currentState;
            if (
                currentAttackState instanceof EnemyAttackIdleState &&
                currentAttackState.canAttack
            ) {
                this.clearAllDebug(owner);
                owner.attackFSM.transitionTo(new EnemyAttackState());
            }
        }
    }

    private clearMovementDebug(owner: Enemy): void {
        const debug = DebugService.getInstance();
        debug.clear(owner.id + "_seek");
        debug.clear(owner.id + "_sep");
        debug.clear(owner.id + "_vel");
    }

    private clearAllDebug(owner: Enemy): void {
        this.clearMovementDebug(owner);
        DebugService.getInstance().clear(owner.id + "_best");
    }

    private updateOrientation(
        owner: Enemy,
        target: TransformNode,
        dt: number,
    ): void {
        const visualPivot = owner.transform
            .getChildren()
            .find((c) => c.name.includes("visual_pivot"));
        if (visualPivot instanceof TransformNode) {
            const diffX = target.position.x - owner.transform.position.x;
            const targetAngle = diffX > 0 ? 0 : Math.PI;
            visualPivot.rotation.y = Scalar.LerpAngle(
                visualPivot.rotation.y,
                targetAngle,
                owner.config.behavior.turnSpeed * (dt * 60),
            );
        }
    }

    public handleEnter(owner: Enemy) {
        this.clearAllDebug(owner);
    }
}
