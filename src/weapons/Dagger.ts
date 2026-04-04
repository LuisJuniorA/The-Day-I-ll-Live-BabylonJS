import type { Scene } from "@babylonjs/core";
import type { Character } from "../core/abstracts/Character";
import { MeleeWeapon } from "./MeleeWeapon";
import type { WeaponData } from "../core/types/WeaponStats";

export class Dagger extends MeleeWeapon {
    constructor(scene: Scene, data: WeaponData) {
        super(scene, data);
    }

    public async loadVisuals(): Promise<void> {
        // Logique de chargement utilisant this.data.meshPath
    }

    protected playAttackAnimation(_owner: Character): void {
        // Animation spécifique au "Moveset" Dague
        console.log("Joue l'animation : Quick Stab");
    }
}
