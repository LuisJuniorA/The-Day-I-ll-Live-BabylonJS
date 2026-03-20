// managers/LevelManager.ts
import { Scene, Vector3, LoadAssetContainerAsync } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type { LoadAssetContainerOptions } from "@babylonjs/core";
import type { ZoneConfig } from "../core/interfaces/ZoneConfig";
import type { ZoneEntry } from "../core/interfaces/ZoneEntry";
import { CollisionLayers } from "../core/data/CollisionLayers";

export class LevelManager {
    private readonly _scene: Scene;
    // Map consolidée : contient le container ET la position
    private readonly _zones: Map<string, ZoneEntry>;

    constructor(scene: Scene) {
        this._scene = scene;
        this._zones = new Map<string, ZoneEntry>();
    }

    /**
     * Charge l'ensemble du monde à partir de la configuration
     */
    public async loadWorld(zonesConfig: ZoneConfig[]): Promise<void> {
        const loadingPromises = zonesConfig.map((zone) =>
            this.loadZone(zone.id, zone.path, zone.position),
        );

        await Promise.all(loadingPromises);
        console.log("World loaded successfully");
    }

    /**
     * Charge une zone individuelle
     */
    private async loadZone(
        id: string,
        url: string,
        offset: Vector3,
        options?: LoadAssetContainerOptions,
    ): Promise<void> {
        if (this._zones.has(id)) return;

        try {
            const container = await LoadAssetContainerAsync(
                url,
                this._scene,
                options,
            );

            // Déplacer les meshes vers leur offset global
            for (const mesh of container.meshes) {
                if (
                    mesh.name.toLowerCase().includes("ground") ||
                    mesh.name.toLowerCase().includes("floor")
                ) {
                    mesh.checkCollisions = true;
                    mesh.collisionGroup = CollisionLayers.ENVIRONMENT;
                    mesh.collisionMask = CollisionLayers.ALL;
                }

                if (!mesh.parent) {
                    mesh.position.addInPlace(offset);
                }
            }

            // On s'assure qu'ils ne sont pas affichés au chargement
            container.removeAllFromScene();

            this._zones.set(id, {
                container,
                position: offset,
                isShown: false,
            });
        } catch (err) {
            console.error(`[LevelManager] Failed to load zone ${id}:`, err);
        }
    }

    /**
     * Update simplifié : plus besoin de passer la map des positions
     */
    public update(playerPos: Vector3, range: number): void {
        for (const [id, zone] of this._zones) {
            // On calcule la distance avec la position stockée dans la zone
            const dist = Vector3.Distance(playerPos, zone.position);
            const isNear = dist < range;

            if (isNear && !zone.isShown) {
                zone.container.addAllToScene();
                zone.isShown = true;
                // Optionnel : Log pour débugger
                console.log(`Showing zone: ${id}`);
            } else if (!isNear && zone.isShown) {
                zone.container.removeAllFromScene();
                zone.isShown = false;
                console.log(`Unloading zone : ${id}`);
            }
        }
    }

    public dispose(): void {
        for (const zone of this._zones.values()) {
            zone.container.dispose();
        }
        this._zones.clear();
    }
}
