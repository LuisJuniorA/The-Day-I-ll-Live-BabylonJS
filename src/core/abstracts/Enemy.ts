import { Character } from "./Character";
import { FSM } from "../engines/FSM";
import { ProximitySystem } from "../engines/ProximitySystem";
import { AbstractMesh, Scene, TransformNode } from "@babylonjs/core";
import { EnemyIdleState } from "../../states/enemy/EnemyIdleState";
import type { EnemyConfig } from "../types/EnemyConfig";
import { CollisionLayers } from "../constants/CollisionLayers";
import { EnemyAttackIdleState } from "../../states/enemy/EnemyAttackIdleState";
import { Faction } from "../types/Faction";
import type { ActionBehavior } from "../interfaces/Behaviors";
import { EnemyChaseState } from "../../states/enemy/EnemyChaseState";
import type { EnemyState } from "./EnemyState";

export abstract class Enemy extends Character {
    public readonly movementFSM: FSM<Enemy>;
    public readonly attackFSM: FSM<Enemy>;
    public readonly config: EnemyConfig;
    private _proximitySystem: ProximitySystem;

    // Liste des attaques que ce monstre peut faire
    protected abstract availableAttacks: ActionBehavior[];

    constructor(
        scene: Scene,
        data: EnemyConfig,
        proximitySystem: ProximitySystem,
        mesh: AbstractMesh,
    ) {
        super(data.displayName, scene, data.stats, Faction.ENEMY);
        this.config = data;
        this._proximitySystem = proximitySystem;
        this.movementFSM = new FSM<Enemy>(this);
        this.attackFSM = new FSM<Enemy>(this);

        this.mesh = mesh;
        this.mesh.parent = this.transform;
        this.mesh.checkCollisions = true;
        this.mesh.collisionMask = CollisionLayers.ENVIRONMENT;
        this.mesh.collisionGroup = CollisionLayers.ENEMY;

        this.movementFSM.transitionTo(new EnemyIdleState());
        this.attackFSM.transitionTo(new EnemyAttackIdleState());
    }

    /**
     * Choisit l'attaque appropriée (IA de combat)
     */
    public abstract getNextAttack(): ActionBehavior;

    public get targetTransform(): TransformNode | undefined {
        return this._proximitySystem.target;
    }

    public update(dt: number): void {
        if (this.isDead) return;
        this.checkGrounded();

        // 2. Si on est PAS grounded (hors-screen bug, pente, etc.)
        if (!this.isGrounded) {
            // Soit tu mets une petite gravité corrective :
            this.velocity.y += -0.5;
        } else {
            // Soit tu forces le Y à rester stable
            this.velocity.y = 0;
        }
        this.movementFSM.update(dt);
        this.attackFSM.update(dt);
    }

    public getNearbyNeighbors(): Enemy[] {
        return this._proximitySystem.getEntitiesInRadius(
            this.position,
            4,
            this.id,
        );
    }

    public getChaseState(): EnemyState {
        return new EnemyChaseState();
    }

    // Méthodes pour que les States restent génériques
    public abstract playIdle(): void;
    public abstract playMove(): void;
}
