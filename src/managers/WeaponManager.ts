import {
    Scene,
    LoadAssetContainerAsync,
    AssetContainer,
    AbstractMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

import { WEAPONS_DB } from "../data/WeaponsDb";
import type { Weapon } from "../core/abstracts/Weapon";
import type { WeaponData } from "../core/types/WeaponStats";

// Import des classes concrètes
import { Dagger } from "../weapons/Dagger";
import { Sword } from "../weapons/Sword";
import { GreatSword } from "../weapons/GreatSword";
import {
    OnWeaponChanged,
    OnRequestWeaponEquip,
} from "../core/interfaces/CombatEvent"; // Ajout de OnRequestWeaponEquip
import type { WeaponSlot } from "../core/types/WeaponTypes";
import type { Player } from "../entities/Player";

type WeaponConstructor = new (scene: Scene, data: WeaponData) => Weapon;

export class WeaponManager {
    private _scene: Scene;
    private _assetCache: Map<string, AssetContainer> = new Map();
    private _activeWeapons: Set<Weapon> = new Set();

    private _weaponClasses: Record<string, WeaponConstructor> = {
        Dagger: Dagger,
        Sword: Sword,
        GreatSword: GreatSword,
    };

    constructor(scene: Scene) {
        this._scene = scene;

        // --- C'est ici que la magie opère ---
        // On écoute les requêtes du Player (ou de n'importe quel Character)
        OnRequestWeaponEquip.add(async (event) => {
            console.log(
                `[WeaponManager] Request received for ${event.weaponId}`,
            );
            await this.equipWeapon(event.character as Player, event.weaponId);
        });
    }

    public async preloadWeapon(weaponId: string): Promise<void> {
        if (this._assetCache.has(weaponId)) return;

        const data = WEAPONS_DB[weaponId];
        if (!data) return;

        try {
            const container = await LoadAssetContainerAsync(
                data.meshPath,
                this._scene,
            );
            this._assetCache.set(weaponId, container);
        } catch (err) {
            console.error(`[WeaponManager] Error preloading ${weaponId}:`, err);
        }
    }

    public async createWeapon(weaponId: string): Promise<Weapon> {
        const data = WEAPONS_DB[weaponId];
        if (!data) throw new Error(`Weapon ${weaponId} not found in DB`);

        const Constructor = this._weaponClasses[data.type];
        if (!Constructor)
            throw new Error(
                `No class registered for weapon type: ${data.type}`,
            );

        const weapon = new Constructor(this._scene, data);

        if (!this._assetCache.has(weaponId)) {
            await this.preloadWeapon(weaponId);
        }

        const container = this._assetCache.get(weaponId)!;

        const instance = container.instantiateModelsToScene(
            (name) => `${name}_${Math.random().toString(36).substr(2, 4)}`,
        );

        const weaponMesh = instance.rootNodes[0] as AbstractMesh;
        weaponMesh.name = `weapon_${weaponId}_${Date.now()}`;

        weaponMesh.setParent(null);
        weaponMesh.position.setAll(0);
        weaponMesh.rotationQuaternion = null;
        weaponMesh.rotation.setAll(0);
        weaponMesh.scaling.setAll(1);

        weapon.mesh = weaponMesh;

        await weapon.loadVisuals();
        this._activeWeapons.add(weapon);
        return weapon;
    }

    /**
     * Assigne une arme à un slot et force l'équipement visuel si c'est le slot actif
     */
    public async setSlotWeapon(
        player: Player,
        slot: WeaponSlot,
        weaponId: string,
    ): Promise<void> {
        player.setWeaponSlot(slot, weaponId);

        // Si le joueur tient ce slot, l'équipement visuel est déclenché par setWeaponSlot
        // via l'émetteur, donc pas forcément besoin de ré-appeler equipWeapon ici
        // sauf si tu veux bypasser l'event.
    }

    /**
     * Équipe une arme : gère la destruction de l'ancienne arme AVANT d'attacher la nouvelle
     */
    public async equipWeapon(
        character: Player,
        weaponId: string,
        boneName: string = "hand.R",
    ) {
        // 1. Nettoyage de l'arme actuelle du personnage s'il en a une
        if (character.currentWeapon) {
            this.removeWeapon(character.currentWeapon);
        }

        // 2. Création et attachement
        const weapon = await this.createWeapon(weaponId);

        // On récupère le slot via la DB pour le stocker sur l'instance d'arme
        weapon.slot = WEAPONS_DB[weaponId].type;

        weapon.attachToCharacter(character, boneName);

        // 3. On prévient tout le monde (dont le Player lui-même)
        OnWeaponChanged.notifyObservers({ weapon: weapon });
    }

    public removeWeapon(weapon: Weapon): void {
        if (weapon.mesh) {
            weapon.mesh.dispose();
        }
        this._activeWeapons.delete(weapon);
    }

    public dispose(): void {
        this._activeWeapons.forEach((w) => this.removeWeapon(w));
        this._assetCache.forEach((c) => c.dispose());
        this._assetCache.clear();
    }
}
