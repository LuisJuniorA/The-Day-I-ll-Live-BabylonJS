import {
    Scene,
    AbstractMesh,
    VertexBuffer,
    Vector3,
    Scalar,
} from "@babylonjs/core";
import { Enemy } from "../../core/abstracts/Enemy";
import type { ProximitySystem } from "../../core/engines/ProximitySystem";
import type { ActionBehavior } from "../../core/interfaces/Behaviors";
import type { EnemyConfig } from "../../core/types/EnemyConfig";
import { NoiseUtils } from "../../utils/NoiseUtils";
import { HookScannerBehavior } from "../../gameplay/behaviors/HookScannerBehavior";
import { EnemyChaseState } from "../../states/enemy/EnemyChaseState";
import { EnemyHookState } from "../../states/enemy/EnemyHookState";
import type { EnemyState } from "../../core/abstracts/EnemyState";
import { NoAttack } from "../../gameplay/attacks/NoAttack";

export class Slime extends Enemy {
    private _initialBodyPositions: Float32Array;
    private _initialSoulPositions: Float32Array;

    private _time: number = 0;
    private _soulMesh: AbstractMesh | null = null;
    private _hookProgress: number = 0;
    private _lastValidHookDir: Vector3 = Vector3.Forward();

    private readonly WAVE_SPEED = 0.05;
    private readonly WAVE_AMPLITUDE = 0.5;
    private readonly WAVE_FREQUENCY = 3.0;

    private readonly BODY_STRETCH_FORCE = 0.5;

    constructor(
        scene: Scene,
        data: EnemyConfig,
        proximitySystem: ProximitySystem,
        mesh: AbstractMesh,
        soulMesh: AbstractMesh,
    ) {
        // Le super configure le mesh principal (body) pour les collisions environnementales
        super(scene, data, proximitySystem, mesh);

        this._soulMesh = soulMesh;

        if (this._soulMesh) {
            this._soulMesh.parent = this.transform;
            this._soulMesh.position.setAll(0);
        }

        this._setupStates();

        // Récupération des données de vertices pour la déformation
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

        // Animation de déformation (Procédural)
        scene.onBeforeRenderObservable.add(() => {
            this._animateSlime();
        });
    }

    private _setupStates(): void {
        const chase = new EnemyChaseState();
        chase.addBehavior(new HookScannerBehavior());
        this.movementFSM.transitionTo(chase);
    }

    private _animateSlime(): void {
        if (!this.mesh || this._initialBodyPositions.length === 0) return;

        this._time += this.WAVE_SPEED;
        const currentState = this.movementFSM.currentState;
        const isHooking = currentState instanceof EnemyHookState;

        // Transition fluide du déploiement du "bras"
        this._hookProgress = Scalar.Lerp(
            this._hookProgress,
            isHooking ? 1 : 0,
            isHooking ? 0.4 : 0.2,
        );

        let localHookDir = this._lastValidHookDir;
        let currentDynamicForce = this.BODY_STRETCH_FORCE;

        if (isHooking && currentState instanceof EnemyHookState) {
            const targetWorldPos = currentState.targetPosition;

            const distToTarget = Vector3.Distance(
                this.transform.absolutePosition,
                targetWorldPos,
            );

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

            // Force de stretch basée sur la distance à la cible
            currentDynamicForce = Math.max(0, distToTarget - 0.5);
        } else {
            localHookDir = Vector3.Up(); // Respiration simple quand immobile
        }

        // Appliquer la déformation sur le corps extérieur
        this._applyVertexDeformation(
            this.mesh,
            this._initialBodyPositions,
            localHookDir,
            currentDynamicForce,
            this.WAVE_AMPLITUDE,
            true,
        );

        // Appliquer la déformation sur le noyau intérieur (Soul)
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
            const vDir = vPos.normalizeToNew();

            const dot = Vector3.Dot(vDir, localDirection);
            const stretchInfluence = Math.pow(Math.max(0, dot), 16);

            const noiseInput =
                (vx + vy + vz) * this.WAVE_FREQUENCY + this._time;
            const noise =
                (NoiseUtils.perlin1D(noiseInput) - 0.5) * noiseAmplitude;

            const stretchDistance =
                stretchForce * this._hookProgress * stretchInfluence;

            positions[i] = vx + localDirection.x * stretchDistance + vx * noise;
            positions[i + 1] =
                vy + localDirection.y * stretchDistance + vy * noise;
            positions[i + 2] =
                vz + localDirection.z * stretchDistance + vz * noise;

            // Écrasement au sol si le slime est au repos
            if (applyFloorSquash && vy < 0.1 && this._hookProgress < 0.1) {
                positions[i + 1] *= 0.6;
            }
        }

        mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
        mesh.refreshBoundingInfo({});
    }

    public getNextAttack(): ActionBehavior {
        return new NoAttack();
    }

    public override getChaseState(): EnemyState {
        const state = new EnemyChaseState();
        state.addBehavior(new HookScannerBehavior());
        return state;
    }

    public playIdle(): void {}
    public playMove(): void {}
}
