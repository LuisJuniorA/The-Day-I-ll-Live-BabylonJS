import { Character } from "./Character";
import { FSM } from "../engines/FSM";
import { ProximitySystem } from "../engines/ProximitySystem";
import { AbstractMesh, Scene, TransformNode } from "@babylonjs/core";
import { EnemyIdleState } from "../../states/enemy/EnemyIdleState";
import type { EnemyConfig, EnemyBehaviorConfig } from "../types/EnemyConfig";
import { CollisionLayers } from "../data/CollisionLayers";

export class Enemy extends Character {
    public readonly fsm: FSM<Enemy>;
    public readonly config: EnemyBehaviorConfig;
    private _proximitySystem: ProximitySystem;

    constructor(
        scene: Scene,
        data: EnemyConfig,
        proximitySystem: ProximitySystem,
        mesh: AbstractMesh,
    ) {
        super(data.displayName, scene, data.stats);
        this.config = data.behavior;
        this._proximitySystem = proximitySystem;
        this.fsm = new FSM<Enemy>(this);
        this.mesh = mesh;
        this.mesh.parent = this.transform;
        this.mesh.checkCollisions = true;
        this.mesh.collisionMask = CollisionLayers.ENVIRONMENT;

        this.mesh!.collisionGroup = CollisionLayers.ENEMY;
        this.fsm.transitionTo(new EnemyIdleState());
    }

    public get targetTransform(): TransformNode | undefined {
        return this._proximitySystem.target;
    }

    public update(dt: number): void {
        if (this.isDead) return;
        this.fsm.update(dt);
    }

    public getNearbyNeighbors(): Enemy[] {
        return this._proximitySystem.getEntitiesInRadius(
            this.position,
            4,
            this.id,
        );
    }
}
