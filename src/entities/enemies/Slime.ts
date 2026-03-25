import { Scene, AbstractMesh, VertexBuffer } from "@babylonjs/core";
import { Enemy } from "../../core/abstracts/Enemy";
import type { ProximitySystem } from "../../core/engines/ProximitySystem";
import type { ActionBehavior } from "../../core/interfaces/Behaviors";
import type { EnemyConfig } from "../../core/types/EnemyConfig";
import { EffroiClaw } from "../../gameplay/attacks/EffroiAttacks";
import { NoiseUtils } from "../../utils/NoiseUtils";
import { HookScannerBehavior } from "../../gameplay/behaviors/HookScannerBehavior"; // Ton nouveau behavior
import { EnemyChaseState } from "../../states/enemy/EnemyChaseState";
import type { EnemyState } from "../../core/abstracts/EnemyState";

export class Slime extends Enemy {
    private _initialPositions: Float32Array;
    private _time: number = 0;

    // Paramètres de l'animation
    private readonly WAVE_SPEED = 0.05;
    private readonly WAVE_AMPLITUDE = 0.4;
    private readonly WAVE_FREQUENCY = 4.0;

    protected availableAttacks: ActionBehavior[] = [new EffroiClaw()];

    constructor(
        scene: Scene,
        data: EnemyConfig,
        proximitySystem: ProximitySystem,
        mesh: AbstractMesh,
    ) {
        super(scene, data, proximitySystem, mesh);

        // --- 1. CONFIGURATION INITIALE DES ÉTATS ---
        this._setupStates();

        // --- 2. LOGIQUE DE VERTEX ANIMATION ---
        const positions = this.mesh!.getVerticesData(VertexBuffer.PositionKind);
        this._initialPositions = positions
            ? new Float32Array(positions)
            : new Float32Array();

        scene.onBeforeRenderObservable.add(() => {
            this._animateSlimeBody();
        });
    }

    /**
     * Configure les états spécifiques du Slime avec leurs comportements
     */
    private _setupStates(): void {
        const chase = new EnemyChaseState();

        // On injecte le comportement de Hook uniquement pour le Slime !
        // Ce behavior sera mis à jour automatiquement par EnemyState.onUpdate
        chase.addBehavior(new HookScannerBehavior());

        // On force le démarrage en Chase pour le test (ou Idle selon ton besoin)
        this.movementFSM.transitionTo(chase);
    }

    private _animateSlimeBody(): void {
        if (!this.mesh || this._initialPositions.length === 0) return;

        this._time += this.WAVE_SPEED;
        const positions = this.mesh.getVerticesData(VertexBuffer.PositionKind);
        if (!positions) return;

        for (let i = 0; i < positions.length; i += 3) {
            const vx = this._initialPositions[i];
            const vy = this._initialPositions[i + 1];
            const vz = this._initialPositions[i + 2];

            const input1 = (vx + vy + vz) * this.WAVE_FREQUENCY + this._time;
            const input2 =
                (vx - vy + vz) * (this.WAVE_FREQUENCY * 2.5) + this._time * 1.5;
            let noise = NoiseUtils.perlin1D(input1) * 1.0;
            noise += NoiseUtils.perlin1D(input2) * 0.5;

            let displacement =
                Math.pow(noise - 0.5, 2) *
                Math.sign(noise - 0.5) *
                this.WAVE_AMPLITUDE;

            const baseSquash = 0.65;

            if (vy < 0) {
                const ratio = -vy;
                const floorContact = Math.max(
                    -0.95,
                    -ratio + (noise - 0.5) * 0.1,
                );
                positions[i + 1] = floorContact * baseSquash;
                positions[i] = vx + vx * displacement;
                positions[i + 2] = vz + vz * displacement;
            } else {
                positions[i] = vx + vx * displacement;
                positions[i + 1] = (vy + vy * displacement) * baseSquash;
                positions[i + 2] = vz + vz * displacement;
            }
        }

        this.mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
    }

    public getNextAttack(): ActionBehavior {
        return this.availableAttacks[0];
    }

    public override getChaseState(): EnemyState {
        const state = new EnemyChaseState();
        state.addBehavior(new HookScannerBehavior());
        return state;
    }

    // Le slime n'a pas forcément besoin de mixer ces animations avec les siennes,
    // mais on laisse les signatures pour la FSM.
    public playIdle(): void {}
    public playMove(): void {}
}
