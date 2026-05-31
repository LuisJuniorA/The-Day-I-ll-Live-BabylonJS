import {
    Scene,
    AbstractMesh,
    AnimationGroup,
    Vector3,
    Ray,
    TransformNode,
} from "@babylonjs/core";
import { Enemy } from "../../core/abstracts/Enemy";
import { ProximitySystem } from "../../core/engines/ProximitySystem";
import type { EnemyConfig } from "../../core/types/EnemyConfig";
import type { ActionBehavior } from "../../core/interfaces/Behaviors";
import { EffroiClaw, EffroiRoar } from "../../gameplay/attacks/EffroiAttacks";
import { CollisionLayers } from "../../core/constants/CollisionLayers";
import { NoAttack } from "../../gameplay/attacks/NoAttack";

export class Effroi extends Enemy {
    private _claw = new EffroiClaw();
    private _roar = new EffroiRoar();
    private _nothing = new NoAttack();

    // Physique & IA
    private readonly GRAVITY = -0.98;
    private readonly TERMINAL_VELOCITY = -15;
    private _lastDistToTarget: number = 0;

    constructor(
        scene: Scene,
        data: EnemyConfig,
        proximitySystem: ProximitySystem,
        rootMesh: AbstractMesh,
        animations: AnimationGroup[],
    ) {
        super(scene, data, proximitySystem, rootMesh);

        // Initialisation des attaques
        this.availableAttacks.push(this._claw, this._roar);

        animations.forEach((ag) => {
            ag.stop();
            ag.enableBlending = true;
            ag.blendingSpeed = 0.15;
            this.animations.set(ag.name.toLowerCase(), ag);
        });
    }

    /**
     * Retourne l'ID logique de la cible ("Player") via le ProximitySystem
     */
    public get targetEntityId(): string {
        return "Player";
    }

    /**
     * IA : Système de scoring (Utility AI) pour choisir l'attaque
     */
    public getNextAttack(): ActionBehavior {
        const target = this.targetTransform;
        if (!target) return this._nothing;

        const dist = Vector3.Distance(this.position, target.position);
        const now = Date.now();

        // 1. --- LOGIQUE DU ROAR ---
        const timeSinceLastRoar = now - this._roar.lastUsed;
        // On garde la logique probabiliste pour le Roar
        if (
            timeSinceLastRoar >= this._roar.cooldown &&
            this.canSeeTarget(target) &&
            dist > 4
        ) {
            const isEscaping = dist > this._lastDistToTarget + 0.01;
            const chance = isEscaping ? 0.2 : 0.05;
            if (Math.random() < chance) {
                return this._roar;
            }
        }
        this._lastDistToTarget = dist;

        // 2. --- LOGIQUE DU CLAW ---
        // ICI : On vérifie la portée avant de retourner l'attaque
        if (dist <= this._claw.range) {
            return this._claw;
        }

        // 3. --- RIEN À FAIRE ---
        // Le joueur est trop loin, l'IA ne doit pas lancer d'attaque
        return this._nothing;
    }

    /**
     * Vérifie si un obstacle bloque la vue vers le joueur
     */
    private canSeeTarget(target: TransformNode): boolean {
        // 1. Origine (yeux du monstre)
        const origin = this.position.add(new Vector3(0, 1.5, 0));

        // 2. Direction vers le joueur
        const direction = target.position.subtract(origin).normalize();

        // 3. Rayon de 15 unités (ta portée de détection)
        const ray = new Ray(origin, direction, 15);

        // 4. Le filtre de collision :
        // On veut tester uniquement l'Environnement (murs) et le Joueur.
        // On ignore les autres ennemis pour que l'Effroi puisse rugir "à travers" ses alliés.
        const predicate = (mesh: AbstractMesh) => {
            return (
                (mesh.collisionMask &
                    (CollisionLayers.ENVIRONMENT | CollisionLayers.PLAYER)) !==
                    0 && mesh.isPickable
            );
        };

        const hit = this._scene.pickWithRay(ray, predicate);

        // 5. Résultat : Si le premier objet touché appartient au layer PLAYER, c'est bon !
        if (hit && hit.pickedMesh) {
            return (
                (hit.pickedMesh.collisionMask & CollisionLayers.PLAYER) !== 0
            );
        }

        return false;
    }

    public update(dt: number): void {
        if (this.isDead || !this.mesh) return;

        this.checkGrounded();

        // Gravité
        if (!this.isGrounded) {
            this.velocity.y += this.GRAVITY;
            if (this.velocity.y < this.TERMINAL_VELOCITY)
                this.velocity.y = this.TERMINAL_VELOCITY;
        } else {
            this.velocity.y = Math.max(0, this.velocity.y);
        }

        const frameMovement = this.velocity.scale(dt);
        this.transform.position.addInPlace(frameMovement);

        super.update(dt);
    }

    public playIdle(): void {
        this.playAnim("idle", true);
    }
    public playMove(): void {
        this.playAnim("run", true);
    }
}
