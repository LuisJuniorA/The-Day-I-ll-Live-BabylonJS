import {
    Scene,
    LoadAssetContainerAsync,
    AssetContainer,
    AbstractMesh,
    Color3,
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
import { WeaponSlot } from "../core/types/WeaponTypes"; // Importé comme valeur pour le mapping
import type { Player } from "../entities/Player";

type WeaponConstructor = new (scene: Scene, data: WeaponData) => Weapon;

export class WeaponManager {
    private _scene: Scene;
    private _assetCache: Map<string, AssetContainer> = new Map();
    private _instanceCache: Map<string, Weapon> = new Map();
    private _activeWeapons: Set<Weapon> = new Set();

    /**
     * Mapping entre le slot (enum) et la classe technique à instancier.
     * On utilise les valeurs de l'enum WeaponSlot (ex: "dagger", "sword")
     */
    private _weaponClasses: Record<string, WeaponConstructor> = {
        [WeaponSlot.DAGGER]: Dagger,
        [WeaponSlot.SWORD]: Sword,
        [WeaponSlot.GREATSWORD]: GreatSword,
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
            await this.getOrCreateWeapon(weaponId);
        } catch (err) {
            console.error(`[WeaponManager] Error preloading ${weaponId}:`, err);
        }
    }

    private async getOrCreateWeapon(weaponId: string): Promise<Weapon> {
        // 1. Retour du cache si déjà instanciée
        if (this._instanceCache.has(weaponId)) {
            return this._instanceCache.get(weaponId)!;
        }

        const data = WEAPONS_DB[weaponId];
        if (!data) throw new Error(`Weapon ${weaponId} not found in database.`);

        // 2. Sélection de la classe via le weaponSlot (ex: "dagger")
        const Constructor = this._weaponClasses[data.weaponSlot];
        if (!Constructor) {
            throw new Error(
                `No class defined for weapon slot: ${data.weaponSlot}`,
            );
        }

        const weapon = new Constructor(this._scene, data);

        // 3. Gestion du container et du mesh
        if (!this._assetCache.has(weaponId)) {
            const container = await LoadAssetContainerAsync(
                data.meshPath,
                this._scene,
            );
            this._assetCache.set(weaponId, container);
        }

        const container = this._assetCache.get(weaponId)!;
        const instance = container.instantiateModelsToScene(
            (name) => `${name}_${Math.random().toString(36).substring(2, 6)}`,
            false,
        );

        const weaponMesh = instance.rootNodes[0] as AbstractMesh;
        weaponMesh.name = `cached_weapon_${weaponId}`;
        weaponMesh.setEnabled(false);

        weapon.mesh = weaponMesh;
        // À l'intérieur de ta méthode getOrCreateWeapon
        weaponMesh.getChildMeshes(true).forEach((m) => {
            const mat = m.material;
            if (!mat) return;

            // 1. Si c'est un matériau PBR (cas habituel des loaders glTF)
            if (mat.getClassName() === "PBRMaterial") {
                (mat as any).unlit = true;
            }
            // 2. Si c'est un matériau Standard
            else if (mat.getClassName() === "StandardMaterial") {
                (mat as any).disableLighting = true;
                (mat as any).emissiveColor = new Color3(1, 1, 1);
            }
        });

        // On ne définit plus weapon.slot ici, c'est géré par weapon.data.weaponSlot
        await weapon.loadVisuals();

        this._instanceCache.set(weaponId, weapon);
        return weapon;
    }

    public async setSlotWeapon(
        player: Player,
        slot: WeaponSlot,
        weaponId: string,
    ): Promise<void> {
        player.setWeaponSlot(slot, weaponId);
        await this.getOrCreateWeapon(weaponId);
        console.log(`[WeaponManager] Slot ${slot} ready with ${weaponId}`);
    }

    public async equipWeapon(
        character: Player,
        weaponId: string,
        boneName: string = "hand.R",
    ) {
        if (character.currentWeapon) {
            this.deactivateWeapon(character.currentWeapon);
        }

        const weapon = await this.getOrCreateWeapon(weaponId);

        if (weapon.mesh) {
            weapon.mesh.setEnabled(true);
            weapon.attachToCharacter(character, boneName);
        }

        this._activeWeapons.add(weapon);
        OnWeaponChanged.notifyObservers({
            weapon: weapon,
            allSlots: character.weaponSlots,
        });
    }

    public deactivateWeapon(weapon: Weapon): void {
        if (weapon.mesh) {
            weapon.mesh.setEnabled(false);
            weapon.mesh.setParent(null);
        }
        this._activeWeapons.delete(weapon);
    }

    public removeWeapon(weapon: Weapon): void {
        if (weapon.mesh) {
            weapon.mesh.dispose();
        }
        this._instanceCache.delete(weapon.data.id);
        this._activeWeapons.delete(weapon);
    }

    public dispose(): void {
        this._instanceCache.forEach((w) => w.mesh?.dispose());
        this._instanceCache.clear();
        this._assetCache.forEach((c) => c.dispose());
        this._assetCache.clear();
    }
}
