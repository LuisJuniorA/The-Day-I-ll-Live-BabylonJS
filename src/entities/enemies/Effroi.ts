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

export class Effroi extends Enemy {
    private _claw = new EffroiClaw();
    private _roar = new EffroiClaw();

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
        if (!target) return this._claw;

        const dist = Vector3.Distance(this.position, target.position);
        const now = Date.now();

        // Est-ce que le joueur s'éloigne ?
        const isEscaping = dist > this._lastDistToTarget + 0.01;
        this._lastDistToTarget = dist;

        // --- SCORES ---

        // 1. Logique du CLAW (Priorité : Corps à corps)
        let clawScore = this._claw.basePriority;
        if (dist <= 3.5) {
            clawScore += 80; // Priorité quasi-absolue au contact
        } else if (!isEscaping) {
            clawScore += 20; // Plus enclin à griffer s'il te poursuit de face
        }

        // 2. Logique du ROAR (Priorité : Contrôle de zone / Fuite)
        let roarScore = this._roar.basePriority;

        // Cooldown Strict
        if (now - this._roar.lastUsed < this._roar.cooldown) {
            roarScore = -100;
        } else {
            // Ligne de vue (Raycast) : Ne rugit pas derrière un mur
            if (!this.canSeeTarget(target)) {
                roarScore = -100;
            } else {
                // Bonus de distance (Zone idéale entre 4m et 12m)
                if (dist > 4 && dist <= 12) roarScore += 40;

                // Bonus de Fuite : Si le joueur s'enfuit, l'Effroi s'énerve
                if (isEscaping) roarScore += 50;

                // Facteur de fatigue/patience : plus le temps passe sans rugir, plus il a envie
                const timeFactor = (now - this._roar.lastUsed) / 1000;
                roarScore += Math.min(timeFactor, 20);

                // Facteur aléatoire pour casser la monotonie
                roarScore += Math.random() * 25;
            }
        }

        return roarScore > clawScore ? this._roar : this._claw;
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
