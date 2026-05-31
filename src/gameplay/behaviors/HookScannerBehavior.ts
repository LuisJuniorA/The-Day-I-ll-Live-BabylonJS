import type { Enemy } from "../../core/abstracts/Enemy";
import { HookScanner } from "../../core/engines/HookScanner";
import type { Behavior } from "../../core/interfaces/Behaviors";
import { EnemyHookState } from "../../states/enemy/EnemyHookState";
import { BossChargeState } from "../../states/enemy/BossChargeState"; // Import important
import { ShadowBoss } from "../../entities/enemies/ShadowBoss";

export class HookScannerBehavior implements Behavior {
    private _scanTimer = 0;
    private readonly SCAN_INTERVAL = 0.5; // Un peu plus lent pour le boss

    public update(owner: Enemy, dt: number): void {
        // Ne rien faire si on est déjà en train de bouger (Hook ou Charge)
        if (
            owner.movementFSM.currentState instanceof EnemyHookState ||
            owner.movementFSM.currentState instanceof BossChargeState
        )
            return;

        this._scanTimer += dt;
        if (this._scanTimer >= this.SCAN_INTERVAL) {
            this._scanTimer = 0;

            const target = owner.targetTransform;
            if (!target) return;

            const bestHook = HookScanner.getBestPoint(
                owner._scene,
                owner.transform.absolutePosition,
                target.absolutePosition,
                owner.transform.up,
                owner.id,
            );

            if (bestHook && bestHook.score > 15) {
                // Logique de déclenchement
                if (owner instanceof ShadowBoss) {
                    // Le boss charge s'il trouve un point
                    owner.startCharging(bestHook);
                } else {
                    // Comportement normal pour le Slime
                    owner.movementFSM.transitionTo(
                        new EnemyHookState(bestHook),
                    );
                }
            }
        }
    }
}
