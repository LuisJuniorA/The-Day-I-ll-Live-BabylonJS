import { Vector3, Quaternion } from "@babylonjs/core";
import { EnemyState } from "../../core/abstracts/EnemyState";
import { Enemy } from "../../core/abstracts/Enemy";
import type { HookPoint } from "../../core/engines/HookScanner";
import { EnemyChaseState } from "./EnemyChaseState";
import { HookScannerBehavior } from "../../gameplay/behaviors/HookScannerBehavior";

export class EnemyHookState extends EnemyState {
    public readonly name = "HookState";
    private _target: HookPoint;
    private readonly TOTAL_DURATION = 0.5;
    private readonly STRETCH_TIME = 0.1;

    private _isFinished = false;
    private _startRotation: Quaternion = new Quaternion();
    private _startPosition: Vector3 = new Vector3();

    constructor(target: HookPoint) {
        super();
        this._target = target;
    }

    // Le getter indispensable pour Slime.ts
    public get targetPosition(): Vector3 {
        return this._target.position;
    }

    protected handleEnter(owner: Enemy): void {
        this._isFinished = false;
        this._startPosition.copyFrom(owner.position);

        // Stop immédiat des forces physiques pour éviter les TP
        owner.velocity.setAll(0);

        if (!owner.transform.rotationQuaternion) {
            owner.transform.rotationQuaternion = Quaternion.FromEulerVector(
                owner.transform.rotation,
            );
        }
        if (owner.mesh) owner.mesh.alwaysSelectAsActiveMesh = true;
        this._startRotation.copyFrom(owner.transform.rotationQuaternion);
    }

    protected handleUpdate(owner: Enemy, _dt: number): void {
        if (this._isFinished) return;

        const elapsed = this.timeInState;

        // Phase 1 : Préparation / Stretch (Immobile)
        if (elapsed < this.STRETCH_TIME) {
            this._rotateTowardsTarget(owner, elapsed / this.STRETCH_TIME);
            return;
        }

        // Phase 2 : Vol
        const travelElapsed = elapsed - this.STRETCH_TIME;
        const travelDuration = this.TOTAL_DURATION - this.STRETCH_TIME;
        const progress = Math.min(travelElapsed / travelDuration, 1);

        // Interpolation directe pour éviter les saccades du moteur physique
        // On utilise Lerp pour la position car on connaît l'arrivée exacte
        const newPos = Vector3.Lerp(
            this._startPosition,
            this._target.position,
            progress,
        );
        owner.position.copyFrom(newPos);

        this._rotateTowardsTarget(owner, progress);

        if (progress >= 1) {
            this._isFinished = true;
            this.finalizeHook(owner);
        }
    }

    private _rotateTowardsTarget(owner: Enemy, ratio: number): void {
        let forward = Vector3.Cross(this._target.normal, Vector3.Right());
        if (forward.length() < 0.1)
            forward = Vector3.Cross(this._target.normal, Vector3.Forward());

        const targetRot = Quaternion.FromLookDirectionLH(
            forward.normalize(),
            this._target.normal,
        );
        Quaternion.SlerpToRef(
            this._startRotation,
            targetRot,
            ratio,
            owner.transform.rotationQuaternion!,
        );
    }

    private finalizeHook(owner: Enemy): void {
        const nextState = new EnemyChaseState();
        // IMPORTANT : On ne rajoute le scanner QUE quand on a fini le saut
        nextState.addBehavior(new HookScannerBehavior());
        owner.movementFSM.transitionTo(nextState);
        if (owner.mesh) owner.mesh.alwaysSelectAsActiveMesh = false;
    }
}
