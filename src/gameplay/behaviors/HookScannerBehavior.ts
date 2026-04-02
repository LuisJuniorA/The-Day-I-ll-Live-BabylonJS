import { Vector3 } from "@babylonjs/core";
import type { Enemy } from "../../core/abstracts/Enemy";
import { HookScanner } from "../../core/engines/HookScanner";
import type { Behavior } from "../../core/interfaces/Behaviors";
import { EnemyHookState } from "../../states/enemy/EnemyHookState";

export class HookScannerBehavior implements Behavior {
    private _scanTimer = 0;
    private readonly SCAN_INTERVAL = 0.25; // On scanne moins souvent pour la stabilité
    private readonly HOOK_MAX_DISTANCE = 15;
    private readonly MIN_SCORE = 15.0; // Score haut pour éviter les petits sauts ridicules

    public update(owner: Enemy, dt: number): void {
        // SÉCURITÉ : Si on est déjà en HookState, on ne fait rien
        if (owner.movementFSM.currentState instanceof EnemyHookState) return;

        const target = owner.targetTransform;
        if (!target) return;

        const dist = Vector3.Distance(owner.position, target.position);
        if (dist > this.HOOK_MAX_DISTANCE) return;

        this._scanTimer += dt;
        if (this._scanTimer >= this.SCAN_INTERVAL) {
            this._scanTimer = 0;

            const bestHook = HookScanner.getBestPoint(
                owner.transform.getScene(),
                owner.position,
                target.position,
                owner.transform.up,
                owner.id,
            );

            if (bestHook && bestHook.score > this.MIN_SCORE) {
                // On vérifie qu'on ne saute pas sur place (distance mini)
                if (Vector3.Distance(owner.position, bestHook.position) > 2) {
                    owner.movementFSM.transitionTo(
                        new EnemyHookState(bestHook),
                    );
                }
            }
        }
    }
}
