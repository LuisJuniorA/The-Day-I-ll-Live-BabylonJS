import { Vector3, Scalar, TransformNode, Color3, Ray } from "@babylonjs/core";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyIdleState } from "./EnemyIdleState";
import { EnemyAttackState } from "./EnemyAttackState";
import { EnemyAttackIdleState } from "./EnemyAttackIdleState";
import { SteeringSystem } from "../../core/engines/SteeringSystem";
import { DebugService } from "../../core/engines/DebugService";
import { EnemyState } from "../../core/abstracts/EnemyState";
import { CollisionLayers } from "../../core/constants/CollisionLayers";

export class EnemyChaseState extends EnemyState {
    public readonly name = "ChaseState";

    // Paramètres d'évitement
    private readonly AVOIDANCE_RAY_LENGTH = 3.0;
    private readonly AVOIDANCE_FORCE = 15.0;

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

        // --- 1. DÉTERMINATION DE LA CIBLE DE MOUVEMENT ---
        // On récupère l'attaque que l'IA veut faire pour savoir à quelle distance s'arrêter
        const nextAttack = owner.getNextAttack();
        const stopDistance = nextAttack.range;

        // --- 2. CALCUL DES FORCES OU ARRÊT ---
        if (dist > stopDistance) {
            // Force pour aller vers le joueur
            const seekForce = SteeringSystem.seek(owner, target.position);

            // Force pour éviter les autres ennemis
            const neighbors = owner.getNearbyNeighbors();
            const sepForce = SteeringSystem.separate(owner, neighbors, 10.0);

            // Force d'évitement de murs
            const avoidanceForce = this.calculateWallAvoidance(owner, scene);

            // Combinaison des forces avec poids
            const steering = seekForce
                .scale(owner.config.behavior.weights.seek)
                .add(sepForce.scale(owner.config.behavior.weights.separation))
                .add(avoidanceForce);

            // Application à la vélocité
            owner.velocity.addInPlace(steering.scale(dt * 10));

            // Limitation de vitesse
            if (owner.velocity.length() > owner.config.behavior.maxSpeed) {
                owner.velocity
                    .normalize()
                    .scaleInPlace(owner.config.behavior.maxSpeed);
            }

            // Debug de la trajectoire
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
            // On est à portée de l'attaque choisie : on freine
            this.clearMovementDebug(owner);
            owner.velocity.scaleInPlace(Math.pow(0.01, dt));
            if (owner.velocity.length() < 0.1) owner.velocity.setAll(0);

            // Si on n'est pas déjà en train d'attaquer, on joue l'idle
            if (!(owner.attackFSM.currentState instanceof EnemyAttackState)) {
                owner.playIdle();
            }
        }

        // Déplacement physique
        owner.move(owner.velocity, dt);

        // --- 3. ORIENTATION & ATTAQUE ---
        this.updateOrientation(owner, target, dt);
        this.handleAttackTransition(owner, dist, stopDistance);

        // --- 4. ABANDON ---
        if (dist > owner.config.behavior.escapeRange) {
            this.clearAllDebug(owner);
            owner.movementFSM.transitionTo(new EnemyIdleState());
        }
    }

    private handleAttackTransition(
        owner: Enemy,
        dist: number,
        attackRange: number,
    ): void {
        // Si on est à portée de l'attaque choisie
        if (dist <= attackRange) {
            const currentAttackState = owner.attackFSM.currentState;

            // On vérifie si l'IA est prête à attaquer
            if (
                currentAttackState instanceof EnemyAttackIdleState &&
                currentAttackState.canAttack
            ) {
                this.clearAllDebug(owner);
                owner.attackFSM.transitionTo(new EnemyAttackState());
            }
        }
    }

    private calculateWallAvoidance(owner: Enemy, scene: any): Vector3 {
        const force = new Vector3(0, 0, 0);
        if (owner.velocity.length() < 0.1) return force;

        const moveDir = owner.velocity.clone().normalize();
        const ray = new Ray(
            owner.position.add(new Vector3(0, 0.5, 0)),
            moveDir,
            this.AVOIDANCE_RAY_LENGTH,
        );

        const hit = scene.pickWithRay(
            ray,
            (m: any) =>
                m.checkCollisions &&
                m.collisionGroup === CollisionLayers.ENVIRONMENT,
        );

        if (hit && hit.hit && hit.pickedPoint) {
            const normal = hit.getNormal(true)!;
            const distanceFactor =
                1.0 - hit.distance / this.AVOIDANCE_RAY_LENGTH;
            force
                .copyFrom(normal)
                .scaleInPlace(this.AVOIDANCE_FORCE * distanceFactor);

            DebugService.getInstance().drawRay(
                owner.id + "_avoid",
                scene,
                ray.origin,
                moveDir.scale(this.AVOIDANCE_RAY_LENGTH),
                1,
                Color3.Red(),
            );
        } else {
            DebugService.getInstance().clear(owner.id + "_avoid");
        }

        return force;
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

    private clearMovementDebug(owner: Enemy): void {
        const debug = DebugService.getInstance();
        debug.clear(owner.id + "_seek");
        debug.clear(owner.id + "_sep");
        debug.clear(owner.id + "_vel");
        debug.clear(owner.id + "_avoid");
    }

    private clearAllDebug(owner: Enemy): void {
        this.clearMovementDebug(owner);
        DebugService.getInstance().clear(owner.id + "_best");
    }

    public handleEnter(owner: Enemy) {
        this.clearAllDebug(owner);
    }
}
