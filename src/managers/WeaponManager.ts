import {
    Scene,
    LoadAssetContainerAsync,
    AssetContainer,
    AbstractMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

import { WEAPONS_DB } from "../data/WeaponsDb";
import type { Weapon } from "../core/abstracts/Weapon";
import type { Character } from "../core/abstracts/Character";
import type { WeaponData } from "../core/types/WeaponStats";

// Import des classes concrètes
import { Dagger } from "../weapons/Dagger";
import { Sword } from "../weapons/Sword";
import { GreatSword } from "../weapons/GreatSword";
import { OnWeaponChanged } from "../core/interfaces/CombatEvent";

/**
 * Type utilitaire pour définir un constructeur de Weapon
 */
type WeaponConstructor = new (scene: Scene, data: WeaponData) => Weapon;

export class WeaponManager {
    private _scene: Scene;
    private _assetCache: Map<string, AssetContainer> = new Map();
    private _activeWeapons: Set<Weapon> = new Set();

    /**
     * Le Registry qui lie le type (string) à la classe (Constructor)
     */
    private _weaponClasses: Record<string, WeaponConstructor> = {
        Dagger: Dagger,
        Sword: Sword,
        GreatSword: GreatSword,
        // Ajoute ici tes futurs types : "Bow": Bow, etc.
    };

    constructor(scene: Scene) {
        this._scene = scene;
    }

    /**
     * Précharge le modèle GLB pour éviter les lags en jeu
     */
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

    /**
     * Instancie la classe appropriée et clone le visuel
     */
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

        // 1. Instancier avec un nom unique pour éviter les conflits de matériel
        const instance = container.instantiateModelsToScene(
            (name) => `${name}_${Math.random().toString(36).substr(2, 4)}`,
        );

        // 2. Récupérer le root (souvent nommé __root__)
        const weaponMesh = instance.rootNodes[0] as AbstractMesh;
        weaponMesh.name = `weapon_${weaponId}_${Date.now()}`;

        // --- NETTOYAGE DES TRANSFORMATIONS GLB ---
        // On détache le mesh de toute transformation monde précédente
        weaponMesh.setParent(null);
        weaponMesh.position.setAll(0);

        // Très important : désactiver le quaternion pour pouvoir utiliser weapon.rotation plus tard
        weaponMesh.rotationQuaternion = null;
        weaponMesh.rotation.setAll(0);
        weaponMesh.scaling.setAll(1);

        weapon.mesh = weaponMesh;

        await weapon.loadVisuals();
        this._activeWeapons.add(weapon);
        return weapon;
    }

    /**
     * Équipe une arme sur un personnage et gère l'attachement aux os
     */
    public async equipWeapon(
        character: Character,
        weaponId: string,
        boneName: string = "hand.R",
    ) {
        const weapon = await this.createWeapon(weaponId);

        // Utilise la méthode attachToCharacter définie dans ton abstract Weapon
        weapon.attachToCharacter(character, boneName);

        OnWeaponChanged.notifyObservers({ weapon: weapon });
    }

    /**
     * Nettoyage
     */
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
