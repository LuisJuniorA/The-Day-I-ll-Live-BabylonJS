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
    PBRMaterial,
    PointLight,
} from "@babylonjs/core";

import { Entity } from "../core/abstracts/Entity";
import { Player } from "../entities/Player";
import { Effroi } from "../entities/enemies/Effroi";
import { Villager } from "../entities/Villager";
import { ProximitySystem } from "../core/engines/ProximitySystem";

import { ENEMY_CONFIGS } from "../data/EnemyData";
import { NPC_DATA } from "../data/NPCDialogues";
import { GenericEnemy } from "../entities/enemies/GenericEnemy";
import { Slime } from "../entities/enemies/Slime";

interface VisualAssets {
    root: AbstractMesh;
    anims: AnimationGroup[];
}

export class EntityFactory {
    private static _entitiesRoot: TransformNode;
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
            case "SLIME": {
                assets.root.dispose();
                if (!enemyData)
                    throw new Error(`Config pour le slime introuvable.`);

                // 1. Corps réduit (Diamètre 2 au lieu de 6)
                const slimeMesh = MeshBuilder.CreateSphere(
                    `slime_body_${Date.now()}`,
                    {
                        diameter: 2,
                        segments: 8,
                        updatable: true,
                    },
                    scene,
                );

                const slimeMat = new PBRMaterial(
                    `mat_slime_${Date.now()}`,
                    scene,
                );
                slimeMat.albedoColor = new Color3(0, 0, 0);
                slimeMat.metallic = 0.2;
                slimeMat.roughness = 0.1;
                slimeMat.alpha = 0.6;
                slimeMat.transparencyMode = 2;

                slimeMat.subSurface.isTranslucencyEnabled = true;
                slimeMat.subSurface.translucencyIntensity = 1.0;
                slimeMat.subSurface.minimumThickness = 0.3; // Réduit pour la petite taille
                slimeMat.subSurface.maximumThickness = 1.5;
                slimeMat.subSurface.isRefractionEnabled = true;
                slimeMat.subSurface.indexOfRefraction = 1.05;
                slimeMesh.material = slimeMat;
                slimeMat.subSurface.tintColor = Color3.Black();

                // 2. Les Yeux (Positions divisées par ~3)
                const eyeMat = new StandardMaterial("eyeMat", scene);
                eyeMat.emissiveColor = new Color3(0.5, 0.5, 0.5);
                eyeMat.disableLighting = true;

                const eyeL = MeshBuilder.CreateSphere(
                    "eyeL",
                    { diameter: 0.2 },
                    scene,
                );
                eyeL.position = new Vector3(-0.3, 0.26, 0.73); // Ajusté
                eyeL.material = eyeMat;
                eyeL.parent = slimeMesh;

                const eyeR = MeshBuilder.CreateSphere(
                    "eyeR",
                    { diameter: 0.2 },
                    scene,
                );
                eyeR.position = new Vector3(0.3, 0.26, 0.73); // Ajusté
                eyeR.material = eyeMat;
                eyeR.parent = slimeMesh;

                // 3. L'âme (Diamètre 0.6 au lieu de 1.8)
                const soul = MeshBuilder.CreateSphere(
                    "soul",
                    { diameter: 0.6, updatable: true },
                    scene,
                );
                const soulMat = new StandardMaterial("soulMat", scene);
                soulMat.emissiveColor = new Color3(0, 0, 0);
                soulMat.disableLighting = true;
                soul.material = soulMat;

                const innerLight = new PointLight(
                    "innerLight",
                    Vector3.Zero(),
                    scene,
                );
                innerLight.diffuse = new Color3(0.01, 0.01, 0.01);
                innerLight.specular = new Color3(0, 0, 0);
                innerLight.intensity = 5;
                innerLight.range = 1; // Réduit la portée proportionnellement
                innerLight.parent = soul;

                // 4. Pivot Visuel
                // On met un offset Y de 1 (rayon de la sphère) pour que le bas touche le sol
                this._setupVisualPivot(
                    slimeMesh,
                    1,
                    new Vector3(0, 0, 0),
                    new Vector3(0, 1.5, 0),
                );

                const slimeEntity = new Slime(
                    scene,
                    enemyData,
                    proximitySystem,
                    slimeMesh,
                    soul,
                );

                slimeMesh.parent = slimeEntity.transform;
                slimeMesh.checkCollisions = true;
                entity = slimeEntity;
                soul.parent = slimeEntity.transform;
                break;
            }

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
        entity.transform.parent = EntityFactory._entitiesRoot;
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

    public static setScene(scene: Scene): void {
        EntityFactory._entitiesRoot = new TransformNode(
            "ENTITIES_CONTAINER",
            scene,
        );
    }
}
