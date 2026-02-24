import { Entity } from "../core/abstracts/Entity";
import { ProximitySystem } from "../core/engines/ProximitySystem";
import { isInteractableEntity } from "../core/interfaces/Interactable";
import { TransformNode } from "@babylonjs/core";

export class EntityManager {
    private _entities: Map<string, Entity> = new Map();
    private _toRemove: Set<string> = new Set();

    // On instancie le système de proximité
    private _proximitySystem: ProximitySystem = new ProximitySystem();

    // Permet de définir le joueur depuis l'extérieur (ex: au spawn du joueur)
    public setPlayerTarget(transform: TransformNode): void {
        this._proximitySystem.setTarget(transform);
    }

    public add(entity: Entity): void {
        this._entities.set(entity.id, entity);

        // AUTO-DETECTION : Si l'entité supporte la proximité, on l'ajoute au système
        if (isInteractableEntity(entity)) {
            this._proximitySystem.add(entity);
        }
    }

    public remove(id: string): void {
        const entity = this._entities.get(id);
        if (entity && isInteractableEntity(entity)) {
            this._proximitySystem.remove(entity);
        }
        this._toRemove.add(id);
    }

    public update(dt: number): void {
        // 1. Update du système de proximité (calculs optimisés)
        this._proximitySystem.update(dt);

        // 2. Update classique des entités
        for (const entity of this._entities.values()) {
            entity.update(dt);
        }

        // 3. Nettoyage
        if (this._toRemove.size > 0) {
            this._toRemove.forEach(id => {
                const entity = this._entities.get(id);
                if (entity) {
                    entity.dispose();
                    this._entities.delete(id);
                }
            });
            this._toRemove.clear();
        }
    }

    public disposeAll(): void {
        for (const entity of this._entities.values()) {
            entity.dispose();
        }
        this._entities.clear();
        // On n'oublie pas de vider le système de proximité
        this._proximitySystem.disposeAll();
    }
}