import { Character } from "./Character";
import { FSM } from "../engines/FSM";
import { ProximitySystem } from "../engines/ProximitySystem";
import { Scene, TransformNode } from "@babylonjs/core";
import { EnemyIdleState } from "../../states/enemy/EnemyIdleState";
import type { EnemyConfig, EnemyBehaviorConfig } from "../types/EnemyConfig";

export class Enemy extends Character {
    private _proximitySystem: ProximitySystem;
    public fsm: FSM<Enemy>;
    public readonly config: EnemyBehaviorConfig;

    public isNear: boolean = false;

    constructor(
        scene: Scene,
        data: EnemyConfig, // On injecte tout le bloc Data ici
        proximitySystem: ProximitySystem,
    ) {
        super(data.displayName, scene, data.stats);

        this.config = data.behavior;
        this.config.interactionRange;
        this._proximitySystem = proximitySystem;

        this.fsm = new FSM<Enemy>(this);
        this.fsm.transitionTo(new EnemyIdleState());
    }

    public get targetTransform(): TransformNode | undefined {
        return this._proximitySystem.target;
    }

    // Helper pour récupérer les alliés proches (pour la séparation)
    // À implémenter selon ton système de gestion de scène
    public getNearbyNeighbors(): Enemy[] {
        return []; // ex: return this.levelManager.getEnemiesInRange(this.position, 5);
    }

    public setProximityState(isNear: boolean): void {
        this.isNear = isNear;
    }

    public update(dt: number): void {
        if (this.isDead) return;
        this.fsm.update(dt);
    }
}
