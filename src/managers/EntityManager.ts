import { Entity } from "../core/abstracts/Entity";
import { ProximitySystem } from "../core/engines/ProximitySystem";
import { isInteractableEntity } from "../core/interfaces/Interactable";
import { Scene, TransformNode } from "@babylonjs/core";
import { ENTITY_REGISTRY } from "../core/data/EntityRegistry";

export class EntityManager {
    private _entities: Map<string, Entity> = new Map();
    private _toRemove: Set<string> = new Set();
    private _scene: Scene;
    public _proximitySystem: ProximitySystem = new ProximitySystem();

    constructor(scene: Scene) {
        this._scene = scene;
    }

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

    public spawnFromMetadata(spawner: TransformNode): void {
        const type = spawner.metadata?.type;
        const stats = spawner.metadata?.stats || {};

        const EntityClass = ENTITY_REGISTRY[type];

        if (!EntityClass) {
            console.warn(`Type d'entité inconnu : ${type}`);
            return;
        }

        // On prépare les arguments communs
        // On récupère la cible (joueur) pour les ennemis qui en ont besoin
        const name = `${type}_${Date.now()}`;

        // INSTANCIATION :
        // On passe name, scene, stats et target. 
        // Un NPC (Villager) ignorera peut-être la target dans son constructeur, 
        // alors qu'un Enemy s'en servira.
        const entityInstance = new EntityClass(
            name,
            this._scene,
            stats,
            this._proximitySystem
        );

        entityInstance.position.copyFrom(spawner.position);
        if (spawner.rotation) entityInstance.rotation.copyFrom(spawner.rotation);

        this.add(entityInstance);
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