import { Vector3, TransformNode } from "@babylonjs/core";
import type { Interactable } from "../interfaces/Interactable";
import type { Perceivable } from "../interfaces/Perceivable";

export class ProximitySystem {
    private _interactables: Set<Interactable> = new Set();
    // Utilisation directe de Perceivable (qui contient déjà id et position)
    private _perceivables: Set<Perceivable> = new Set();

    public target?: TransformNode;

    // --- LES VARIABLES MANQUANTES ---
    private _timer: number = 0;
    private _checkInterval: number = 0.1; // 10 fois par seconde (Logique lente)

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
     * Utilisé par le Steering (IA) à chaque frame.
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

            // Optimisation DistanceSquared
            if (Vector3.DistanceSquared(origin, entity.position) <= radiusSq) {
                results.push(entity);
            }
        }
        return results;
    }

    /**
     * Logique de détection Joueur <-> Objets (Optimisée par timer)
     */
    public update(dt: number): void {
        if (!this.target) return;

        this._timer += dt;
        if (this._timer >= this._checkInterval) {
            this._timer = 0;

            const targetPos = this.target.position;

            for (const entity of this._interactables) {
                // DistanceSquared pour économiser le CPU
                const distSq = Vector3.DistanceSquared(
                    entity.transform.position,
                    targetPos,
                );

                const rangeSq =
                    entity.interactionRange * entity.interactionRange;

                // On met à jour l'état de l'objet (affichage UI, etc.)
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
