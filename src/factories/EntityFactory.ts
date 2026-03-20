import {
    Scene,
    Vector3,
    LoadAssetContainerAsync,
    AssetContainer,
    MeshBuilder,
    StandardMaterial,
    Color3,
    AbstractMesh,
    AnimationGroup,
} from "@babylonjs/core";

import { Entity } from "../core/abstracts/Entity";
import { Player } from "../entities/Player";
import { Effroi } from "../entities/Effroi";
import { ProximitySystem } from "../core/engines/ProximitySystem";
import { ENEMY_CONFIGS } from "../core/data/EnemyData";
import type { EnemyConfig } from "../core/types/EnemyConfig";

/**
 * EntityFactory
 * Centralise la création des entités en injectant les données de configuration (EnemyData)
 * et en gérant le cache des modèles 3D pour les performances.
 */
export class EntityFactory {
    private static _containerCache: Map<string, AssetContainer> = new Map();

    public static async Create(
        type: string,
        scene: Scene,
        position: Vector3,
        proximitySystem: ProximitySystem,
    ): Promise<Entity> {
        const entityType = type.toLowerCase();
        const data: EnemyConfig | undefined = ENEMY_CONFIGS[entityType];

        switch (entityType) {
            case "player":
                // On passe la position directement au constructeur du Player
                return new Player(scene, position);

            case "effroi":
                if (!data)
                    throw new Error(`Config manquante pour ${entityType}`);

                let root: AbstractMesh;
                let anims: AnimationGroup[] = [];

                try {
                    let container = this._containerCache.get(entityType);
                    if (!container) {
                        container = await LoadAssetContainerAsync(
                            `assets/models/${entityType}.glb`,
                            scene,
                        );
                        this._containerCache.set(entityType, container);
                    }

                    const entries = container.instantiateModelsToScene(
                        (n) => `${n}_${Date.now()}`,
                        true,
                    );
                    // On récupère le mesh racine (souvent __root__ dans un GLB)
                    root = entries.rootNodes[0] as AbstractMesh;
                    anims = entries.animationGroups;
                } catch (e) {
                    root = this._CreatePlaceholder(entityType, scene);
                }

                // Initialisation de l'ennemi
                const enemy = new Effroi(
                    scene,
                    data,
                    proximitySystem,
                    root,
                    anims,
                );
                // On positionne le TRANSFORM (le pivot), pas le mesh
                enemy.transform.position.copyFrom(position);
                return enemy;

            default:
                throw new Error(`Type ${type} inconnu`);
        }
    }

    private static _CreatePlaceholder(
        type: string,
        scene: Scene,
    ): AbstractMesh {
        const mesh = MeshBuilder.CreateCapsule(
            `placeholder_${type}`,
            { height: 2, radius: 0.5 },
            scene,
        );
        const mat = new StandardMaterial(`mat_${type}`, scene);
        mat.diffuseColor = type === "effroi" ? Color3.Red() : Color3.Blue();
        mesh.material = mat;
        return mesh;
    }
}
