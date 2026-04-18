import type { Scene } from "@babylonjs/core";
import type { Character } from "../core/abstracts/Character";
import { MeleeWeapon } from "./MeleeWeapon";
import type { WeaponData } from "../core/types/WeaponStats";

export class GreatSword extends MeleeWeapon {
    constructor(scene: Scene, data: WeaponData) {
        super(scene, data);
    }

    public async loadVisuals(): Promise<void> {
        // Logique de chargement utilisant this.data.meshPath
    }

    protected playAttackAnimation(_owner: Character): void {
        console.log("Joue l'animation : Heavy Overhead");
    }
}
