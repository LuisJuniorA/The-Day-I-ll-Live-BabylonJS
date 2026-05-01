import { Scene, AssetContainer, Vector3 } from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { GeometryGenerator } from "../utils/GeometryGenerator";
import type { Cell } from "../utils/RandomUtils";
import type { ZoneEntry } from "../core/interfaces/ZoneEntry";

export class LevelManager {
    private _scene: Scene;
    private _mapContainer: AssetContainer | null = null;
    private _zones: Map<string, ZoneEntry> = new Map();

    constructor(scene: Scene) {
        this._scene = scene;
    }

    /**
     * Charge un niveau artisanal (.glb)
     */
    public async loadMap(url: string): Promise<void> {
        // On nettoie l'ancien conteneur s'il existe pour éviter les fuites mémoire
        if (this._mapContainer) {
            this._mapContainer.removeAllFromScene();
            this._mapContainer.dispose();
            this._mapContainer = null;
        }

        try {
            const container = await LoadAssetContainerAsync(url, this._scene);

            if (container.meshes.length > 0) {
                const root = container.meshes[0];
                if (root.name === "__root__") {
                    root.name = "MAP";
                }
            }

            container.meshes.forEach((mesh) => {
                const name = mesh.name.toLowerCase();

                // Logique de collision automatique par nommage Blender
                if (name.includes("collider")) {
                    mesh.checkCollisions = true;
                    mesh.visibility = 0;
                    mesh.isPickable = false;
                }

                // Logique visuelle
                if (name.includes("visual")) {
                    mesh.checkCollisions = false;
                }

                mesh.doNotSerialize = true;
            });

            container.addAllToScene();
            this._mapContainer = container;
            console.log(`[LevelManager] Map GLB chargée : ${url}`);
        } catch (error) {
            console.error(
                "[LevelManager] Erreur au chargement du GLB :",
                error,
            );
        }
    }

    /**
     * Génère un monde procédural basé sur une grille
     */
    public generateProceduralWorld(
        id: string,
        grid: Cell[][],
        blockSize: number,
    ): void {
        if (this._zones.has(id)) return;

        const container = GeometryGenerator.CreateWorldContainer(
            this._scene,
            grid,
            blockSize,
        );

        const worldMesh = container.meshes.find(
            (m) => m.name === "WorldCollisionMesh",
        );
        if (worldMesh) {
            worldMesh.doNotSerialize = true;
        }

        const zone = { container, position: Vector3.Zero(), isShown: true };
        this._zones.set(id, zone);
        container.addAllToScene();
        console.log(`[LevelManager] Zone procédurale générée : ${id}`);
    }

    public clearAll(): void {
        if (this._mapContainer) {
            this._mapContainer.removeAllFromScene();
            this._mapContainer.dispose();
            this._mapContainer = null;
        }
        this._zones.forEach((zone) => {
            zone.container.removeAllFromScene();
            zone.container.dispose();
        });
        this._zones.clear();
    }
}
