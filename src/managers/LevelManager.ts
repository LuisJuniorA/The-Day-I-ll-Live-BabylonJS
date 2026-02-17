import {
    Scene,
    AssetContainer,
    Vector3,
    LoadAssetContainerAsync
} from "@babylonjs/core";
import type { LoadAssetContainerOptions } from "@babylonjs/core";

interface ZoneEntry {
    readonly container: AssetContainer;
    isShown: boolean;
}

export class LevelManager {
    // Déclaration explicite des propriétés
    private readonly _scene: Scene;
    private readonly _zones: Map<string, ZoneEntry>;

    constructor(scene: Scene) {
        // Initialisation explicite requise par erasableSyntaxOnly
        this._scene = scene;
        this._zones = new Map<string, ZoneEntry>();
    }

    /**
     * Charge une zone via LoadAssetContainerAsync (BJS 8)
     */
    public async loadZone(
        id: string,
        url: string,
        offset: Vector3,
        options?: LoadAssetContainerOptions
    ): Promise<void> {
        if (this._zones.has(id)) return;

        try {
            const container = await LoadAssetContainerAsync(url, this._scene, options);

            for (const mesh of container.meshes) {
                if (!mesh.parent) {
                    mesh.position.addInPlace(offset);
                }
            }

            container.removeAllFromScene();

            this._zones.set(id, {
                container,
                isShown: false
            });

        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            console.error(`[LevelManager] Failed to load zone ${id}: ${message}`);
            throw err;
        }
    }

    /**
     * Streaming des zones selon la position du joueur
     */
    public update(playerPos: Vector3, range: number, zoneCoords: Map<string, Vector3>): void {
        for (const [id, pos] of zoneCoords) {
            const zone = this._zones.get(id);
            if (!zone) continue;

            const isNear = Vector3.Distance(playerPos, pos) < range;

            if (isNear && !zone.isShown) {
                zone.container.addAllToScene();
                zone.isShown = true;
            } else if (!isNear && zone.isShown) {
                zone.container.removeAllFromScene();
                zone.isShown = false;
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