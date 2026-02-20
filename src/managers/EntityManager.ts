import { Entity } from "../core/abstracts/Entity";

export class EntityManager {
    private _entities: Map<string, Entity> = new Map();
    private _toRemove: Set<string> = new Set();

    public add(entity: Entity): void {
        this._entities.set(entity.id, entity);
    }

    public remove(id: string): void {
        this._toRemove.add(id);
    }

    public update(dt: number): void {
        // Update toutes les entités
        for (const entity of this._entities.values()) {
            entity.update(dt);
        }

        // Nettoyage sécurisé après la boucle
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

    public getEntity<T extends Entity>(id: string): T | undefined {
        return this._entities.get(id) as T;
    }

    public disposeAll(): void {
        for (const entity of this._entities.values()) {
            entity.dispose();
        }
        this._entities.clear();
    }
}