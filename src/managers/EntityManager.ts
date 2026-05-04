import { Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { Entity } from "../core/abstracts/Entity";
import { ProximitySystem } from "../core/engines/ProximitySystem";
import { isInteractableEntity } from "../core/interfaces/Interactable";
import { EntityFactory } from "../factories/EntityFactory";
import { isPerceivableEntity } from "../core/interfaces/Perceivable";
import type { Character } from "../core/abstracts/Character";

export class EntityManager {
    private _entities: Map<string, Entity> = new Map();
    private _toRemove: Set<string> = new Set();
    private _scene: Scene;

    // Système gérant les distances Joueur/Entités
    public _proximitySystem: ProximitySystem = new ProximitySystem();

    constructor(scene: Scene) {
        this._scene = scene;
    }

    /**
     * Définit le transform du joueur pour le calcul de proximité
     */
    public setPlayerTarget(transform: TransformNode): void {
        this._proximitySystem.setTarget(transform);
    }

    /**
     * Ajoute une entité déjà créée au manager et au système de proximité
     */
    public add(entity: Entity): void {
        this._entities.set(entity.id, entity);

        // Si l'entité implémente IInteractable, elle est suivie par le ProximitySystem
        if (isInteractableEntity(entity)) {
            this._proximitySystem.addInteractable(entity);
        }
        if (isPerceivableEntity(entity)) {
            this._proximitySystem.registerPerceivable(entity);
        }
    }

    /**
     * Crée et ajoute une entité de manière asynchrone (via la Factory)
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
     * Spawn automatique basé sur les données d'un node (ex: import Blender)
     */
    public async spawnFromMetadata(spawner: TransformNode): Promise<void> {
        const type = spawner.metadata?.type || "unknown";

        // On utilise la Factory pour construire l'objet (GLB ou Placeholder)
        const entity = await EntityFactory.Create(
            type,
            this._scene,
            spawner.position.clone(),
            this._proximitySystem,
        );

        // On récupère l'orientation du spawner
        if (spawner.rotationQuaternion) {
            entity.transform.rotationQuaternion =
                spawner.rotationQuaternion.clone();
        } else {
            entity.transform.rotation = spawner.rotation.clone();
        }

        this.add(entity);
    }

    /**
     * Marque une entité pour suppression au prochain frame
     */
    public remove(id: string): void {
        const entity = this._entities.get(id);
        if (entity && isInteractableEntity(entity)) {
            this._proximitySystem.removeInteractable(entity);
        }
        if (isPerceivableEntity(entity)) {
            this._proximitySystem.unregisterPerceivable(entity);
        }
        this._toRemove.add(id);
    }

    /**
     * Boucle de mise à jour logique
     */
    public update(dt: number): void {
        // 1. Mise à jour des distances
        this._proximitySystem.update(dt);

        // 2. Mise à jour de la logique interne (FSM, etc.)
        for (const [id, entity] of this._entities.entries()) {
            entity.update(dt);
            if ((entity as Character).hasToBeDeleted) {
                this._toRemove.add(id);
            }
        }

        // 3. Nettoyage des entités supprimées
        if (this._toRemove.size > 0) {
            this._toRemove.forEach((id) => {
                const entity = this._entities.get(id);
                if (entity) {
                    entity.dispose();
                    EntityFactory.UnloadAsset(entity.assetPath);
                    this._entities.delete(id);
                }
            });
            this._toRemove.clear();
        }
    }

    /**
     * Nettoyage complet
     */
    public disposeAll(): void {
        for (const entity of this._entities.values()) {
            entity.dispose();
        }
        this._entities.clear();
        this._proximitySystem.disposeAll();
    }
}
