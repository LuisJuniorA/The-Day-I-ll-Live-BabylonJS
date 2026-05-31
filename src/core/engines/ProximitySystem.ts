import { Vector3, TransformNode } from "@babylonjs/core";
import type { Interactable } from "../interfaces/Interactable";
import type { Perceivable } from "../interfaces/Perceivable";

export class ProximitySystem {
    private _interactables: Set<Interactable> = new Set();
    private _perceivables: Set<Perceivable> = new Set();

    public target?: TransformNode;

    private _timer: number = 0;
    private _checkInterval: number = 0.1; // 10 fois par seconde

    public setTarget(target: TransformNode) {
        this.target = target;
    }

    public registerPerceivable(entity: Perceivable) {
        this._perceivables.add(entity);
    }

    public unregisterPerceivable(entity: Perceivable) {
        this._perceivables.delete(entity);
    }

    public addInteractable(entity: Interactable) {
        this._interactables.add(entity);
    }

    public removeInteractable(entity: Interactable) {
        this._interactables.delete(entity);
    }

    /**
     * Retourne les entités dans le rayon XY donné.
     * Utilise le théorème de Pythagore sur 2 axes pour ignorer Z.
     */
    public getEntitiesInRadius(
        origin: Vector3,
        radius: number,
        skipId: string,
    ): any[] {
        const results: any[] = [];
        const radiusSq = radius * radius;

        for (const entity of this._perceivables) {
            if (entity.id === skipId) continue;

            // Calcul manuel pour ignorer l'axe Z (distance 2D)
            const dx = origin.x - entity.position.x;
            const dy = origin.y - entity.position.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= radiusSq) {
                results.push(entity);
            }
        }
        return results;
    }

    /**
     * Logique de détection Joueur <-> Objets (Optimisée par timer)
     * Calcul basé uniquement sur le plan XY.
     */
    public update(dt: number): void {
        if (!this.target) return;

        this._timer += dt;
        if (this._timer >= this._checkInterval) {
            this._timer = 0;

            const targetPos = this.target.position;

            for (const entity of this._interactables) {
                // Calcul manuel distance 2D (Plan XY)
                const dx = entity.transform.position.x - targetPos.x;
                const dy = entity.transform.position.y - targetPos.y;
                const distSq = dx * dx + dy * dy;

                const rangeSq =
                    entity.interactionRange * entity.interactionRange;

                entity.setProximityState(distSq <= rangeSq);
            }
        }
    }

    public disposeAll() {
        this._interactables.clear();
        this._perceivables.clear();
        this.target = undefined;
        this._timer = 0;
    }
}
