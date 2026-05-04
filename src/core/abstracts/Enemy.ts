import { Character } from "./Character";
import { FSM } from "../engines/FSM";
import { ProximitySystem } from "../engines/ProximitySystem";
import { AbstractMesh, Scene, TransformNode, Vector3 } from "@babylonjs/core";
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

    protected availableAttacks: ActionBehavior[] = [];
    protected contactDamage: number = 5;

    // Optimisation : Compteur pour répartir les calculs lourds
    private _logicTick: number;
    private readonly _logicUpdateInterval: number = 6; // Une fois toutes les 6 frames (~10Hz)

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

        // Initialisation du tick avec un décalage aléatoire pour lisser la charge CPU
        this._logicTick = Math.floor(Math.random() * this._logicUpdateInterval);

        this.mesh = mesh;
        this.mesh.parent = this.transform;
        this.mesh.checkCollisions = true;

        // CollisionLayers : On ignore les autres ENEMY pour éviter le lag physique N^2
        this.mesh.collisionMask = CollisionLayers.ENVIRONMENT;
        this.mesh.collisionGroup = CollisionLayers.ENEMY;

        this.movementFSM.transitionTo(new EnemyIdleState());
        this.attackFSM.transitionTo(new EnemyAttackIdleState());
    }

    public abstract getNextAttack(): ActionBehavior;

    /**
     * Accès direct à la cible via le ProximitySystem (évite getMeshByName)
     */
    public get targetTransform(): TransformNode | undefined {
        return this._proximitySystem.target;
    }

    public update(dt: number): void {
        if (this.isDead) return;

        this._logicTick++;

        // Logique "Lourde" (Ground check + Contact damage) throttlée
        if (this._logicTick % this._logicUpdateInterval === 0) {
            this.checkGrounded();
            this._checkContactDamage();
        }

        // Physique de base (Gravité)
        if (!this.isGrounded) {
            this.velocity.y += -0.5;
        } else {
            this.velocity.y = 0;
        }

        // Mise à jour des machines à états
        this.movementFSM.update(dt);
        this.attackFSM.update(dt);
    }

    /**
     * Vérifie si le joueur touche le monstre par calcul de distance.
     * Beaucoup plus performant que intersectsMesh.
     */
    private _checkContactDamage(): void {
        const target = this.targetTransform;
        if (!target || !this.mesh) return;

        // On utilise la distance au carré pour éviter le calcul de racine carrée (Math.sqrt)
        const distSq = Vector3.DistanceSquared(
            this.transform.position,
            target.position,
        );

        // Rayon de contact : si distance < 1.5m (1.5^2 = 2.25)
        // Ajuste cette valeur selon la taille moyenne de tes meshes
        const contactRadiusSq = 2.25;

        if (distSq < contactRadiusSq) {
            OnEntityDamaged.notifyObservers({
                targetId: "Player",
                attackerId: this.id,
                amount: this.contactDamage,
                position: this.transform.position.clone(),
                attackerFaction: this.faction,
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

    public dispose(): void {
        // Nettoyage explicite pour éviter les fuites mémoire
        if (this._proximitySystem) {
            this._proximitySystem.unregisterPerceivable(this);
        }

        if (this.mesh) {
            this.mesh.dispose(false, true);
        }

        if (this.transform) {
            this.transform.dispose();
        }

        this.availableAttacks = [];
        super.dispose();
    }
}
