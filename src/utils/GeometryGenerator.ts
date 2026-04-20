import {
    MeshBuilder,
    Scene,
    Vector3,
    AssetContainer,
    StandardMaterial,
    Color3,
} from "@babylonjs/core";
import { CollisionLayers } from "../core/constants/CollisionLayers";
import { RoomType } from "../core/types/RoomType";
import type { RoomData } from "../core/interfaces/RoomData";

export class GeometryGenerator {
    public static CreateRoomContainer(
        scene: Scene,
        data: RoomData,
    ): AssetContainer {
        const container = new AssetContainer(scene);
        const pos = new Vector3(
            data.position.x,
            data.position.y,
            data.position.z,
        );
        const size = new Vector3(data.size.x, data.size.y, data.size.z);

        // 1. Structure de base
        this._buildShell(scene, data, size, container);

        // 2. Génération de plateformes de Parkour (Nouveau !)
        this._buildParkour(scene, size, container);

        // 3. Décorations et Spécificités
        this._buildDecorations(scene, data.type, size, container);

        // 4. Post-traitement des matériaux et collisions
        const roomMat = new StandardMaterial(`mat_${data.id}`, scene);
        roomMat.diffuseColor = this._getRoomColor(data.type);
        roomMat.specularColor = new Color3(0, 0, 0); // Évite les reflets moches

        container.meshes.forEach((m) => {
            m.material = roomMat;
            m.checkCollisions = true;
            m.collisionGroup = CollisionLayers.ENVIRONMENT;
            m.collisionMask = CollisionLayers.ALL;

            if (!m.parent) {
                m.position.addInPlace(pos);
            }
        });

        return container;
    }

    private static _buildShell(
        scene: Scene,
        _data: RoomData,
        size: Vector3,
        container: AssetContainer,
    ): void {
        // Sol plus épais pour éviter de passer au travers en tombant vite
        const ground = MeshBuilder.CreateBox(
            "ground",
            { width: size.x, height: 4, depth: size.z },
            scene,
        );
        ground.position.y = -2;

        // Mur de fond (pour la parallaxe ou masquer le vide)
        const backWall = MeshBuilder.CreateBox(
            "wall_back",
            { width: size.x, height: size.y + 10, depth: 1 },
            scene,
        );
        backWall.position.z = size.z / 2 + 1;
        backWall.position.y = size.y / 2;

        container.meshes.push(ground, backWall);
    }

    private static _buildParkour(
        scene: Scene,
        size: Vector3,
        container: AssetContainer,
    ): void {
        // On définit des paliers de hauteur (ex: tous les 4 unités)
        const stepY = 5;
        const stepX = 8;
        const platformWidth = 5;

        // Génération de quelques plateformes simples pour le parkour
        for (let y = stepY; y < size.y - 5; y += stepY) {
            for (let x = -size.x / 2 + 5; x < size.x / 2 - 5; x += stepX) {
                // On ajoute un peu d'aléatoire pour que ce ne soit pas une grille parfaite
                if (Math.random() > 0.4) {
                    const plat = MeshBuilder.CreateBox(
                        "platform",
                        {
                            width: platformWidth,
                            height: 0.8,
                            depth: size.z - 2, // Un peu moins profond que la salle
                        },
                        scene,
                    );

                    plat.position.set(x + Math.random() * 2, y, 0);
                    container.meshes.push(plat);
                }
            }
        }
    }

    // ... Garde tes méthodes _buildDecorations, _createVillageDecor, etc. identiques ...

    private static _buildDecorations(
        scene: Scene,
        type: RoomType,
        size: Vector3,
        container: AssetContainer,
    ): void {
        switch (type) {
            case RoomType.VILLAGE:
                this._createVillageDecor(scene, container);
                break;
            case RoomType.POWERUP:
                this._createAltar(scene, container);
                break;
            case RoomType.BOSS:
                this._createBossArena(scene, size, container);
                break;
        }
    }

    private static _createVillageDecor(
        scene: Scene,
        container: AssetContainer,
    ): void {
        for (let i = 0; i < 3; i++) {
            const house = MeshBuilder.CreateBox("house", { size: 6 }, scene);
            house.position.set(-15 + i * 15, 3, 2);
            container.meshes.push(house);
        }
    }

    private static _createAltar(scene: Scene, container: AssetContainer): void {
        const base = MeshBuilder.CreateBox(
            "altar_base",
            { width: 4, height: 1, depth: 4 },
            scene,
        );
        base.position.y = 0.5;
        container.meshes.push(base);
    }

    private static _createBossArena(
        scene: Scene,
        size: Vector3,
        container: AssetContainer,
    ): void {
        // Piliers plus massifs
        for (const side of [-1, 1]) {
            const pillar = MeshBuilder.CreateCylinder(
                "pillar",
                { height: size.y, diameter: 4 },
                scene,
            );
            pillar.position.set((size.x / 2.2) * side, size.y / 2, 0);
            container.meshes.push(pillar);
        }
    }

    private static _getRoomColor(type: RoomType): Color3 {
        const colors = {
            [RoomType.START]: new Color3(0.2, 0.2, 0.3),
            [RoomType.PATH]: new Color3(0.15, 0.15, 0.15),
            [RoomType.VILLAGE]: new Color3(0.1, 0.3, 0.1),
            [RoomType.POWERUP]: new Color3(0.3, 0.3, 0.1),
            [RoomType.BOSS]: new Color3(0.3, 0.05, 0.05),
        };
        return colors[type] || new Color3(0.5, 0.5, 0.5);
    }
}
