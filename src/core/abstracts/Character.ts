import { Scene, Vector3 } from "@babylonjs/core";
import { Entity } from "./Entity";
import type { CharacterStats } from "../types/CharacterStats";

export abstract class Character extends Entity {
    public stats: CharacterStats;
    public isDead: boolean = false;
    public velocity: Vector3 = Vector3.Zero();
    public onDeath?: () => void;

    constructor(name: string, scene: Scene, initialStats: CharacterStats) {
        super(name, scene);
        this.stats = { ...initialStats }; // Copie pour éviter les références partagées
    }

    /**
     * Logique de dégâts commune à tous les personnages (joueur, ennemis, boss)
     */
    public takeDamage(amount: number): void {
        if (this.isDead) return;

        this.stats.hp -= amount;
        console.log(`${this.name} prend ${amount} dégâts. HP restants: ${this.stats.hp}`);

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