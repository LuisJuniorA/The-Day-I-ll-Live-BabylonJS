import { Vector3 } from "@babylonjs/core";
import type { Enemy } from "../../core/abstracts/Enemy";
import { HookScanner } from "../../core/engines/HookScanner";
import type { Behavior } from "../../core/interfaces/Behaviors";
import { EnemyHookState } from "../../states/enemy/EnemyHookState";

export class HookScannerBehavior implements Behavior {
    private _scanTimer = 0;
    private _lastHookPos: Vector3 | null = null; // Mémoire du dernier saut
    private readonly SCAN_INTERVAL = 0.25;
    private readonly MIN_HOOK_DISTANCE = 4.0; // Distance mini entre deux sauts

    public update(owner: Enemy, dt: number): void {
        if (owner.movementFSM.currentState instanceof EnemyHookState) return;

        this._scanTimer += dt;
        if (this._scanTimer >= this.SCAN_INTERVAL) {
            this._scanTimer = 0;

            const target = owner.targetTransform;
            if (!target) return;

            const bestHook = HookScanner.getBestPoint(
                owner.transform.getScene(),
                owner.transform.absolutePosition,
                target.absolutePosition,
                owner.transform.up,
                owner.id,
            );

            if (bestHook && bestHook.score > 15) {
                // --- LOGIQUE ANTI-SPAM ---
                // 1. On vérifie qu'on ne saute pas là où on est déjà
                const distFromCurrent = Vector3.Distance(
                    owner.position,
                    bestHook.position,
                );

                // 2. On vérifie qu'on ne saute pas sur notre ancien point
                let distFromLast = 100;
                if (this._lastHookPos) {
                    distFromLast = Vector3.Distance(
                        this._lastHookPos,
                        bestHook.position,
                    );
                }

                if (
                    distFromCurrent > 2.0 &&
                    distFromLast > this.MIN_HOOK_DISTANCE
                ) {
                    bestHook.position.z = 0;
                    this._lastHookPos = bestHook.position.clone();
                    owner.movementFSM.transitionTo(
                        new EnemyHookState(bestHook),
                    );
                }
            }
        }
    }
}
