// managers/LevelManager.ts
import { Scene, Vector3, LoadAssetContainerAsync } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type { LoadAssetContainerOptions } from "@babylonjs/core";

import { GeometryGenerator } from "../utils/GeometryGenerator";
import { CollisionLayers } from "../core/constants/CollisionLayers";
import type { ZoneEntry } from "../core/interfaces/ZoneEntry";
import type { RoomData } from "../core/interfaces/RoomData";
import type { ZoneConfig } from "../core/interfaces/ZoneConfig";

export class LevelManager {
    private readonly _scene: Scene;
    private readonly _zones: Map<string, ZoneEntry>;

    constructor(scene: Scene) {
        this._scene = scene;
        this._zones = new Map<string, ZoneEntry>();
    }

    /**
     * Gère l'affichage d'une salle générée procéduralement.
     * Si la salle n'existe pas encore en mémoire, elle est créée via GeometryGenerator.
     */
    public showProceduralRoom(data: RoomData): void {
        let zone = this._zones.get(data.id);

        // 1. Si la zone n'existe pas, on la génère
        if (!zone) {
            const container = GeometryGenerator.CreateRoomContainer(
                this._scene,
                data,
            );

            // On convertit la position simple du Core {x,y,z} en Vector3 Babylon
            const position = new Vector3(
                data.position.x,
                data.position.y,
                data.position.z,
            );

            zone = {
                container,
                position,
                isShown: false,
            };

            // On s'assure qu'elle est détachée de la scène au départ
            zone.container.removeAllFromScene();
            this._zones.set(data.id, zone);
        }

        // 2. Si elle n'est pas affichée, on l'ajoute à la scène
        if (!zone.isShown) {
            zone.container.addAllToScene();
            zone.isShown = true;
            console.log(`[LevelManager] Showing procedural room: ${data.id}`);
        }
    }

    /**
     * Masque une zone spécifique (appelée par le WorldEngine via le délégué)
     */
    public hideZone(id: string): void {
        const zone = this._zones.get(id);
        if (zone && zone.isShown) {
            zone.container.removeAllFromScene();
            zone.isShown = false;
            console.log(`[LevelManager] Hiding room: ${id}`);
        }
    }

    /**
     * Vérifie si une zone est déjà enregistrée
     */
    public hasZone(id: string): boolean {
        return this._zones.has(id);
    }

    /**
     * Update classique : utile si tu veux garder une logique de distance autonome
     * (sinon, c'est le WorldEngine qui gère les appels show/hide)
     */
    public update(playerPos: Vector3, range: number): void {
        for (const [_, zone] of this._zones) {
            const dist = Vector3.Distance(playerPos, zone.position);
            const isNear = dist < range;

            if (isNear && !zone.isShown) {
                zone.container.addAllToScene();
                zone.isShown = true;
            } else if (!isNear && zone.isShown) {
                zone.container.removeAllFromScene();
                zone.isShown = false;
            }
        }
    }

    /**
     * Charge des assets GLB externes (pour mixer procédural et fait-main)
     */
    public async loadWorld(zonesConfig: ZoneConfig[]): Promise<void> {
        const loadingPromises = zonesConfig.map((zone) =>
            this.loadZone(zone.id, zone.path, zone.position),
        );
        await Promise.all(loadingPromises);
    }

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

            for (const mesh of container.meshes) {
                const name = mesh.name.toLowerCase();
                const isEnv = [
                    "ground",
                    "floor",
                    "wall",
                    "architecture",
                    "obstacle",
                ].some((k) => name.includes(k));

                if (isEnv) {
                    mesh.checkCollisions = true;
                    mesh.collisionGroup = CollisionLayers.ENVIRONMENT;
                    mesh.collisionMask = CollisionLayers.ALL;
                }

                if (!mesh.parent) {
                    mesh.position.addInPlace(offset);
                }
            }

            container.removeAllFromScene();
            this._zones.set(id, {
                container,
                position: offset,
                isShown: false,
            });
        } catch (err) {
            console.error(`[LevelManager] Failed to load GLB zone ${id}:`, err);
        }
    }

    public dispose(): void {
        for (const zone of this._zones.values()) {
            zone.container.dispose();
        }
        this._zones.clear();
    }
}
