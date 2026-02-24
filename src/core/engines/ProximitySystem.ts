import { Vector3, TransformNode } from "@babylonjs/core";
import type { Interactable } from "../interfaces/Interactable";

export class ProximitySystem {
    private _interactables: Set<Interactable> = new Set();
    private _target?: TransformNode;

    // On peut limiter la fréquence de calcul pour les performances (ex: 10 fois par seconde)
    private _checkInterval: number = 0.1;
    private _timer: number = 0;

    public setTarget(target: TransformNode) {
        this._target = target;
    }

    public add(entity: Interactable) {
        this._interactables.add(entity);
    }

    public remove(entity: Interactable) {
        this._interactables.delete(entity);
    }

    public update(dt: number): void {
        if (!this._target) return;

        this._timer += dt;
        if (this._timer < this._checkInterval) return;
        this._timer = 0;

        const targetPos = this._target.position;

        for (const entity of this._interactables) {
            const distance = Vector3.Distance(entity.transform.position, targetPos);
            const isNear = distance <= entity.interactionRange;

            // On délègue la réaction à l'entité
            entity.setProximityState(isNear);
        }
    }

    public disposeAll(): void {
        this._interactables.clear();
    }
}