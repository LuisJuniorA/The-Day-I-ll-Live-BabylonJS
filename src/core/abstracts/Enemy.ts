import { Character } from "./Character";
import { FSM } from "../engines/FSM";
import { ProximitySystem } from "../engines/ProximitySystem";
import { Scene, TransformNode } from "@babylonjs/core";
import type { CharacterStats } from "../types/CharacterStats";
import { EnemyIdleState } from "../../states/enemy/EnemyIdleState";

export class Enemy extends Character {
    private _proximitySystem: ProximitySystem;
    public fsm: FSM<Enemy>;

    public interactionRange: number = 2.0;
    public isNear: boolean = false;

    public setProximityState(isNear: boolean): void {
        this.isNear = isNear;
    }

    constructor(name: string, scene: Scene, initialStats: CharacterStats, proximitySystem: ProximitySystem) {
        super(name, scene, initialStats);
        this._proximitySystem = proximitySystem;
        this.fsm = new FSM<Enemy>(this);
        this.fsm.transitionTo(new EnemyIdleState());
    }

    // Getter pratique pour l'IA
    public get targetTransform(): TransformNode | undefined {
        return this._proximitySystem.target;
    }

    public update(dt: number): void {
        if (this.isDead) return;

        this.fsm.update(dt);
    }
}