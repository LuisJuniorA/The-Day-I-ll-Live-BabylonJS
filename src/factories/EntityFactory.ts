import {
    Scene,
    Vector3,
    LoadAssetContainerAsync,
    AssetContainer,
    MeshBuilder,
    AbstractMesh,
    AnimationGroup,
    TransformNode,
    StandardMaterial,
    Color3,
} from "@babylonjs/core";

import { Entity } from "../core/abstracts/Entity";
import { Player } from "../entities/Player";
import { Effroi } from "../entities/enemies/Effroi";
import { Villager } from "../entities/Villager";
import { ProximitySystem } from "../core/engines/ProximitySystem";

import { ENEMY_CONFIGS } from "../data/EnemyData";
import { NPC_DATA } from "../data/NPCDialogues";
import { GenericEnemy } from "../entities/enemies/GenericEnemy";

interface VisualAssets {
    root: AbstractMesh;
    anims: AnimationGroup[];
}

export class EntityFactory {
    private static _containerCache: Map<
        string,
        { container: AssetContainer; refCount: number }
    > = new Map();

    public static async Create(
        type: string,
        scene: Scene,
        position: Vector3,
        proximitySystem: ProximitySystem,
    ): Promise<Entity> {
        const typeUpper = type.toUpperCase();
        const typeLower = type.toLowerCase();

        const npcData = NPC_DATA[typeUpper];
        const enemyData = ENEMY_CONFIGS[typeLower];

        const assetPath =
            npcData?.assetPath ||
            enemyData?.assetPath ||
            `assets/models/${typeLower}.glb`;

        const assets = await this._getVisualAssets(assetPath, scene);
        let entity: Entity;

        switch (typeUpper) {
            case "PLAYER":
                return new Player(scene, position);

            case "EFFROI":
                entity = new Effroi(
                    scene,
                    enemyData,
                    proximitySystem,
                    assets.root,
                    assets.anims,
                );
                assets.root.parent = entity.transform;
                this._setupVisualPivot(
                    assets.root,
                    2.0,
                    new Vector3(0, -1, 0),
                    new Vector3(6.4, Math.PI / 2, 0),
                );
                break;

            case "VILLAGER_BOB":
            case "VILLAGER_ANNA":
                entity = new Villager(scene, position, npcData);
                assets.root.parent = entity.transform;
                this._setupVisualPivot(assets.root);
                break;

            default:
                if (!enemyData) throw new Error(`Config ${type} introuvable.`);
                entity = new GenericEnemy(
                    scene,
                    enemyData,
                    proximitySystem,
                    assets.root,
                );
                assets.root.parent = entity.transform;
                this._setupVisualPivot(assets.root);
                break;
        }

        entity.transform.position.copyFrom(position);
        entity.assetPath = assetPath;
        return entity;
    }

    private static _setupVisualPivot(
        root: AbstractMesh,
        scale: number = 1.0,
        offset: Vector3 = Vector3.Zero(),
        rotation: Vector3 = Vector3.Zero(),
    ): void {
        const scene = root.getScene();
        const visualPivot = new TransformNode(`pivot_${root.name}`, scene);
        visualPivot.parent = root;

        const children = [...root.getChildren()];
        children.forEach((child) => {
            if (child !== visualPivot) child.parent = visualPivot;
        });

        visualPivot.scaling.setAll(scale);
        visualPivot.position.copyFrom(offset);
        visualPivot.rotationQuaternion = null;
        visualPivot.rotation.copyFrom(rotation);

        root.rotationQuaternion = null;
        root.rotation.setAll(0);
    }

    private static async _getVisualAssets(
        path: string,
        scene: Scene,
    ): Promise<VisualAssets> {
        try {
            // Utilise la méthode publique pour garantir le cache et le refCount
            const container = await this.LoadAsset(path, scene);

            const entries = container.instantiateModelsToScene(
                (n) => `${n}_${Date.now()}`,
                true,
            );

            return {
                root: entries.rootNodes[0] as AbstractMesh,
                anims: entries.animationGroups,
            };
        } catch (e) {
            const mesh = MeshBuilder.CreateCapsule(
                "placeholder",
                { height: 2, radius: 0.5 },
                scene,
            );
            mesh.position.y = 0;

            const material = new StandardMaterial("mat_placeholder", scene);
            material.diffuseColor = Color3.Blue();
            mesh.material = material;

            return { root: mesh, anims: [] };
        }
    }

    /**
     * Charge l'asset et gère le cache/refCount
     */
    public static async LoadAsset(
        path: string,
        scene: Scene,
    ): Promise<AssetContainer> {
        let entry = this._containerCache.get(path);

        if (!entry) {
            const container = await LoadAssetContainerAsync(path, scene);
            entry = { container, refCount: 0 };
            this._containerCache.set(path, entry);
        }

        entry.refCount++;
        return entry.container;
    }

    /**
     * Décrémente le refCount et nettoie si nécessaire
     */
    public static UnloadAsset(path: string): void {
        const entry = this._containerCache.get(path);
        if (entry) {
            entry.refCount--;
            if (entry.refCount <= 0) {
                entry.container.dispose();
                this._containerCache.delete(path);
                console.log(`[Factory] Asset libéré : ${path}`);
            }
        }
    }
}
