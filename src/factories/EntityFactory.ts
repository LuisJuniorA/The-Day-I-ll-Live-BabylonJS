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
    TransformNode,
} from "@babylonjs/core";

import { Entity } from "../core/abstracts/Entity";
import { Player } from "../entities/Player";
import { Effroi } from "../entities/Effroi";
import { ProximitySystem } from "../core/engines/ProximitySystem";
import { ENEMY_CONFIGS } from "../core/data/EnemyData";
import type { EnemyConfig } from "../core/types/EnemyConfig";

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
                return new Player(scene, position);

            case "effroi": {
                if (!data)
                    throw new Error(`Config manquante pour ${entityType}`);

                let root: AbstractMesh;
                let anims: AnimationGroup[] = [];

                try {
                    // 1. CHARGEMENT / CACHE DU GLB
                    let container = this._containerCache.get(entityType);
                    if (!container) {
                        container = await LoadAssetContainerAsync(
                            `assets/models/${entityType}.glb`,
                            scene,
                        );
                        this._containerCache.set(entityType, container);
                    }

                    // 2. INSTANCIATION DES MESHES
                    const entries = container.instantiateModelsToScene(
                        (n) => `${n}_${Date.now()}`,
                        true,
                    );

                    // root est le noeud "__root__" du GLB
                    root = entries.rootNodes[0] as AbstractMesh;
                    anims = entries.animationGroups;
                    console.log(
                        `Animations pour ${entityType}:`,
                        anims.map((a) => a.name),
                    );

                    // 3. CRÉATION DU PIVOT VISUEL (L'OFFSET)
                    const visualPivot = new TransformNode(
                        `visual_pivot_${entityType}`,
                        scene,
                    );

                    // --- CONFIGURATION DE LA HIÉRARCHIE ---
                    // On crée l'entité d'abord pour avoir le Transform parent
                    const enemy = new Effroi(
                        scene,
                        data,
                        proximitySystem,
                        root,
                        anims,
                    );

                    // Le root (collision) est fils du transform logique
                    root.parent = enemy.transform;

                    // Le pivot visuel est fils du root (collision)
                    visualPivot.parent = root;

                    // On déplace tous les enfants réels (géométrie, squelette) sous le pivot visuel
                    const children = root.getChildren();
                    children.forEach((child) => {
                        if (child !== visualPivot) {
                            child.parent = visualPivot;
                        }
                    });

                    // 4. RÉGLAGES VISUELS PRÉCIS
                    // On applique la rotation sur le root pour que la collision suive l'orientation
                    root.rotationQuaternion = null;
                    root.rotation.setAll(0);
                    root.rotation.x = 6.4; // Ton réglage d'inclinaison
                    root.rotation.y = Math.PI / 2; // Regard vers la droite
                    root.scaling.setAll(1.0);

                    // L'OFFSET : On descend le pivot visuel de 1 unité
                    // Les pieds de l'Effroi seront maintenant à Y=0 par rapport au transform
                    visualPivot.position.y = -1.0;

                    // Positionnement initial dans le monde
                    enemy.transform.position.copyFrom(position);

                    return enemy;
                } catch (e) {
                    console.error(
                        `Erreur chargement ${entityType}, fallback placeholder`,
                        e,
                    );
                    const placeholder = this._CreatePlaceholder(
                        entityType,
                        scene,
                    );
                    const enemy = new Effroi(
                        scene,
                        data,
                        proximitySystem,
                        placeholder,
                        [],
                    );
                    enemy.transform.position.copyFrom(position);
                    return enemy;
                }
            }

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
