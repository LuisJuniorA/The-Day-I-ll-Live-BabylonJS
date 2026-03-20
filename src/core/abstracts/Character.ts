import { AnimationGroup, Scene, Vector3 } from "@babylonjs/core";
import { Entity } from "./Entity";
import type { CharacterStats } from "../types/CharacterStats";

export abstract class Character extends Entity {
    public stats: CharacterStats;
    public velocity: Vector3 = Vector3.Zero();
    public isDead: boolean = false;
    public isGrounded: boolean = false; // Utile pour les calculs de saut/chute
    public animations: Map<string, AnimationGroup> = new Map();

    /** * Callback déclenché à la mort du personnage.
     * Permet à l'App ou au Manager de réagir (Game Over, Loot, Suppression).
     */
    public onDeath?: () => void;

    constructor(name: string, scene: Scene, stats: CharacterStats) {
        super(name, scene);
        // On crée une copie des stats pour éviter de modifier l'objet de config original
        this.stats = { ...stats };
    }

    /**
     * Applique des dégâts au personnage.
     */
    public takeDamage(amount: number): void {
        if (this.isDead) return;

        this.stats.hp -= amount;
        console.log(`${this.name} PV: ${this.stats.hp}/${this.stats.maxHp}`);

        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    /**
     * Gère la logique interne de la mort.
     */
    protected die(): void {
        if (this.isDead) return;

        this.isDead = true;
        this.stats.hp = 0;
        this.velocity.setAll(0); // On stoppe tout mouvement

        console.log(`${this.name} a succombé.`);

        if (this.onDeath) {
            this.onDeath();
        }
    }

    /**
     * Système de mouvement "Bridge" :
     * Utilise moveWithCollisions sur le mesh enfant, synchronise le Transform parent,
     * puis reset la position locale du mesh pour éviter les décalages (offsets).
     */
    public move(velocity: Vector3, dt: number): void {
        if (this.isDead || !this.mesh) return;

        // 1. CALCUL DE LA VÉLOCITÉ FINALE
        const finalVelocity = velocity.clone();

        // Sécurité sol (coller au sol)
        if (this.isGrounded && finalVelocity.y < 0) {
            finalVelocity.y = -0.01;
        }

        // --- ALIGNEMENT AUTOMATIQUE Z (FORCE DE RAPPEL) ---
        // Si on n'est pas à Z=0, on ajoute une petite force de retour.
        // Plus on est loin du centre, plus le retour est pressant.
        const springStrength = 2.0;
        finalVelocity.z += -this.transform.position.z * springStrength;

        // 2. DÉPLACEMENT PHYSIQUE
        const frameMove = finalVelocity.scale(dt);
        this.mesh.moveWithCollisions(frameMove);

        // --- TUNNEL PHYSIQUE (Z-CLAMP) ---
        // On empêche physiquement de sortir des limites, même si une force de steering pousse trop fort.
        const zLimit = 1.5;
        if (this.mesh.position.z > zLimit) this.mesh.position.z = zLimit;
        if (this.mesh.position.z < -zLimit) this.mesh.position.z = -zLimit;

        // 3. SYNCHRONISATION
        this.transform.position.addInPlace(this.mesh.position);

        // 5. RESET POSITION LOCALE
        this.mesh.position.setAll(0);
    }

    /**
     * Gère la lecture des animations enregistrées.
     */
    public playAnim(name: string, loop: boolean = true): void {
        const animName = name.toLowerCase();
        const anim = this.animations.get(animName);

        if (!anim || anim.isPlaying) return;

        // On arrête toutes les autres animations proprement
        this.animations.forEach((a) => {
            if (a !== anim && a.isPlaying) {
                a.stop();
            }
        });

        anim.play(loop);
    }
}
