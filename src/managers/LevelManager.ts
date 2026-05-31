import { Scene, AssetContainer, Vector3, TransformNode } from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { GeometryGenerator } from "../utils/GeometryGenerator";
import type { Cell } from "../utils/RandomUtils";
import type { ZoneEntry } from "../core/interfaces/ZoneEntry";
import { CollisionLayers } from "../core/constants/CollisionLayers";

/**
 * Gère le chargement, la configuration physique (colliders)
 * et l'extraction des points de spawn des niveaux GLB.
 */
export class LevelManager {
    private _scene: Scene;
    private _mapContainer: AssetContainer | null = null;
    private _zones: Map<string, ZoneEntry> = new Map();

    // Stocke les nœuds détectés avec le préfixe "spawn_"
    private _spawnPoints: TransformNode[] = [];

    constructor(scene: Scene) {
        this._scene = scene;
    }

    /**
     * Charge une map .glb, configure les collisions et identifie les spawners.
     */
    public async loadMap(url: string): Promise<void> {
        this.clearAll();

        try {
            const container = await LoadAssetContainerAsync(url, this._scene);

            // Renommage de sécurité du root
            if (container.meshes.length > 0) {
                const root = container.meshes[0];
                if (root.name === "__root__") root.name = "MAP";
            }

            container.transformNodes.forEach((node) => {
                const name = node.name.toLowerCase();
                if (name.startsWith("spawn_") || name.startsWith("chest_")) {
                    this._processSpawner(node);
                }
            });

            // Traitement des nœuds
            container.meshes.forEach((mesh) => {
                const name = mesh.name.toLowerCase();

                // 2. Logique de collision automatique (via nommage Blender)
                if (name.includes("collider")) {
                    mesh.checkCollisions = true;
                    mesh.isPickable = true;
                    mesh.collisionGroup = CollisionLayers.ENVIRONMENT;
                    mesh.collisionMask =
                        CollisionLayers.PLAYER | CollisionLayers.ENEMY;
                }
                // 3. Logique visuelle
                if (mesh.name.toLowerCase().includes("background")) {
                    mesh.checkCollisions = false;

                    // Si c'est un PBRMaterial (standard pour les .glb)
                    if (mesh.material) {
                        // Option 1 : Force l'éclairage complet (Unlit)
                        (mesh.material as any).unlit = true;

                        // Option 2 (Alternative) : Si 'unlit' n'est pas disponible,
                        // on sature l'émissif pour simuler l'absence d'ombre
                        // (mesh.material as any).emissiveColor = new Color3(1, 1, 1);
                    }
                }

                // 3. Logique visuelle
                if (name.includes("visual")) {
                    mesh.checkCollisions = false;
                }

                mesh.doNotSerialize = true;
            });

            container.addAllToScene();
            this._mapContainer = container;
            console.log(
                `[LevelManager] Map chargée. Spawners détectés : ${this._spawnPoints.length}`,
            );
        } catch (error) {
            console.error(
                "[LevelManager] Erreur au chargement du GLB :",
                error,
            );
        }
    }

    /**
     * Analyse un mesh de spawn et extrait sa donnée "type"
     */
    private _processSpawner(node: TransformNode): void {
        // On essaie de récupérer le type à plusieurs niveaux de profondeur
        // 1. Directement dans metadata
        // 2. Dans le bloc spécial glTF "extras" (là où Blender place les Custom Properties)
        const meta = node.metadata || {};
        // C'est le chemin classique pour les Custom Properties exportées depuis Blender
        console.log(meta);
        const type =
            meta.type ||
            meta.gltf?.extras?.type ||
            meta.extras?.type ||
            "default";

        // On normalise le metadata pour que EntityManager n'ait qu'à lire 'type'
        node.metadata = { ...meta, type: type };

        this._spawnPoints.push(node);

        // On masque l'objet "Empty" pour qu'il ne soit pas visible en jeu
        node.isVisible = false;

        console.log(
            `[LevelManager] Spawner "${node.name}" détecté avec type : "${type}"`,
        );
    }

    public getSpawnPoints(): TransformNode[] {
        return this._spawnPoints;
    }

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

        if (worldMesh) worldMesh.doNotSerialize = true;

        this._zones.set(id, {
            container,
            position: Vector3.Zero(),
            isShown: true,
        });
        container.addAllToScene();
    }

    public clearAll(): void {
        if (this._mapContainer) {
            this._mapContainer.removeAllFromScene();
            this._mapContainer.dispose();
            this._mapContainer = null;
        }
        this._spawnPoints = [];

        this._zones.forEach((zone) => {
            zone.container.removeAllFromScene();
            zone.container.dispose();
        });
        this._zones.clear();
    }
}
