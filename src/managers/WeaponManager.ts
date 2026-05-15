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
import { WeaponSlot } from "../core/types/WeaponTypes";
import type { Player } from "../entities/Player";
import {
    OnRequestEquipToSlot,
    OnInventoryUpdated,
} from "../core/interfaces/InventoryEvent";

type WeaponConstructor = new (scene: Scene, data: WeaponData) => Weapon;

export class WeaponManager {
    private _scene: Scene;
    private _assetCache: Map<string, AssetContainer> = new Map();
    private _instanceCache: Map<string, Weapon> = new Map();
    private _loadingPromises: Map<string, Promise<Weapon>> = new Map();

    private _weaponClasses: Record<string, WeaponConstructor> = {
        [WeaponSlot.DAGGER]: Dagger,
        [WeaponSlot.SWORD]: Sword,
        [WeaponSlot.GREATSWORD]: GreatSword,
    };

    constructor(scene: Scene) {
        this._scene = scene;

        OnRequestWeaponEquip.add(async (event) => {
            await this.equipWeapon(event.character as Player, event.weaponId);
        });

        OnRequestEquipToSlot.add(async (event) => {
            const { player, weaponId, slot } = event;
            const isRemoving = weaponId === "" || weaponId === null;

            // 1. Mise à jour logique (crucial)
            player.setWeaponSlot(slot, weaponId);

            if (isRemoving) {
                // Si l'arme retirée du slot est celle qu'on a en main
                if (player.currentWeapon?.weaponSlot === slot) {
                    this.deactivateWeapon(player.currentWeapon);
                    player.currentWeapon = null as any;

                    // On essaie de prendre une autre arme
                    player.switchWeapon();
                }
            } else {
                // PRELOAD
                this.getOrCreateWeapon(weaponId!).catch(() => {});

                // EQUIP si main vide ou slot actif
                if (
                    !player.currentWeapon ||
                    player.currentWeapon.weaponSlot === slot
                ) {
                    await this.equipWeapon(player, weaponId!);
                }
            }

            // --- CORRECTION ICI ---
            // On notifie TOUJOURS le HUD ici pour qu'il voit que le slot est désormais vide (null)
            // même si l'arme en main n'a pas changé.
            OnWeaponChanged.notifyObservers({
                weapon: player.currentWeapon,
                allSlots: player.weaponSlots, // Le HUD va lire ça et vider l'icône
            });

            OnInventoryUpdated.notifyObservers();
        });
    }

    private async getOrCreateWeapon(weaponId: string): Promise<Weapon> {
        if (this._instanceCache.has(weaponId)) {
            return this._instanceCache.get(weaponId)!;
        }

        if (this._loadingPromises.has(weaponId)) {
            return this._loadingPromises.get(weaponId)!;
        }

        const loadPromise = (async () => {
            const data = WEAPONS_DB[weaponId];
            if (!data) throw new Error(`Weapon ${weaponId} not found.`);

            let first = false;
            const Constructor = this._weaponClasses[data.weaponSlot];
            const weapon = new Constructor(this._scene, data);
            console.log(this._assetCache);
            if (!this._assetCache.has(weaponId)) {
                const container = await LoadAssetContainerAsync(
                    data.meshPath,
                    this._scene,
                );
                this._assetCache.set(weaponId, container);
                first = true;
            }

            const container = this._assetCache.get(weaponId)!;
            const instance = container.instantiateModelsToScene(
                (name) => `cached_${weaponId}_${name}`,
                false,
            );

            const weaponMesh = instance.rootNodes[0] as AbstractMesh;
            weaponMesh.setEnabled(false);

            weaponMesh.getChildMeshes(true).forEach((m) => {
                const mat = m.material;
                if (!mat) return;
                if (mat.getClassName() === "PBRMaterial") {
                    (mat as any).unlit = true;
                } else if (mat.getClassName() === "StandardMaterial") {
                    (mat as any).disableLighting = true;
                    (mat as any).emissiveColor = new Color3(1, 1, 1);
                }
            });

            weapon.mesh = weaponMesh;
            if (first) await weapon.loadVisuals();

            this._instanceCache.set(weaponId, weapon);
            this._loadingPromises.delete(weaponId);
            return weapon;
        })();

        this._loadingPromises.set(weaponId, loadPromise);
        return loadPromise;
    }

    public async equipWeapon(
        character: Player,
        weaponId: string | null,
        boneName: string = "hand.R",
    ) {
        if (character.currentWeapon) {
            this.deactivateWeapon(character.currentWeapon);
            (character as any).currentWeapon = null;
        }

        if (!weaponId || weaponId === "") {
            OnWeaponChanged.notifyObservers({
                weapon: null as any,
                allSlots: character.weaponSlots,
            });
            return;
        }

        try {
            const weapon = await this.getOrCreateWeapon(weaponId);

            if (weapon && weapon.mesh) {
                weapon.mesh.setEnabled(true);
                weapon.attachToCharacter(character, boneName);
                (character as any).currentWeapon = weapon;

                OnWeaponChanged.notifyObservers({
                    weapon: weapon,
                    allSlots: character.weaponSlots,
                });
            }
        } catch (error) {
            console.error(`[WeaponManager] Error:`, error);
        }
    }

    public deactivateWeapon(weapon: Weapon): void {
        if (weapon.mesh) {
            weapon.mesh.setEnabled(false);
        }
    }

    public dispose(): void {
        this._instanceCache.forEach((w) => w.mesh?.dispose());
        this._instanceCache.clear();
        this._assetCache.forEach((c) => c.dispose());
        this._assetCache.clear();
        this._loadingPromises.clear();
    }
}
