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

import { Dagger } from "../weapons/Dagger";
import { Sword } from "../weapons/Sword";
import { GreatSword } from "../weapons/GreatSword";
import {
    OnWeaponChanged,
    OnRequestWeaponEquip,
} from "../core/interfaces/CombatEvent";
import type { WeaponSlot } from "../core/types/WeaponTypes";
import type { Player } from "../entities/Player";

type WeaponConstructor = new (scene: Scene, data: WeaponData) => Weapon;

export class WeaponManager {
    private _scene: Scene;
    private _assetCache: Map<string, AssetContainer> = new Map();

    // NOUVEAU : Cache des instances déjà créées (on ne dispose plus, on stocke ici)
    private _instanceCache: Map<string, Weapon> = new Map();
    private _activeWeapons: Set<Weapon> = new Set();

    private _weaponClasses: Record<string, WeaponConstructor> = {
        Dagger: Dagger,
        Sword: Sword,
        GreatSword: GreatSword,
    };

    constructor(scene: Scene) {
        this._scene = scene;

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

            // OPTIMISATION : On instancie l'arme immédiatement dans le cache
            // pour qu'elle soit prête avant même que le joueur ne clique dessus
            await this.getOrCreateWeapon(weaponId);
        } catch (err) {
            console.error(`[WeaponManager] Error preloading ${weaponId}:`, err);
        }
    }

    /**
     * Récupère une arme du cache ou en crée une nouvelle
     */
    private async getOrCreateWeapon(weaponId: string): Promise<Weapon> {
        // Si l'instance existe déjà dans le cache, on la rend juste invisible et on la rend
        if (this._instanceCache.has(weaponId)) {
            return this._instanceCache.get(weaponId)!;
        }

        const data = WEAPONS_DB[weaponId];
        const Constructor = this._weaponClasses[data.type];
        const weapon = new Constructor(this._scene, data);

        if (!this._assetCache.has(weaponId)) {
            const container = await LoadAssetContainerAsync(
                data.meshPath,
                this._scene,
            );
            this._assetCache.set(weaponId, container);
        }

        const container = this._assetCache.get(weaponId)!;
        const instance = container.instantiateModelsToScene(
            (name) => `${name}_${Math.random().toString(36).substr(2, 4)}`,
            false, // ne pas l'ajouter aux nodes de rendu immédiatement si possible
        );

        const weaponMesh = instance.rootNodes[0] as AbstractMesh;
        weaponMesh.name = `cached_weapon_${weaponId}`;
        weaponMesh.setEnabled(false); // Cachée par défaut

        weapon.mesh = weaponMesh;
        weapon.slot = data.type;

        await weapon.loadVisuals();

        // On stocke dans le cache d'instances
        this._instanceCache.set(weaponId, weapon);
        return weapon;
    }

    /**
     * Assigne une arme à un slot et la pré-charge en mémoire
     */
    public async setSlotWeapon(
        player: Player,
        slot: WeaponSlot,
        weaponId: string,
    ): Promise<void> {
        player.setWeaponSlot(slot, weaponId);

        // CRUCIAL : On force la création de l'instance dès qu'elle est mise dans un slot
        await this.getOrCreateWeapon(weaponId);
        console.log(`[WeaponManager] Slot ${slot} ready with ${weaponId}`);
    }

    public async equipWeapon(
        character: Player,
        weaponId: string,
        boneName: string = "hand.R",
    ) {
        // 1. Désactiver l'arme actuelle (SANS LA DISPOSER)
        if (character.currentWeapon) {
            this.deactivateWeapon(character.currentWeapon);
        }

        // 2. Récupérer l'instance (instantané si déjà en cache)
        const weapon = await this.getOrCreateWeapon(weaponId);

        // 3. Activer et attacher
        if (weapon.mesh) {
            weapon.mesh.setEnabled(true);
            weapon.attachToCharacter(character, boneName);
        }

        this._activeWeapons.add(weapon);
        OnWeaponChanged.notifyObservers({ weapon: weapon });
    }

    /**
     * Cache l'arme au lieu de la détruire
     */
    public deactivateWeapon(weapon: Weapon): void {
        if (weapon.mesh) {
            weapon.mesh.setEnabled(false);
            weapon.mesh.setParent(null); // On la détache du squelette
        }
        this._activeWeapons.delete(weapon);
    }

    /**
     * Cette méthode ne doit être appelée que si on veut vraiment supprimer l'arme (ex: fin de niveau)
     */
    public removeWeapon(weapon: Weapon): void {
        if (weapon.mesh) {
            weapon.mesh.dispose();
        }
        this._instanceCache.delete(weapon.data.id); // On l'enlève du cache aussi
        this._activeWeapons.delete(weapon);
    }

    public dispose(): void {
        // Ici on nettoie tout proprement
        this._instanceCache.forEach((w) => {
            if (w.mesh) w.mesh.dispose();
        });
        this._instanceCache.clear();
        this._assetCache.forEach((c) => c.dispose());
        this._assetCache.clear();
    }
}
