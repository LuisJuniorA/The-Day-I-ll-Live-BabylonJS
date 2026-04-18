import { Scene } from "@babylonjs/core";
import type { Weapon } from "../core/abstracts/Weapon";
import { WEAPONS_DB } from "../data/WeaponsDb";
import { Dagger } from "../weapons/Dagger";
import { Sword } from "../weapons/Sword";
import { GreatSword } from "../weapons/GreatSword";

export class WeaponFactory {
    /**
     * @param weaponId L'identifiant unique dans WEAPONS_DB (ex: "iron_dagger")
     */
    public static createWeapon(weaponId: string, scene: Scene): Weapon | null {
        const data = WEAPONS_DB[weaponId];

        if (!data) {
            console.error(
                `L'arme avec l'id ${weaponId} n'existe pas dans la DB.`,
            );
            return null;
        }

        // On instancie la classe de comportement en lui passant TOUTE la data
        switch (data.type) {
            case "Dagger":
                return new Dagger(scene, data);
            case "Sword":
                return new Sword(scene, data);
            case "GreatSword":
                return new GreatSword(scene, data);
            default:
                throw new Error(`Type de moveset inconnu: ${data.type}`);
        }
    }
}
