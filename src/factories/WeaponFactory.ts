import { Scene, SceneLoader, AbstractMesh } from "@babylonjs/core";
import type { Weapon } from "../core/abstracts/Weapon";
import { WEAPONS_DB } from "../data/WeaponsDb";
import { Dagger } from "../weapons/Dagger";
import { Sword } from "../weapons/Sword";
import { GreatSword } from "../weapons/GreatSword";

export class WeaponFactory {
    private static _meshCache: Map<string, AbstractMesh> = new Map();
    private static _loadingPromises: Map<string, Promise<AbstractMesh>> =
        new Map();

    /**
     * Récupère un mesh depuis le cache ou le charge si nécessaire.
     * Retourne un clone pour permettre des transformations indépendantes.
     * Peut retourner null si le clone échoue.
     */
    public static async getOrLoadMesh(
        scene: Scene,
        meshPath: string,
    ): Promise<AbstractMesh | null> {
        // Si déjà chargé, on retourne un clone
        if (this._meshCache.has(meshPath)) {
            const cachedMesh = this._meshCache.get(meshPath)!;
            return cachedMesh.clone(
                cachedMesh.name + "_clone",
                cachedMesh.parent,
            );
        }

        // Si un chargement est déjà en cours pour ce path, on attend la même promesse
        if (this._loadingPromises.has(meshPath)) {
            const mesh = await this._loadingPromises.get(meshPath)!;
            return mesh.clone(mesh.name + "_clone", mesh.parent);
        }

        const loadPromise = (async () => {
            try {
                const result = await SceneLoader.ImportMeshAsync(
                    "",
                    "",
                    meshPath,
                    scene,
                );
                const rootMesh = result.meshes[0];
                this._meshCache.set(meshPath, rootMesh);
                return rootMesh;
            } catch (error) {
                console.error(
                    `Erreur lors du chargement du mesh: ${meshPath}`,
                    error,
                );
                throw error;
            } finally {
                this._loadingPromises.delete(meshPath);
            }
        })();

        this._loadingPromises.set(meshPath, loadPromise);
        const mesh = await loadPromise;
        return mesh.clone(mesh.name + "_clone", mesh.parent);
    }

    /**
     * Crée une arme, charge ses visuels et initialise ses composants.
     * @param weaponId L'identifiant unique dans WEAPONS_DB (ex: "iron_dagger")
     * @param scene La scène Babylon
     */
    public static async createWeaponAsync(
        weaponId: string,
        scene: Scene,
    ): Promise<Weapon | null> {
        const data = WEAPONS_DB[weaponId];

        if (!data) {
            console.error(
                `L'arme avec l'id ${weaponId} n'existe pas dans la DB.`,
            );
            return null;
        }

        let weapon: Weapon;

        // 1. Instanciation du type d'arme
        switch (data.weaponSlot) {
            case "Dagger":
                weapon = new Dagger(scene, data);
                break;
            case "Sword":
                weapon = new Sword(scene, data);
                break;
            case "GreatSword":
                weapon = new GreatSword(scene, data);
                break;
            default:
                throw new Error(`Type de moveset inconnu: ${data.type}`);
        }

        // 2. Chargement du mesh (si le chemin est présent)
        if (data.meshPath) {
            try {
                const mesh = await this.getOrLoadMesh(scene, data.meshPath);
                if (mesh) {
                    weapon.mesh = mesh;
                } else {
                    console.warn(
                        `Le clone du mesh a renvoyé null pour ${weaponId}`,
                    );
                }
            } catch (e) {
                console.error(
                    `Impossible de charger le mesh pour ${weaponId}:`,
                    e,
                );
                // On ne crash pas, l'arme existe mais sera invisible
            }
        }

        // 3. Appel des hooks de post-chargement (ex: modification de vertices dans Sword)
        await weapon.loadVisuals();

        return weapon;
    }
}
