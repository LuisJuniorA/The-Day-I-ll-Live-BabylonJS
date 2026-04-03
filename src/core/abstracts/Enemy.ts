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
import { OnEntityDamaged } from "../interfaces/CombatEvent";

export abstract class Enemy extends Character {
    public readonly movementFSM: FSM<Enemy>;
    public readonly attackFSM: FSM<Enemy>;
    public readonly config: EnemyConfig;
    private _proximitySystem: ProximitySystem;

    // Liste des attaques
    protected availableAttacks: ActionBehavior[] = [];

    // Dégâts de contact passifs
    protected contactDamage: number = 5;

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

    public abstract getNextAttack(): ActionBehavior;

    public get targetTransform(): TransformNode | undefined {
        return this._proximitySystem.target;
    }

    public update(dt: number): void {
        if (this.isDead) return;
        this.checkGrounded();

        if (!this.isGrounded) {
            this.velocity.y += -0.5;
        } else {
            this.velocity.y = 0;
        }

        // Vérification des dégâts de contact
        this._checkContactDamage();

        this.movementFSM.update(dt);
        this.attackFSM.update(dt);
    }

    /**
     * Vérifie si le joueur touche le monstre.
     * C'est le Player qui gère son propre cooldown (i-frames).
     */
    private _checkContactDamage(): void {
        const playerMesh = this._scene.getMeshByName("player_collider");

        if (
            playerMesh &&
            this.mesh &&
            this.mesh.intersectsMesh(playerMesh, false)
        ) {
            OnEntityDamaged.notifyObservers({
                targetId: "Player",
                attackerId: this.id,
                amount: this.contactDamage,
                position: this.transform.position.clone(),
                attackerFaction: Faction.ENEMY,
            });
        }
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

    public abstract playIdle(): void;
    public abstract playMove(): void;
}
