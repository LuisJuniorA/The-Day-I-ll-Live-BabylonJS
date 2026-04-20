import { Scene, Vector3 } from "@babylonjs/core";
import type { ZoneEntry } from "../core/interfaces/ZoneEntry";
import { GeometryGenerator } from "../utils/GeometryGenerator";
import type { Cell } from "../utils/RandomUtils";

export class LevelManager {
    private _scene: Scene;
    private _zones: Map<string, ZoneEntry> = new Map();

    constructor(scene: Scene) {
        this._scene = scene;
    }

    public generateProceduralWorld(
        id: string,
        grid: Cell[][],
        blockSize: number,
    ): void {
        // 1. PROTECTION : Si la zone existe déjà, on ne fait RIEN.
        // Ça évite de régénérer le mesh fusionné si on clique plusieurs fois sur "Resume"
        if (this._zones.has(id)) {
            console.warn(`[LevelManager] Zone ${id} déjà générée. Skip.`);
            return;
        }

        console.log(`[LevelManager] Génération du mesh fusionné pour ${id}...`);

        const container = GeometryGenerator.CreateWorldContainer(
            this._scene,
            grid,
            blockSize,
        );

        // 2. Marquer le mesh pour ne pas le supprimer par erreur
        const worldMesh = container.meshes.find(
            (m) => m.name === "WorldCollisionMesh",
        );
        if (worldMesh) {
            worldMesh.doNotSerialize = true; // Protection Babylon
        }

        const zone = { container, position: Vector3.Zero(), isShown: true };
        this._zones.set(id, zone);
        container.addAllToScene();
    }
}
