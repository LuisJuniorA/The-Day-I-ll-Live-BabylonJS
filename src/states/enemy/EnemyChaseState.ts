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

        // --- 1. CALCUL DES FORCES ---
        if (dist > owner.config.behavior.interactionRange) {
            // Force pour aller vers le joueur
            const seekForce = SteeringSystem.seek(owner, target.position);

            // Force pour éviter les autres ennemis
            const neighbors = owner.getNearbyNeighbors();
            const sepForce = SteeringSystem.separate(owner, neighbors, 10.0);

            // --- NOUVEAU : Force d'évitement de murs ---
            const avoidanceForce = this.calculateWallAvoidance(owner, scene);

            // Combinaison des forces avec poids
            const steering = seekForce
                .scale(owner.config.behavior.weights.seek)
                .add(sepForce.scale(owner.config.behavior.weights.separation))
                .add(avoidanceForce); // Ajout de l'évitement

            // Application à la vélocité
            owner.velocity.addInPlace(steering.scale(dt * 10));

            // Limitation de vitesse
            if (owner.velocity.length() > owner.config.behavior.maxSpeed) {
                owner.velocity
                    .normalize()
                    .scaleInPlace(owner.config.behavior.maxSpeed);
            }

            // Debug de la trajectoire finale
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

        // Déplacement physique
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

    /**
     * Scanne devant l'ennemi pour détecter un mur et générer une force de répulsion
     */
    private calculateWallAvoidance(owner: Enemy, scene: any): Vector3 {
        const force = new Vector3(0, 0, 0);
        if (owner.velocity.length() < 0.1) return force;

        // On lance un rayon dans la direction actuelle du mouvement
        const moveDir = owner.velocity.clone().normalize();
        const ray = new Ray(
            owner.position.add(new Vector3(0, 0.5, 0)),
            moveDir,
            this.AVOIDANCE_RAY_LENGTH,
        );

        // On ne check que l'environnement
        const hit = scene.pickWithRay(
            ray,
            (m: any) =>
                m.checkCollisions &&
                m.collisionGroup === CollisionLayers.ENVIRONMENT,
        );

        if (hit && hit.hit && hit.pickedPoint) {
            // On calcule une force de répulsion basée sur la normale du mur
            const normal = hit.getNormal(true)!;

            // La force est plus forte si on est proche du mur
            const distanceFactor =
                1.0 - hit.distance / this.AVOIDANCE_RAY_LENGTH;
            force
                .copyFrom(normal)
                .scaleInPlace(this.AVOIDANCE_FORCE * distanceFactor);

            // Debug du rayon d'évitement (Rouge si collision imminente)
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

    // ... (updateOrientation, handleAttackTransition et clear methods inchangées)

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
        debug.clear(owner.id + "_avoid");
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
