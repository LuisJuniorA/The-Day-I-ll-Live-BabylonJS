import {
    Scene,
    AbstractMesh,
    Vector3,
    Scalar,
    VertexBuffer,
} from "@babylonjs/core";
import { Enemy } from "../../core/abstracts/Enemy";
import { ProximitySystem } from "../../core/engines/ProximitySystem";
import type { EnemyConfig } from "../../core/types/EnemyConfig";
import type { ActionBehavior } from "../../core/interfaces/Behaviors";
import type { EnemyState } from "../../core/abstracts/EnemyState";
import { NoiseUtils } from "../../utils/NoiseUtils";
import { BossChargeState } from "../../states/enemy/BossChargeState";
import { type HookPoint } from "../../core/engines/HookScanner";
import { BossHookScanner } from "../../core/engines/BossHookScanner";
import { BossClawAttackState } from "../../states/enemy/BossClawAttackState";
import { BossChaseState } from "../../states/enemy/BossChaseState";
import {
    OnBossDefeated,
    OnEntityDamaged,
} from "../../core/interfaces/CombatEvent";
import { AudioManager } from "../../managers/AudioManager";

// --- DÉFINITION DES COMPORTEMENTS D'ATTAQUE ---

export class BossClaw implements ActionBehavior {
    public readonly animationName = "claw";
    public readonly duration = 800;
    public readonly damageMoment = 400;
    public readonly range = 3.5;
    public cooldown = 2000;
    public lastUsed = 0;
    public damage = 25;

    public executeEffect(owner: Enemy): void {
        this.lastUsed = Date.now();
        if (owner instanceof ShadowBoss && owner.targetTransform) {
            const targetPos = owner.targetTransform.absolutePosition;

            // Scanner le meilleur point pour l'attaque
            const bestHook = BossHookScanner.getBestPoint(
                owner._scene,
                owner.transform.absolutePosition,
                targetPos,
            );

            // Si on a un hook, on l'utilise, sinon la position du joueur
            const target = bestHook ? bestHook.position : targetPos;

            const clawState = new BossClawAttackState(target);
            owner.attackFSM.transitionTo(clawState);
            AudioManager.getInstance().playSfx("IMPACT");
        }
    }
    public onHit(owner: Enemy, targetId: string): void {
        OnEntityDamaged.notifyObservers({
            targetId: targetId,
            attackerId: owner.id,
            amount: 15,
            position: owner.position.clone(),
            attackerFaction: owner.faction,
        });
    }
}

export class BossCharge implements ActionBehavior {
    public readonly animationName = "charge";
    public readonly duration = 1500;
    public readonly damageMoment = 500;
    public readonly range = 12;
    public cooldown = 6000;
    public lastUsed = 0;
    public damage = 40;

    // Dans BossCharge.ts
    public executeEffect(owner: Enemy): void {
        this.lastUsed = Date.now();

        if (owner instanceof ShadowBoss && owner.targetTransform) {
            // CORRECTION : Clone la position pour ne pas modifier le joueur
            const targetPos = owner.targetTransform.absolutePosition.clone();
            targetPos.y += 0.5; // Un petit offset léger suffit

            const bestHook = BossHookScanner.getBestPoint(
                owner._scene,
                owner.transform.absolutePosition,
                targetPos,
            );

            if (bestHook) {
                owner.startCharging(bestHook);
                AudioManager.getInstance().playSfx("IMPACT");
            } else {
                console.warn("Scanner: Aucun mur trouvé derrière la cible");
                owner.movementFSM.transitionTo(new BossChaseState());
            }
        }
    }
    public onHit(owner: Enemy, targetId: string): void {
        OnEntityDamaged.notifyObservers({
            targetId: targetId,
            attackerId: owner.id,
            amount: 15,
            position: owner.position.clone(),
            attackerFaction: owner.faction,
        });
    }
}

// --- CLASSE PRINCIPALE SHADOW BOSS ---

export class ShadowBoss extends Enemy {
    public readonly type: string = "shadowboss";

    private _initialBodyPositions: Float32Array;
    private _initialSoulPositions: Float32Array;
    private _time: number = 0;
    private _soulMesh: AbstractMesh | null = null;

    // Propriétés du hook
    private _hookProgress: number = 0;
    private _lastValidHookDir: Vector3 = Vector3.Forward();
    private _currentAttack: ActionBehavior | null = null; // Ajout du suivi

    private readonly WAVE_SPEED = 0.03;
    private readonly WAVE_AMPLITUDE = 0.2;
    private readonly WAVE_FREQUENCY = 1.5;
    private readonly BODY_STRETCH_FORCE = 1.2; // Plus fort pour le boss

    constructor(
        scene: Scene,
        data: EnemyConfig,
        proximitySystem: ProximitySystem,
        mesh: AbstractMesh,
        soulMesh: AbstractMesh,
    ) {
        super(scene, data, proximitySystem, mesh);
        this._soulMesh = soulMesh;

        if (this._soulMesh) {
            this._soulMesh.parent = this.transform;
            this._soulMesh.position.setAll(0);
        }

        this._setupStates();

        const bodyPositions = this.mesh!.getVerticesData(
            VertexBuffer.PositionKind,
        );
        this._initialBodyPositions = bodyPositions
            ? new Float32Array(bodyPositions)
            : new Float32Array();

        if (this._soulMesh) {
            const soulPositions = this._soulMesh.getVerticesData(
                VertexBuffer.PositionKind,
            );
            this._initialSoulPositions = soulPositions
                ? new Float32Array(soulPositions)
                : new Float32Array();
        } else {
            this._initialSoulPositions = new Float32Array();
        }

        scene.onBeforeRenderObservable.add(() => this._animateBoss());

        this.onDeath = () => {
            this.hasToBeDeleted = false;

            // 1. Arrêt des FSM
            this.movementFSM.dispose();
            this.attackFSM.dispose();

            // 2. Collision off
            if (this.mesh) {
                this.mesh.checkCollisions = false;
            }

            AudioManager.getInstance().playSfx("MONSTER_ROAR");
            // 4. TRIGGER DE VICTOIRE
            // On notifie les abonnés (ton UI, ton Manager, etc.)
            OnBossDefeated.notifyObservers({ bossId: this.id });

            // 5. Suppression finale
            setTimeout(() => {
                this.hasToBeDeleted = true;
            }, 5000);
        };
    }

    private _setupStates(): void {
        const chase = new BossChaseState();
        this.movementFSM.transitionTo(chase);
    }

    private _animateBoss(): void {
        if (!this.mesh || this._initialBodyPositions.length === 0) return;

        this._time += this.WAVE_SPEED;

        // Vérifie l'état de mouvement OU l'état d'attaque
        const moveState = this.movementFSM.currentState;
        const attackState = this.attackFSM.currentState;

        const isHooking =
            moveState instanceof BossChargeState ||
            attackState instanceof BossClawAttackState;

        // Transition fluide du hook
        this._hookProgress = Scalar.Lerp(
            this._hookProgress,
            isHooking ? 1 : 0,
            isHooking ? 0.3 : 0.1,
        );

        let localHookDir = this._lastValidHookDir;
        let currentDynamicForce = this.BODY_STRETCH_FORCE;

        // Calcul de la direction du hook
        if (
            (isHooking && moveState instanceof BossChargeState) ||
            attackState instanceof BossClawAttackState
        ) {
            const targetWorldPos =
                attackState instanceof BossClawAttackState
                    ? attackState.targetPosition
                    : (moveState as BossChargeState).targetPosition;
            const worldDir = targetWorldPos
                .subtract(this.transform.absolutePosition)
                .normalize();

            this.transform.computeWorldMatrix(true);
            const invMatrix = this.transform.getWorldMatrix().clone().invert();
            localHookDir = Vector3.TransformNormal(
                worldDir,
                invMatrix,
            ).normalize();
            this._lastValidHookDir.copyFrom(localHookDir);

            currentDynamicForce = Math.max(
                0,
                Vector3.Distance(
                    this.transform.absolutePosition,
                    targetWorldPos,
                ) - 1,
            );
        } else {
            localHookDir = Vector3.Up();
        }

        // Déformation Corps
        this._applyVertexDeformation(
            this.mesh,
            this._initialBodyPositions,
            localHookDir,
            currentDynamicForce,
            this.WAVE_AMPLITUDE,
            true,
        );

        // Déformation Noyau
        if (this._soulMesh && this._initialSoulPositions.length > 0) {
            this._applyVertexDeformation(
                this._soulMesh,
                this._initialSoulPositions,
                localHookDir,
                currentDynamicForce * 0.8,
                0.05,
                false,
            );
        }
    }

    private _applyVertexDeformation(
        mesh: AbstractMesh,
        initialPositions: Float32Array,
        localDirection: Vector3,
        stretchForce: number,
        noiseAmplitude: number,
        applyFloorSquash: boolean,
    ): void {
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
        if (!positions) return;

        for (let i = 0; i < positions.length; i += 3) {
            const vx = initialPositions[i];
            const vy = initialPositions[i + 1];
            const vz = initialPositions[i + 2];
            const vPos = new Vector3(vx, vy, vz);
            const dot = Vector3.Dot(vPos.normalizeToNew(), localDirection);
            const stretchInfluence = Math.pow(Math.max(0, dot), 16);
            const noise =
                (NoiseUtils.perlin1D(
                    (vx + vy + vz) * this.WAVE_FREQUENCY + this._time,
                ) -
                    0.5) *
                noiseAmplitude;
            const stretchDistance =
                stretchForce * this._hookProgress * stretchInfluence;

            positions[i] = vx + localDirection.x * stretchDistance + vx * noise;
            positions[i + 1] =
                vy + localDirection.y * stretchDistance + vy * noise;
            positions[i + 2] =
                vz + localDirection.z * stretchDistance + vz * noise;

            if (applyFloorSquash && vy < 0.1 && this._hookProgress < 0.1)
                positions[i + 1] *= 0.6;
        }
        mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
        mesh.refreshBoundingInfo({});
    }

    // Méthodes requises
    public startCharging(targetHook: HookPoint): void {
        if (!this.targetTransform) return;

        // On transitionne vers l'état de charge avec la position actuelle du joueur
        const chargeState = new BossChargeState(targetHook);
        this.attackFSM.transitionTo(chargeState);
        this.movementFSM.transitionTo(chargeState);
    }
    public getNextAttack(): ActionBehavior {
        // 1. Calcul du ratio de vie (1.0 = plein, 0.0 = mort)
        // Assure-toi que 'this.health' est disponible, sinon utilise 'this.data.health'
        const healthRatio = this.stats.hp / this.stats.maxHp;

        // 2. Logique d'agressivité :
        // Plus le boss est bas en vie, plus il a de chances de charger (plus agressif)
        // À 100% de vie : 70% Claw, 30% Charge
        // À 20% de vie : 30% Claw, 70% Charge
        const chargeProbability = 1.0 - healthRatio * 0.7; // Ajuste ces chiffres selon tes besoins

        const roll = Math.random();

        if (roll < chargeProbability) {
            this._currentAttack = new BossCharge();
        } else {
            this._currentAttack = new BossClaw();
        }

        return this._currentAttack;
    }
    public override getChaseState(): EnemyState {
        return new BossChaseState();
    }
    public playIdle(): void {}
    public playMove(): void {}

    public get currentAttack(): ActionBehavior | null {
        return this._currentAttack;
    }
}
