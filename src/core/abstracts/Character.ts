import { AnimationGroup, Scene, Vector3 } from "@babylonjs/core";
import { Entity } from "./Entity";
import type { CharacterStats } from "../types/CharacterStats";
import { OnEntityDamaged } from "../interfaces/CombatEvent";
import type { FactionType } from "../types/Faction";

export abstract class Character extends Entity {
    public stats: CharacterStats;
    public velocity: Vector3 = Vector3.Zero();
    public isDead: boolean = false;
    public isGrounded: boolean = false;
    public animations: Map<string, AnimationGroup> = new Map();
    protected faction: FactionType;

    public onDeath?: () => void;

    constructor(
        name: string,
        scene: Scene,
        stats: CharacterStats,
        faction: FactionType,
    ) {
        super(name, scene);
        this.stats = { ...stats };
        this.faction = faction;

        OnEntityDamaged.add((event) => {
            if (event.targetId !== this.id) return;

            if (event.attackerFaction === this.faction) return;

            this.takeDamage(event.amount);
        });
    }

    public takeDamage(amount: number): void {
        console.log(this.name, this.stats.hp);
        if (this.isDead) return;
        this.stats.hp -= amount;
        if (this.stats.hp <= 0) this.die();
    }

    protected die(): void {
        if (this.isDead) return;
        this.isDead = true;
        this.stats.hp = 0;
        this.velocity.setAll(0);
        if (this.onDeath) this.onDeath();
    }

    /**
     * Système de mouvement simplifié :
     * Le mesh enfant sert de "sonde" de collision.
     * Le pivot visuel (géré dans l'EntityFactory) s'occupe de l'offset Y.
     */
    public move(velocity: Vector3, dt: number): void {
        if (this.isDead || !this.mesh) return;

        // 1. CALCUL DE LA VÉLOCITÉ FINALE
        const finalVelocity = velocity.clone();

        // Gravité légère si au sol pour éviter de flotter
        if (this.isGrounded && finalVelocity.y < 0) {
            finalVelocity.y = -0.01;
        }

        // Rappel vers l'axe central (Z=0) pour le gameplay 2.5D
        const springStrength = 2.0;
        finalVelocity.z += -this.transform.position.z * springStrength;

        // 2. DÉPLACEMENT PHYSIQUE (Le mesh bouge localement)
        const frameMove = finalVelocity.scale(dt);
        this.mesh.moveWithCollisions(frameMove);

        // 3. SYNCHRONISATION
        // On transfère le mouvement du mesh vers le parent (TransformNode)
        this.transform.position.addInPlace(this.mesh.position);

        // 4. RESET POSITION DU MESH
        // On remet toujours le mesh à 0 relatif au parent.
        // L'offset Y est préservé grâce au TransformNode intermédiaire (visualPivot).
        this.mesh.position.setAll(0);

        // 5. TUNNEL PHYSIQUE (Z-CLAMP)
        const zLimit = 1.0;
        if (this.transform.position.z > zLimit)
            this.transform.position.z = zLimit;
        if (this.transform.position.z < -zLimit)
            this.transform.position.z = -zLimit;

        // 6. ROTATION (Flip automatique vers la direction du mouvement)
        this._handleSpriteFlip();
    }

    /**
     * Oriente le personnage vers sa direction de marche
     */
    private _handleSpriteFlip(): void {
        if (!this.mesh) return;

        // Si on va vers la droite (X positif)
        if (this.velocity.x > 0.1) {
            this.transform.rotation.y = 0;
        }
        // Si on va vers la gauche (X négatif)
        else if (this.velocity.x < -0.1) {
            this.transform.rotation.y = Math.PI; // 180°
        }
    }

    public playAnim(name: string, loop: boolean = true): void {
        const search = name.toLowerCase();

        // On cherche dans la Map une clé qui CONTIENT le nom demandé
        const entry = Array.from(this.animations.entries()).find(([key]) =>
            key.toLowerCase().includes(search),
        );

        if (!entry) {
            // Debug pour voir ce qu'il y a vraiment si ça rate
            console.warn(
                `Anim "${name}" non trouvée. Dispo:`,
                Array.from(this.animations.keys()),
            );
            return;
        }

        const targetAnim = entry[1];
        if (targetAnim.isPlaying) return;

        // On stoppe les autres
        this.animations.forEach((a) => {
            if (a !== targetAnim && a.isPlaying) a.stop();
        });

        targetAnim.play(loop);
    }
}
