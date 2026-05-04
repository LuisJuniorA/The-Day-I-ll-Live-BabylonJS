import { Vector3, Scene } from "@babylonjs/core";
import type { ProximitySystem } from "../core/engines/ProximitySystem";
import {
    OnExperienceGained,
    OnItemPickedUp,
} from "../core/interfaces/CombatEvent";
import { WorldDrop } from "./WorldDrop";

export class LootManager {
    private _drops: Map<string, WorldDrop> = new Map();
    private _proximity: ProximitySystem;
    private _scene: Scene;

    constructor(scene: Scene, proximity: ProximitySystem) {
        this._scene = scene;
        this._proximity = proximity;
    }

    public spawnLoot(pos: Vector3, amount: number, item?: any): void {
        const drop = new WorldDrop(this._scene, pos, amount, item);
        this._drops.set(drop.id, drop);
        this._proximity.registerPerceivable(drop);
    }

    public update(dt: number): void {
        if (!this._proximity.target) return;

        const playerPos = this._proximity.target.position;
        const pickupRadiusSq = 4 * 4; // 4 mètres pour l'aspiration

        for (const [_, drop] of this._drops) {
            // 1. Check proximité via la target du ProximitySystem
            if (!drop.isFollowingPlayer) {
                const distSq = Vector3.DistanceSquared(
                    drop.position,
                    playerPos,
                );
                if (distSq < pickupRadiusSq) {
                    drop.isFollowingPlayer = true;
                }
            }

            // 2. Update physique/aspiration
            drop.update(dt, playerPos);

            // 3. Collecte
            if (drop.hasToBeDeleted) {
                this._collect(drop);
            }
        }
    }

    private _collect(drop: WorldDrop): void {
        if (drop.isXp) {
            OnExperienceGained.notifyObservers({
                targetId: "Player",
                amount: drop.amount,
            });
        } else {
            OnItemPickedUp.notifyObservers({
                targetId: "Player",
                item: drop.item!,
                amount: drop.amount,
            });
        }

        this._proximity.unregisterPerceivable(drop);
        drop.dispose();
        this._drops.delete(drop.id);
    }
}
