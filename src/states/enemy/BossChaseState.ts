import { Vector3, Ray } from "@babylonjs/core";
import type { Enemy } from "../../core/abstracts/Enemy";
import { EnemyState } from "../../core/abstracts/EnemyState";
import { CollisionLayers } from "../../core/constants/CollisionLayers";
import { SteeringSystem } from "../../core/engines/SteeringSystem";
import { EnemyAttackIdleState } from "./EnemyAttackIdleState";
import { EnemyAttackState } from "./EnemyAttackState";
import { EnemyIdleState } from "./EnemyIdleState";

export class BossChaseState extends EnemyState {
    public readonly name = "BossChaseState";

    private readonly AVOIDANCE_RAY_LENGTH = 3.0;
    private readonly AVOIDANCE_FORCE = 15.0;

    protected handleUpdate(owner: Enemy, dt: number): void {
        const target = owner.targetTransform;
        const scene = owner._scene;

        if (!target) {
            owner.movementFSM.transitionTo(new EnemyIdleState());
            return;
        }

        // --- 1. MOUVEMENT (STEERING) ---
        // Le boss continue de chercher le joueur indépendamment de la distance
        const seekForce = SteeringSystem.seek(owner, target.position);
        const avoidanceForce = this.calculateWallAvoidance(owner, scene);

        const steering = seekForce
            .scale(owner.config.behavior.weights.seek)
            .add(avoidanceForce);

        owner.velocity.addInPlace(steering.scale(dt * 10));

        // Limitation vitesse
        if (owner.velocity.length() > owner.config.behavior.maxSpeed) {
            owner.velocity
                .normalize()
                .scaleInPlace(owner.config.behavior.maxSpeed);
        }

        owner.move(owner.velocity, dt);

        // --- 2. ATTAQUE CONSTANTE ---
        // On ne vérifie plus la distance, on laisse le système d'attaque
        // décider quand il peut attaquer (via son propre cooldown)
        this.attemptAttack(owner);
    }

    private attemptAttack(owner: Enemy): void {
        const currentAttackState = owner.attackFSM.currentState;

        // Si le boss est dans l'état "idle" d'attaque, on tente de lancer l'attaque
        if (
            currentAttackState instanceof EnemyAttackIdleState &&
            currentAttackState.canAttack
        ) {
            // Ici, on déclenche l'attaque.
            // Ton BossCharge ou BossClaw appellera son executeEffect()
            // qui lancera le BossAttackState (la hitbox longue portée)
            owner.attackFSM.transitionTo(new EnemyAttackState());
        }
    }

    private calculateWallAvoidance(owner: Enemy, scene: any): Vector3 {
        // (Logique identique à ton code précédent pour éviter les murs)
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

        if (hit && hit.hit) {
            const normal = hit.getNormal(true)!;
            force
                .copyFrom(normal)
                .scaleInPlace(
                    this.AVOIDANCE_FORCE *
                        (1.0 - hit.distance / this.AVOIDANCE_RAY_LENGTH),
                );
        }
        return force;
    }
}
