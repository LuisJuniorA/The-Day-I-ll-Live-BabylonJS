import {
    Scene,
    MeshBuilder,
    StandardMaterial,
    Color3,
    AssetContainer,
    Mesh,
} from "@babylonjs/core";
import { type Cell, CellType } from "./RandomUtils";
import { CollisionLayers } from "../core/constants/CollisionLayers";

export class GeometryGenerator {
    public static CreateWorldContainer(
        scene: Scene,
        grid: Cell[][],
        blockSize: number,
    ): AssetContainer {
        const container = new AssetContainer(scene);
        const meshesToMerge: Mesh[] = [];

        // 1. Créer le matériau
        const wallMat = new StandardMaterial("wallMat", scene);
        wallMat.diffuseColor = new Color3(0.3, 0.3, 0.3);
        wallMat.backFaceCulling = false; // <--- AJOUTE ÇA
        wallMat.freeze(); // Optimisation : empêche le recalcul du matériau

        const ground = MeshBuilder.CreatePlane("ground", { size: 100 }, scene);
        ground.position.z = 0; // Juste derrière les murs
        ground.material = wallMat;
        container.meshes.push(ground);

        // 2. Créer chaque bloc comme une mesh simple (pas une instance ici)
        for (let x = 0; x < grid.length; x++) {
            for (let y = 0; y < grid[x].length; y++) {
                if (grid[x][y].type === CellType.WALL) {
                    const box = MeshBuilder.CreateBox(
                        `w${x}_${y}`,
                        { size: blockSize },
                        scene,
                    );
                    box.position.set(
                        x * blockSize,
                        y * blockSize,
                        blockSize / 2,
                    );
                    meshesToMerge.push(box);
                }
            }
        }

        // 3. LA MAGIE : Fusionner toutes les meshes en une seule
        if (meshesToMerge.length > 0) {
            // MergeMeshes(tableau de meshes, disposeSource, allowMaterialOverlap, useOctree, useVertexData)
            const worldMesh = Mesh.MergeMeshes(
                meshesToMerge,
                true,
                true,
                undefined,
                false,
                true,
            );

            if (worldMesh) {
                worldMesh.name = "WorldCollisionMesh";
                worldMesh.material = wallMat;

                // On active la collision SEULEMENT sur cette grosse mesh fusionnée
                worldMesh.checkCollisions = true;
                worldMesh.collisionGroup = CollisionLayers.ENVIRONMENT;
                worldMesh.collisionMask = CollisionLayers.ALL;

                // Optimisation ultime : geler la mesh car elle ne bougera jamais
                worldMesh.freezeWorldMatrix();

                container.meshes.push(worldMesh);
            }
        }

        return container;
    }
}
