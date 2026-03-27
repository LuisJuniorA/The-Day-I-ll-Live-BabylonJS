import { Vector3, Quaternion } from "@babylonjs/core";
import { EnemyState } from "../../core/abstracts/EnemyState";
import { Enemy } from "../../core/abstracts/Enemy";
import type { HookPoint } from "../../core/engines/HookScanner";
import { EnemyChaseState } from "./EnemyChaseState";
import { HookScannerBehavior } from "../../gameplay/behaviors/HookScannerBehavior";

export class EnemyHookState extends EnemyState {
    public readonly name = "HookState";

    private _target: HookPoint;
    private readonly TOTAL_DURATION = 0.5; // On rallonge un peu pour voir l'effet
    private readonly STRETCH_TIME = 0.1; // Temps où seul le bras bouge

    private _isFinished = false;
    private _startRotation: Quaternion = new Quaternion();
    private _startPosition: Vector3 = new Vector3();

    constructor(target: HookPoint) {
        super();
        this._target = target;
    }

    public get targetPosition(): Vector3 {
        return this._target.position;
    }

    protected handleEnter(owner: Enemy): void {
        owner.velocity.setAll(0);
        this._startPosition.copyFrom(owner.position);

        if (!owner.transform.rotationQuaternion) {
            owner.transform.rotationQuaternion = Quaternion.FromEulerVector(
                owner.transform.rotation,
            );
        }
        this._startRotation.copyFrom(owner.transform.rotationQuaternion);
    }

    protected handleUpdate(owner: Enemy, dt: number): void {
        if (this._isFinished) return;

        const elapsed = this.timeInState;

        // --- PHASE 1 : LE BRAS SE LANCE (Anticipation) ---
        // On ne fait rien ici au niveau du mouvement du owner.position.
        // C'est le Slime.ts qui va voir l'augmentation du temps et étirer les vertices.

        if (elapsed < this.STRETCH_TIME) {
            // On peut quand même commencer à pivoter doucement vers la cible
            this._rotateTowardsTarget(owner, elapsed / this.STRETCH_TIME);
            return;
        }

        // --- PHASE 2 : LE CORPS SUIT (Propulsion) ---
        const travelElapsed = elapsed - this.STRETCH_TIME;
        const travelDuration = this.TOTAL_DURATION - this.STRETCH_TIME;
        const progress = Math.min(travelElapsed / travelDuration, 1);

        const toTarget = this._target.position.subtract(owner.position);
        const distance = toTarget.length();

        // Calcul de vitesse pour arriver à la fin du temps imparti
        const timeLeft = Math.max(travelDuration - travelElapsed, dt);
        const speed = distance / timeLeft;
        const moveVelocity = toTarget.normalize().scale(speed);

        owner.move(moveVelocity, dt);
        this._rotateTowardsTarget(owner, progress);

        if (distance < 0.2 || progress >= 1) {
            this._isFinished = true;
            this.finalizeHook(owner, owner.transform.rotationQuaternion!);
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

    private finalizeHook(owner: Enemy, finalRot: Quaternion): void {
        // On sature la rotation à la valeur cible exacte
        owner.transform.rotationQuaternion!.copyFrom(finalRot);

        // On repasse en ChaseState
        const nextState = new EnemyChaseState();

        // CRUCIAL : On ré-attache le scanner pour que le slime puisse
        // scanner un nouveau mur une fois arrivé sur celui-ci
        nextState.addBehavior(new HookScannerBehavior());

        owner.movementFSM.transitionTo(nextState);
    }
}
