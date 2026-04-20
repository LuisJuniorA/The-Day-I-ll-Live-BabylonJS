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

        // 1. Coquille
        this._buildShell(scene, size, container);

        // 2. Parkour Dynamique
        if (size.y > 20) {
            this._buildVerticalTower(scene, size, container);
        } else {
            this._buildHorizontalParkour(scene, size, container);
        }

        // 3. Décorations
        this._buildDecorations(scene, data.type, size, container);

        // 4. Matériaux & Collisions
        const mat = new StandardMaterial(`mat_${data.id}`, scene);
        mat.diffuseColor = this._getRoomColor(data.type);
        mat.specularColor = Color3.Black();

        container.meshes.forEach((m) => {
            m.material = mat;
            m.checkCollisions = true;
            m.collisionGroup = CollisionLayers.ENVIRONMENT;
            m.collisionMask = CollisionLayers.ALL;
            if (!m.parent) m.position.addInPlace(pos);
        });

        return container;
    }

    private static _buildShell(
        scene: Scene,
        size: Vector3,
        container: AssetContainer,
    ): void {
        const ground = MeshBuilder.CreateBox(
            "ground",
            { width: size.x, height: 4, depth: size.z },
            scene,
        );
        ground.position.y = -2;
        const wall = MeshBuilder.CreateBox(
            "back",
            { width: size.x, height: size.y + 20, depth: 1 },
            scene,
        );
        wall.position.z = size.z / 2 + 1;
        wall.position.y = size.y / 2;
        container.meshes.push(ground, wall);
    }

    private static _buildVerticalTower(
        scene: Scene,
        size: Vector3,
        container: AssetContainer,
    ): void {
        for (let i = 1; i < size.y / 6; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            const p = MeshBuilder.CreateBox(
                "plat",
                { width: 15, height: 1, depth: 6 },
                scene,
            );
            p.position.set((size.x / 4) * side, i * 6, 0);
            container.meshes.push(p);
        }
    }

    private static _buildHorizontalParkour(
        scene: Scene,
        size: Vector3,
        container: AssetContainer,
    ): void {
        for (let i = 0; i < 2; i++) {
            const p = MeshBuilder.CreateBox(
                "plat",
                { width: 6, height: 0.8, depth: 6 },
                scene,
            );
            p.position.set((Math.random() - 0.5) * 20, 5, 0);
            container.meshes.push(p);
        }
    }

    private static _buildDecorations(
        scene: Scene,
        type: RoomType,
        size: Vector3,
        container: AssetContainer,
    ): void {
        if (type === RoomType.VILLAGE) {
            const house = MeshBuilder.CreateBox("house", { size: 6 }, scene);
            house.position.set(0, 3, 2);
            container.meshes.push(house);
        }
    }

    private static _getRoomColor(type: RoomType): Color3 {
        const colors = {
            [RoomType.START]: new Color3(0.2, 0.2, 0.4),
            [RoomType.BOSS]: new Color3(0.5, 0.1, 0.1),
            [RoomType.VILLAGE]: new Color3(0.1, 0.4, 0.1),
        };
        return (colors as any)[type] || new Color3(0.2, 0.2, 0.2);
    }
}
