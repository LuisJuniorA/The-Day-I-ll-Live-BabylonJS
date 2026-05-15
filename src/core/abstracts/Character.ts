import { AnimationGroup, Ray, Scene, Vector3 } from "@babylonjs/core";
import { Entity } from "./Entity";
import type { CharacterStats } from "../types/CharacterStats";
import { OnDamageConfirmed, OnEntityDamaged } from "../interfaces/CombatEvent";
import type { FactionType } from "../types/Faction";
import { AudioManager } from "../../managers/AudioManager";

export abstract class Character extends Entity {
    public stats: CharacterStats;
    public velocity: Vector3 = Vector3.Zero();
    public isDead: boolean = false;
    public hasToBeDeleted: boolean = false;
    public isGrounded: boolean = false;
    public animations: Map<string, AnimationGroup> = new Map();
    public faction: FactionType;

    // Force externe pour gérer le physique (Knockback / Recul) sans polluer l'input
    public externalForce: Vector3 = Vector3.Zero();

    private _isPriorityAnimActive: boolean = false;
    public onDeath?: () => void;

    constructor(
        name: string,
        scene: Scene,
        stats: CharacterStats,
        faction: FactionType,
        id?: string,
    ) {
        super(name, scene, id);
        this.stats = { ...stats };
        this.faction = faction;

        // Écouteur global pour les dégâts reçus
        OnEntityDamaged.add((event) => {
            if (event.targetId !== this.id) return;
            if (event.attackerId === this.id) return;
            if (event.attackerFaction === this.faction) return;

            // On passe maintenant les paramètres de l'event à takeDamage
            this.takeDamage(
                event.amount,
                event.position,
                event.attackerId,
                event.knockbackForce,
            );
        });
    }

    // À garder/ajouter dans Character.ts

    /**
     * Appelé par l'arme quand elle confirme un impact sur une cible ennemie
     */
    public onHitTarget(targetPosition: Vector3): void {
        if (this.isDead) return;

        // On calcule le recul : à l'opposé de la cible
        const diffX = this.transform.position.x - targetPosition.x;

        // Si on est trop proche (diffX quasi nul), on se base sur la rotation
        const dirX =
            Math.abs(diffX) > 0.1
                ? diffX > 0
                    ? 1
                    : -1
                : this.transform.rotation.y === 0
                  ? -1
                  : 1;

        // Force de recul (ajuste à 3 ou 4 pour un bon feeling "poids de l'arme")
        this.applyKnockback(new Vector3(dirX, 0, 0), 4);
    }

    public takeDamage(
        amount: number,
        originPos?: Vector3,
        attackerId?: string,
        knockbackForce?: number, // Ajout ici
    ): void {
        if (this.isDead) return;
        this.stats.hp -= amount;

        // Utilise la force configurée, ou 0 par défaut
        if (originPos && knockbackForce && knockbackForce > 0) {
            const diffX = this.transform.position.x - originPos.x;
            const dir = new Vector3(diffX > 0 ? 1 : -1, 0, 0);
            this.applyKnockback(dir, knockbackForce);
        }

        // On renvoie les mêmes infos pour confirmer (VFX, UI, etc.)
        OnDamageConfirmed.notifyObservers({
            targetId: this.id,
            attackerId: attackerId ?? "unknown",
            amount: amount,
            position: this.transform.position.clone(),
            attackerFaction: this.faction,
        });

        if (this.stats.hp <= 0) this.die();
    }

    protected updateForces(dt: number): void {
        if (this.externalForce.length() > 0.01) {
            // Friction : 0.1 c'est bien, ça s'arrête vite mais on voit le mouvement
            const friction = Math.pow(0.005, dt);
            this.externalForce.scaleInPlace(friction);
        } else {
            this.externalForce.setAll(0);
        }
    }

    /**
     * Recul léger appliqué à l'attaquant quand il touche une cible
     */
    // À remplacer dans Character.ts
    protected _handleAttackRecoil(impactPoint: Vector3): void {
        if (this.isDead) return;

        // 1. Calcul de direction
        let diffX = this.transform.position.x - impactPoint.x;

        // Sécurité : Si on est pile sur la cible, on recule à l'opposé d'où on regarde
        if (Math.abs(diffX) < 0.01) {
            diffX = this.transform.rotation.y === 0 ? -1 : 1;
        }

        const recoilDir = new Vector3(diffX > 0 ? 1 : -1, 0, 0);

        // 2. Augmenter la force (2.5 c'est très peu avec la friction qu'on a mise)
        // Essaye 5 ou 6 pour bien voir l'effet, puis ajuste.
        this.applyKnockback(recoilDir, 5);
    }

    public applyKnockback(direction: Vector3, force: number): void {
        if (this.isDead) return;
        // On ajoute l'impulsion à la force externe
        this.externalForce.addInPlace(direction.scale(force));
    }

    /**
     * Change l'orientation visuelle (rotation Y)
     */
    public faceDirection(horizontalInput: number): void {
        const threshold = 0.1;
        if (horizontalInput > threshold) {
            this.transform.rotation.y = 0; // Droite
        } else if (horizontalInput < -threshold) {
            this.transform.rotation.y = Math.PI; // Gauche
        }
    }

    public checkGrounded(): void {
        const rayLength = 0.8;
        const bodyRadius = 0.25;

        const positions = [
            new Vector3(0, 0, 0),
            new Vector3(bodyRadius, 0, 0),
            new Vector3(-bodyRadius, 0, 0),
            new Vector3(0, 0, bodyRadius),
            new Vector3(0, 0, -bodyRadius),
        ];

        let hasHit = false;
        const halfHeight = this.mesh!.ellipsoid.y;
        for (const posOffset of positions) {
            const feetOffset = -(halfHeight * 0.9);
            const origin = this.transform.position
                .add(posOffset)
                .add(new Vector3(0, feetOffset, 0));

            const ray = new Ray(origin, new Vector3(0, -1, 0), rayLength);
            const pick = this._scene.pickWithRay(ray, (m) => {
                return m.checkCollisions && m.collisionGroup === 1;
            });

            if (pick && pick.hit) {
                hasHit = true;
                break;
            }
        }

        this.isGrounded = hasHit;
        if (this.isGrounded && this.velocity.y < 0) {
            this.velocity.y = 0;
        }
    }

    protected die(): void {
        if (this.isDead) return;
        this.isDead = true;
        this.hasToBeDeleted = true;
        this.stats.hp = 0;
        this.velocity.setAll(0);
        this.externalForce.setAll(0);

        const hitboxWrap = this.transform
            .getChildMeshes()
            .find((m) => m.name.startsWith("hitbox_wrap"));

        if (hitboxWrap) {
            hitboxWrap.isPickable = false; // Ne bloque plus les rayons (raycast)
            hitboxWrap.setEnabled(false); // Disparaît complètement du moteur de rendu et des collisions
            // Si tu veux juste qu'elle ne soit plus frappable mais reste visible (pour le debug) :
            // hitboxWrap.isVisible = false;
        }

        if (this.onDeath) this.onDeath();
    }

    /**
     * @param inputVelocity La vélocité issue de l'input joueur ou de l'IA
     * @param dt DeltaTime
     */
    public move(inputVelocity: Vector3, dt: number): void {
        if (this.isDead || !this.mesh || !this._scene.animationsEnabled) return;

        this.updateForces(dt);

        // Somme de l'intention (input) et du physique (externalForce)
        const totalVelocity = inputVelocity.add(this.externalForce);
        const frameMove = totalVelocity.scale(dt);

        this.mesh.moveWithCollisions(frameMove);

        this.transform.position.addInPlace(this.mesh.position);
        this.mesh.position.setAll(0);

        // Gestion du flip visuel basée uniquement sur l'INPUT
        this._handleSpriteFlip(inputVelocity);
    }

    private _handleSpriteFlip(inputVelocity: Vector3): void {
        // Augmente le seuil à 0.2 ou 0.3 pour ignorer les "glissements" de fin de mouvement
        const flipThreshold = 0.2;

        if (Math.abs(inputVelocity.x) > flipThreshold) {
            this.faceDirection(inputVelocity.x);
        }
    }

    public playAnim(
        name: string,
        loop: boolean = true,
        isPriority: boolean = false,
    ): void {
        if (this._isPriorityAnimActive && loop) return;
        const search = name.toLowerCase();
        const entry = Array.from(this.animations.entries()).find(([key]) =>
            key.toLowerCase().includes(search),
        );
        if (!entry) return;
        const targetAnim = entry[1];
        if (targetAnim.isPlaying && loop) return;

        this.animations.forEach((a) => {
            if (a !== targetAnim && a.isPlaying) a.stop();
        });

        if (isPriority) {
            this._isPriorityAnimActive = true;
            targetAnim.onAnimationEndObservable.addOnce(() => {
                this._isPriorityAnimActive = false;
            });
        }
        targetAnim.play(loop);
    }
}
