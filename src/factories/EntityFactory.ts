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
} from "@babylonjs/core";

import { Entity } from "../core/abstracts/Entity";
import { Player } from "../entities/Player";
import { Effroi } from "../entities/enemies/Effroi";
import { Villager } from "../entities/villagers/Villager";
import { ProximitySystem } from "../core/engines/ProximitySystem";

import { ENEMY_CONFIGS } from "../data/EnemyData";
import { NPC_DATA } from "../data/NPCData";
import { GenericEnemy } from "../entities/enemies/GenericEnemy";
import { Slime } from "../entities/enemies/Slime";
import { Merchant } from "../entities/villagers/Merchant";
import { Blacksmith } from "../entities/villagers/BlackSmith";
import { Campfire } from "../entities/villagers/Campfire";

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
        const enemyData = ENEMY_CONFIGS[typeLower]
            ? JSON.parse(JSON.stringify(ENEMY_CONFIGS[typeLower]))
            : null;
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
                // AJOUT WRAPPER : On ajuste Y et Z pour coller au mesh noir
                // Ici: hauteur 3, rayon 1, offset Y de 1.5, et petit décalage local si besoin
                this._addHitboxWrap(
                    entity,
                    scene,
                    3.5,
                    2.0,
                    1.0,
                    new Vector3(0.5, -0.5, 0),
                );

                // APRES l'instanciation de l'Effroi
                assets.root.getChildMeshes().forEach((m) => {
                    if (m.material) {
                        const pbr = m.material as any;
                        const mainTexture =
                            pbr.albedoTexture ||
                            pbr.diffuseTexture ||
                            pbr.emissiveTexture;

                        const std = new StandardMaterial(
                            "std_boosted_" + m.name,
                            scene,
                        );

                        // 1. Texture plus éclatante
                        std.diffuseTexture = mainTexture;
                        if (std.diffuseTexture) std.diffuseTexture.level = 1.5;

                        // 2. Réceptivité maximale à la lumière diffuse
                        std.diffuseColor = new Color3(1, 1, 1);

                        // 3. Débouche les noirs (lumière d'ambiance)
                        std.ambientColor = new Color3(0.4, 0.4, 0.4);

                        // 4. Un petit reflet pour marquer les formes
                        std.specularColor = new Color3(0.2, 0.2, 0.2);

                        m.material.dispose();
                        m.material = std;
                    }
                });

                break;

            case "SLIME": {
                // On nettoie le root chargé par défaut (car on crée un mesh procédural)
                assets.root.dispose();

                if (!enemyData) {
                    throw new Error(`Config pour le slime introuvable.`);
                }

                // --- 1. LE CORPS (BODY) ---
                // updatable: true est indispensable pour ton _applyVertexDeformation
                const slimeMesh = MeshBuilder.CreateSphere(
                    `slime_body_${Date.now()}`,
                    { diameter: 2, segments: 16, updatable: true },
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

                // Effet de subsurface pour que le corps réagisse à la lueur interne
                slimeMat.subSurface.isTranslucencyEnabled = true;
                slimeMat.subSurface.translucencyIntensity = 1.0;
                slimeMat.subSurface.isRefractionEnabled = true;
                slimeMat.subSurface.indexOfRefraction = 1.05;
                slimeMat.subSurface.tintColor = new Color3(0.1, 0.4, 0.1); // Teinte verte dans la masse

                slimeMesh.material = slimeMat;

                // --- 2. LES YEUX ---
                const eyeMat = new StandardMaterial("eyeMat", scene);
                eyeMat.emissiveColor = new Color3(0.8, 0.8, 0.8); // Brillance blanche
                eyeMat.disableLighting = true;

                const eyeL = MeshBuilder.CreateSphere(
                    "eyeL",
                    { diameter: 0.2 },
                    scene,
                );
                eyeL.position = new Vector3(-0.3, 0.26, 0.73);
                eyeL.material = eyeMat;
                eyeL.parent = slimeMesh;

                const eyeR = MeshBuilder.CreateSphere(
                    "eyeR",
                    { diameter: 0.2 },
                    scene,
                );
                eyeR.position = new Vector3(0.3, 0.26, 0.73);
                eyeR.material = eyeMat;
                eyeR.parent = slimeMesh;

                // --- 3. LE NOYAU (SOUL) ---
                // updatable: true ici aussi pour l'animation de la soul
                const soul = MeshBuilder.CreateSphere(
                    "soul",
                    { diameter: 0.6, segments: 8, updatable: true },
                    scene,
                );

                const soulMat = new StandardMaterial("soulMat", scene);
                // On remplace la PointLight par une emissive forte + GlowLayer de scène
                soulMat.emissiveColor = new Color3(0.2, 0.2, 0.2);
                soulMat.disableLighting = true;
                soul.material = soulMat;

                // --- 4. INITIALISATION DE L'ENTITÉ ---
                // On passe bien slimeMesh et soul au constructeur
                const slimeEntity = new Slime(
                    scene,
                    enemyData,
                    proximitySystem,
                    slimeMesh,
                    soul,
                );

                // On attache les meshs au transform de l'entité
                slimeMesh.parent = slimeEntity.transform;
                soul.parent = slimeEntity.transform;

                // Positionnement du pivot visuel (compensation Y)
                this._setupVisualPivot(
                    slimeMesh,
                    1,
                    new Vector3(0, 0, 0),
                    new Vector3(0, 1.0, 0), // Ajuste selon la hauteur souhaitée
                );

                slimeMesh.checkCollisions = true;
                entity = slimeEntity;

                // Hitbox pour les clics et interactions
                this._addHitboxWrap(entity, scene, 1.5, 1.5, 0.75);
                break;
            }

            case "BLACKSMITH":
                // Création de l'entité Blacksmith
                entity = new Blacksmith(scene, position, npcData);
                assets.root.parent = entity.transform;

                // On utilise les mêmes réglages visuels que les autres NPCs
                this._setupVisualPivot(assets.root);
                break;

            case "MERCHANT_SILAS":
                // On crée l'entité Silas (soit via une classe Merchant dédiée, soit via Villager)
                // npcData contient déjà l'assetPath, le nom, et les dialogues de Silas
                entity = new Merchant(scene, position, npcData);

                assets.root.parent = entity.transform;

                // Ajustement visuel standard
                this._setupVisualPivot(assets.root);
                break;

            case "BONFIRE_MAIN":
                // On crée l'entité Bonfire (qui implémente Interactable)
                entity = new Campfire(scene, position, npcData);

                // On attache le modèle 3D
                assets.root.parent = entity.transform;

                // Ajustement visuel (taille, rotation, offset Y)
                // Ajuste ces valeurs selon la taille de ton modèle .glb
                this._setupVisualPivot(
                    assets.root,
                    1.5, // Scale
                    new Vector3(0, 0, 0), // Offset
                    new Vector3(0, 0, 0), // Rotation
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
                this._addHitboxWrap(entity, scene, 2.2, 0.7);
                break;
        }

        entity.transform.position.copyFrom(position);
        entity.assetPath = assetPath;
        entity.transform.parent = EntityFactory._entitiesRoot;
        return entity;
    }

    private static _addHitboxWrap(
        entity: Entity,
        scene: Scene,
        height: number = 2,
        radius: number = 0.5,
        yOffset: number | null = null,
        localOffset: Vector3 = Vector3.Zero(),
    ): void {
        const wrap = MeshBuilder.CreateCapsule(
            `hitbox_wrap_${entity.id}`,
            {
                height: height,
                radius: radius,
            },
            scene,
        );

        const finalY = yOffset !== null ? yOffset : height / 2;
        wrap.position.set(localOffset.x, finalY + localOffset.y, localOffset.z);

        wrap.parent = entity.transform;
        wrap.isPickable = true;
        wrap.isVisible = false; // Mets à true pour débugger l'alignement
        wrap.checkCollisions = false;
        wrap.receiveShadows = false;

        // Debug visuel si besoin
        if (wrap.isVisible) {
            const m = new StandardMaterial("debugHitboxMat", scene);
            m.diffuseColor = Color3.Red();
            m.alpha = 0.3;
            wrap.material = m;
        }
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
        if (path === "procedural" || !path) {
            return this._createPlaceholderVisual(scene);
        }

        try {
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
            console.warn(
                `Échec du chargement de l'asset à l'adresse: ${path}. Utilisation du placeholder.`,
                e,
            );
            return this._createPlaceholderVisual(scene);
        }
    }

    // 2. On isole la création du mesh procédural pour la lisibilité
    private static _createPlaceholderVisual(scene: Scene): VisualAssets {
        const mesh = MeshBuilder.CreateCapsule(
            "placeholder",
            { height: 2, radius: 0.5 },
            scene,
        );
        mesh.position.y = 1;
        const material = new StandardMaterial("mat_placeholder", scene);
        material.diffuseColor = Color3.Blue();
        mesh.material = material;

        return { root: mesh, anims: [] };
    }

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

    public static UnloadAsset(path: string): void {
        const entry = this._containerCache.get(path);
        if (entry) {
            entry.refCount--;
            if (entry.refCount <= 0) {
                entry.container.dispose();
                this._containerCache.delete(path);
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
