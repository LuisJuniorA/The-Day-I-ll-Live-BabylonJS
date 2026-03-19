import { AnimationGroup, Scene, Vector3 } from "@babylonjs/core";
import { Entity } from "./Entity";
import type { CharacterStats } from "../types/CharacterStats";

export abstract class Character extends Entity {
    public stats: CharacterStats;
    public isDead: boolean = false;
    public velocity: Vector3 = Vector3.Zero();
    public onDeath?: () => void;
    public animations: Map<string, AnimationGroup> = new Map();

    constructor(name: string, scene: Scene, initialStats: CharacterStats) {
        super(name, scene);
        this.stats = { ...initialStats }; // Copie pour éviter les références partagées
        if (this.mesh) {
            this.mesh.checkCollisions = false;
        }
    }

    public playAnim(name: string, loop: boolean = true): void {
        // 1. On force en minuscule pour éviter les erreurs de frappe (Idle vs idle)
        const animName = name.toLowerCase();
        const anim = this.animations.get(animName);

        // 2. Sécurité : si l'anim n'existe pas (cas du placeholder), on sort proprement
        if (!anim) {
            console.warn(`Animation ${animName} non trouvée.`);
            return;
        }

        // 3. Si l'anim joue déjà, on ne fait rien (évite de redémarrer l'anim à chaque frame)
        if (anim.isPlaying) return;

        // 4. On stoppe les autres proprement
        this.animations.forEach((a) => {
            if (a !== anim && a.isPlaying) {
                a.stop();
            }
        });

        // 5. On lance la nouvelle
        anim.play(loop);
    }

    /**
     * Logique de dégâts commune à tous les personnages (joueur, ennemis, boss)
     */
    public takeDamage(amount: number): void {
        if (this.isDead) return;

        this.stats.hp -= amount;
        console.log(
            `${this.name} prend ${amount} dégâts. HP restants: ${this.stats.hp}`,
        );

        if (this.stats.hp <= 0) {
            this.die();
            this.onDeath?.();
        }
    }

    protected die(): void {
        this.isDead = true;
        this.stats.hp = 0;
    }
}
