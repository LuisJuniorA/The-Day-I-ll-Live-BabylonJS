import { Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { Entity } from "../core/abstracts/Entity";
import { ProximitySystem } from "../core/engines/ProximitySystem";
import { isInteractableEntity } from "../core/interfaces/Interactable";
import { EntityFactory } from "../factories/EntityFactory";
import { isPerceivableEntity } from "../core/interfaces/Perceivable";
import { LootManager } from "../managers/LootManager";

/**
 * Gestionnaire central de toutes les entités du monde.
 * Gère le cycle de vie, la proximité, et la distribution du loot.
 */
export class EntityManager {
    private _entities: Map<string, Entity> = new Map();
    private _toRemove: Set<string> = new Set();
    private _scene: Scene;

    /** Système gérant les distances Joueur/Entités (IA, Interactions, Loot) */
    public readonly _proximitySystem: ProximitySystem = new ProximitySystem();

    /** Gestionnaire des particules de loot (XP et Items) */
    public readonly lootManager: LootManager;

    constructor(scene: Scene) {
        this._scene = scene;

        // Initialisation du système de loot avec référence à la proximité
        this.lootManager = new LootManager(this._scene, this._proximitySystem);

        // Injection optionnelle pour accès global via la scène (pratique pour les classes filles)
        (this._scene as any).entityManager = this;
        this.setupMonsterDebug();
    }

    /**
     * Définit le transform du joueur pour le calcul de proximité
     */
    public setPlayerTarget(transform: TransformNode): void {
        this._proximitySystem.setTarget(transform);
    }

    /**
     * Ajoute une entité au manager et l'enregistre dans les sous-systèmes appropriés
     */
    public add(entity: Entity): void {
        this._entities.set(entity.id, entity);

        // Enregistrement spatial pour les interactions (UI, Quêtes, Portes)
        if (isInteractableEntity(entity)) {
            this._proximitySystem.addInteractable(entity);
        }

        // Enregistrement spatial pour la perception (IA, Steering, Loot)
        if (isPerceivableEntity(entity)) {
            this._proximitySystem.registerPerceivable(entity);
        }
    }

    /**
     * Crée et ajoute une entité de manière asynchrone via la Factory
     */
    public async spawn(type: string, position: Vector3): Promise<Entity> {
        const entity = await EntityFactory.Create(
            type,
            this._scene,
            position,
            this._proximitySystem,
        );

        this.add(entity);
        return entity;
    }

    /**
     * Spawn automatique basé sur les données d'un node (ex: export Blender/GLTF metadata)
     */
    public async spawnFromMetadata(spawner: TransformNode): Promise<void> {
        const type = spawner.metadata?.type || "unknown";

        const entity = await EntityFactory.Create(
            type,
            this._scene,
            spawner.position.clone(),
            this._proximitySystem,
        );

        if (spawner.rotationQuaternion) {
            entity.transform.rotationQuaternion =
                spawner.rotationQuaternion.clone();
        } else {
            entity.transform.rotation = spawner.rotation.clone();
        }

        this.add(entity);
    }

    /**
     * Marque une entité pour suppression au prochain frame et la retire des systèmes de détection
     */
    public remove(id: string): void {
        const entity = this._entities.get(id);
        if (entity) {
            if (isInteractableEntity(entity)) {
                this._proximitySystem.removeInteractable(entity);
            }
            if (isPerceivableEntity(entity)) {
                this._proximitySystem.unregisterPerceivable(entity);
            }
            this._toRemove.add(id);
        }
    }

    /**
     * Boucle de mise à jour logique (appelée par la boucle de rendu principale)
     */
    public update(dt: number): void {
        // 1. Mise à jour spatiale (Calcul des distances une seule fois par tick)
        this._proximitySystem.update(dt);

        // 2. Mise à jour du Loot (Mouvement des particules + Aspiration vers joueur)
        this.lootManager.update(dt);

        // 3. Mise à jour de la logique interne de chaque entité
        for (const [id, entity] of this._entities.entries()) {
            entity.update(dt);

            // Si l'entité est un Character et qu'elle a terminé sa mort (anim finie)
            if ((entity as any).hasToBeDeleted) {
                this._toRemove.add(id);
            }
        }

        // 4. Nettoyage mémoire des entités supprimées
        if (this._toRemove.size > 0) {
            this._toRemove.forEach((id) => {
                const entity = this._entities.get(id);
                if (entity) {
                    // Nettoyage ProximitySystem si non fait via remove()
                    if (isInteractableEntity(entity))
                        this._proximitySystem.removeInteractable(entity);
                    if (isPerceivableEntity(entity))
                        this._proximitySystem.unregisterPerceivable(entity);

                    // Nettoyage Babylon.js et Assets
                    entity.dispose();
                    EntityFactory.UnloadAsset(entity.assetPath);
                    this._entities.delete(id);
                }
            });
            this._toRemove.clear();
        }
    }

    /**
     * Nettoyage complet du monde (changement de niveau ou sortie de jeu)
     */
    public disposeAll(): void {
        for (const entity of this._entities.values()) {
            entity.dispose();
        }
        this._entities.clear();
        this._toRemove.clear();
        this._proximitySystem.disposeAll();
    }

    /**
     * Méthode de debug uniquement : Affiche l'état de santé de tous les monstres.
     */
    public setupMonsterDebug(): void {
        // @ts-ignore
        if (import.meta.env.DEV) {
            window.addEventListener("keydown", (ev) => {
                // Raccourci : Ctrl + Shift + H
                if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === "H") {
                    console.log(
                        "%c --- MONSTER STATUS REPORT ---",
                        "color: #ff4757; font-weight: bold;",
                    );

                    let monsterCount = 0;

                    this._entities.forEach((entity) => {
                        // On vérifie si l'entité est un "Character" (car ils ont des stats d'HP)
                        // Et on vérifie si ce n'est pas le joueur
                        if (
                            "stats" in entity &&
                            (entity as any).faction !== 0
                        ) {
                            // 0 étant souvent Faction.PLAYER
                            const char = entity as any;
                            const healthPercent = (
                                (char.stats.hp / char.stats.maxHp) *
                                100
                            ).toFixed(0);
                            const status = char.isDead ? "DEAD" : "ALIVE";

                            // Couleur selon la vie : Vert > Orange > Rouge
                            let color = "#2ed573";
                            if (char.stats.hp < char.stats.maxHp * 0.5)
                                color = "#ffa502";
                            if (
                                char.stats.hp < char.stats.maxHp * 0.25 ||
                                char.isDead
                            )
                                color = "#ff4757";

                            console.log(
                                `%c[${char.id}] ${char.name} | HP: ${char.stats.hp}/${char.stats.maxHp} (${healthPercent}%) | Pos: ${char.transform.position.x.toFixed(1)}, ${char.transform.position.y.toFixed(1)} | Status: ${status}`,
                                `color: ${color}`,
                            );
                            monsterCount++;
                        }
                    });

                    if (monsterCount === 0)
                        console.log("Aucun monstre actif détecté.");
                    console.log("-------------------------------");
                }
            });
        }
    }
}
